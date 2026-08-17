/**
 * Every server call the frontend makes.
 *
 * Listings, search, facet counts and categories all come from the API now;
 * `data/marketplace.ts` is no longer a data source for them. Each response
 * shape below mirrors a DTO in `backend/src/types/dto.ts`, so a change there
 * shows up here as a type error rather than as undefined at runtime.
 */

/** Base URL of the backend API. Override with VITE_API_URL in a .env file. */
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:5000";

type ApiEnvelope<T> = { success: boolean; data: T; message?: string };

/** The signed-in user, as /api/auth/me reports them. */
export type AuthUser = {
  id: number;
  email: string;
  name: string;
};

/**
 * Every request goes through here.
 *
 * The API is on a different origin in development, so `credentials: "include"`
 * is required or the browser omits the session cookie and the server sees a
 * stranger. Reads do not need the cookie, but sending it costs nothing and
 * keeps one code path.
 *
 * Throws with the server's own message when a request fails, since that wording
 * is written to be read by a person; a network failure or non-JSON response
 * becomes a generic message rather than an unhandled parse error.
 */
async function apiRequest<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: init?.method ?? "GET",
    credentials: "include",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  // A 500 behind a proxy, or a dropped connection, can produce a body that is
  // not JSON at all. Falling back keeps the thrown error readable either way.
  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !body?.success) {
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return body.data;
}

export const fetchCurrentUser = () => apiRequest<AuthUser | null>("/api/auth/me");

export const registerUser = (input: {
  name: string;
  email: string;
  password: string;
}) => apiRequest<AuthUser>("/api/auth/register", { method: "POST", body: input });

export const loginUser = (input: { email: string; password: string }) =>
  apiRequest<AuthUser>("/api/auth/login", { method: "POST", body: input });

export const logoutUser = () =>
  apiRequest<{ loggedOut: boolean }>("/api/auth/logout", { method: "POST" });

/** Which third-party sign-ins the server actually has credentials for. */
export const fetchAuthProviders = () =>
  apiRequest<{ google: boolean }>("/api/auth/providers");

/** A link, not a fetch: the browser itself must visit Google. */
export const googleSignInUrl = `${API_BASE}/api/auth/google`;

/* ------------------------------------------------------------------ listings */

/** A listing as it appears in a grid. Mirrors ListingDTO. */
export type ApiListing = {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  audience: string;
  brand: string | null;
  size: string | null;
  colour: string | null;
  condition: string;
  price: number;
  city: string;
  /** Neighbourhood, or null when the listing records only a city. */
  location: string | null;
  postedAt: string;
  image: string;
};

/**
 * Just the fields a grid card renders.
 *
 * `ApiListing` satisfies this, which is what the migrated pages pass. It exists
 * as its own type so the card states what it actually needs rather than
 * demanding a whole listing — the Search page still supplies rows from
 * `lib/search.ts` while its migration is finished, and those satisfy this too.
 */
export type ListingCardData = Pick<
  ApiListing,
  | "id"
  | "title"
  | "image"
  | "condition"
  | "price"
  | "categoryLabel"
  | "location"
  | "city"
  | "postedAt"
>;

/** Mirrors ListingSellerDTO. The full phone number is never sent. */
export type ApiSeller = {
  name: string;
  memberSince: string;
  phoneMasked: string | null;
};

/** Mirrors ListingDetailDTO. */
export type ApiListingDetail = ApiListing & {
  description: string;
  images: string[];
  seller: ApiSeller;
  viewCount: number;
  status: string;
};

export type ApiCategory = {
  slug: string;
  label: string;
  audience: string;
  total: number;
  image: string;
};

export type ApiDashboard = {
  totalActive: number;
  recent: ApiListing[];
  categories: ApiCategory[];
};

export type ApiFacetValue = { value: string; label: string; count: number };

export type ApiFacets = {
  category: ApiFacetValue[];
  audience: ApiFacetValue[];
  city: ApiFacetValue[];
  condition: ApiFacetValue[];
  size: ApiFacetValue[];
  colour: ApiFacetValue[];
  /** Price bands, keyed by band id (e.g. "5000-20000"). */
  price: ApiFacetValue[];
};

export type ApiSearchResult = {
  items: ApiListing[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  sort: string;
  /** True when the exact search missed and trigram similarity was used. */
  fuzzy: boolean;
  /** Closest real title to a misspelled query, for "did you mean". */
  suggestion: string | null;
  facets: ApiFacets;
};

export type ApiListingPage = {
  items: ApiListing[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
};

/**
 * Points an image path at the API origin.
 *
 * The server stores and returns paths like `/images/foo.jpg`, which are correct
 * relative to *it*. Left alone in the browser they resolve against the Vite dev
 * origin instead, where the SPA fallback answers with index.html — a 200 that
 * is not an image, so every picture silently fails to decode rather than
 * erroring visibly.
 *
 * Applied at the fetch boundary below rather than in each component, so a new
 * component cannot forget it. Absolute URLs are passed through untouched.
 */
export const imageUrl = (path: string): string =>
  /^https?:\/\//.test(path) ? path : `${API_BASE}${path}`;

const withImage = <T extends { image: string }>(listing: T): T => ({
  ...listing,
  image: imageUrl(listing.image),
});

/** Everything the homepage renders, in one round trip. */
export const fetchDashboard = async (): Promise<ApiDashboard> => {
  const data = await apiRequest<ApiDashboard>("/api/dashboard");
  return {
    ...data,
    recent: data.recent.map(withImage),
    categories: data.categories.map(withImage),
  };
};

export const fetchCategories = async (audience?: string) => {
  const data = await apiRequest<ApiCategory[]>(
    `/api/listing-categories${audience ? `?audience=${encodeURIComponent(audience)}` : ""}`,
  );
  return data.map(withImage);
};

export const fetchListings = async (params: {
  category?: string;
  audience?: string;
  page?: number;
  perPage?: number;
}): Promise<ApiListingPage> => {
  const data = await apiRequest<ApiListingPage>(`/api/listings?${toQuery(params)}`);
  return { ...data, items: data.items.map(withImage) };
};

export const fetchListing = async (id: string): Promise<ApiListingDetail> => {
  const data = await apiRequest<ApiListingDetail>(
    `/api/listings/${encodeURIComponent(id)}`,
  );
  return { ...withImage(data), images: data.images.map(imageUrl) };
};

/**
 * Faceted search. Every filter, the sort and the page are the server's job —
 * the frontend sends the query string and renders what comes back.
 *
 * Repeatable filters (condition, size, colour, city) are passed as arrays and
 * serialised as repeated keys, which is what the validator expects.
 */
export const searchListings = async (
  params: SearchParams,
): Promise<ApiSearchResult> => {
  const data = await apiRequest<ApiSearchResult>(
    `/api/search/listings?${toQuery(params)}`,
  );
  return { ...data, items: data.items.map(withImage) };
};

export type SearchParams = {
  q?: string;
  category?: string;
  audience?: string;
  city?: string | string[];
  condition?: string | string[];
  size?: string | string[];
  colour?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  postedWithin?: number;
  sort?: string;
  page?: number;
  perPage?: number;
};

/**
 * Turns a params object into a query string, dropping anything empty so the URL
 * carries only filters that are actually set.
 */
function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry !== undefined && entry !== null && entry !== "") {
          search.append(key, String(entry));
        }
      }
      continue;
    }

    search.set(key, String(value));
  }

  return search.toString();
}

/* --------------------------------------------------------- listing writes */

/** A listing as its owner sees it — includes sold and expired. */
export type ApiMyListing = ApiListing & {
  description: string;
  subcategory: string | null;
  expiresAt: string;
  status: string;
  viewCount: number;
};

export type NewListingBody = {
  title: string;
  description: string;
  /** Main category slug. Required — the subcategory is not. */
  category: string;
  subcategory?: string;
  condition: string;
  price: number;
  city: string;
  location?: string;
  /** Paths returned by uploadListingImages, not arbitrary URLs. */
  images: string[];
};

/**
 * The signed-in user's own listings.
 *
 * No user id is sent: the server reads it from the session, so this cannot be
 * pointed at somebody else's listings by changing a parameter.
 */
export const fetchMyListings = async (): Promise<ApiMyListing[]> => {
  const data = await apiRequest<ApiMyListing[]>("/api/listings/mine");
  return data.map(withImage);
};

export const createListing = (body: NewListingBody) =>
  apiRequest<ApiListingDetail>("/api/listings", { method: "POST", body });

export const updateListing = (id: string, body: Partial<NewListingBody>) =>
  apiRequest<ApiListingDetail>(`/api/listings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
  });

export const deleteListing = (id: string) =>
  apiRequest<{ deleted: boolean }>(`/api/listings/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

export const markListingSold = (id: string) =>
  apiRequest<ApiListingDetail>(`/api/listings/${encodeURIComponent(id)}/sold`, {
    method: "POST",
  });

export const renewListing = (id: string) =>
  apiRequest<ApiListingDetail>(`/api/listings/${encodeURIComponent(id)}/renew`, {
    method: "POST",
  });

/* -------------------------------------------------------------------- upload */

export type UploadedImage = { path: string };

/** Matches the server's own cap, so the UI can refuse before uploading. */
export const MAX_LISTING_PHOTOS = 8;

/**
 * Uploads listing photos and returns the paths the server stored them at.
 *
 * Multipart, so no Content-Type header is set by hand — the browser has to add
 * the multipart boundary itself. Requires a session; the server answers 401
 * otherwise and that surfaces as a thrown error here.
 */
export async function uploadListingImages(
  files: File[],
): Promise<UploadedImage[]> {
  const form = new FormData();
  for (const file of files) form.append("photos", file);

  const res = await fetch(`${API_BASE}/api/listings/images`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<{
    images: UploadedImage[];
  }> | null;

  if (!res.ok || !body?.success) {
    throw new Error(body?.message ?? `Upload failed (${res.status})`);
  }
  return body.data.images;
}
