/**
 * Parses and bounds the search query string.
 *
 * Everything here is defensive: values reach SQL as bind parameters regardless,
 * but rejecting nonsense early means a bad request is a 400 or a sane default
 * rather than a database error.
 */
import type { Request } from "express";
import type { SortKey } from "../db/queries/listingSearch.sql";
import type { SearchRequest } from "../services/listingSearch.service";

const SORTS = new Set<SortKey>(["relevance", "newest", "price_asc", "price_desc"]);
const AUDIENCES = new Set(["Men", "Women", "Unisex"]);
const CONDITIONS = new Set(["New with tags", "Like new", "Good", "Fair"]);

/** Longer than this is not a real search; trigram cost grows with length. */
const MAX_QUERY_LENGTH = 120;

const first = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
};

function parseNumber(value: unknown): number | undefined {
  const raw = first(value);
  if (raw === undefined || raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(first(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Accepts repeated params or one comma-separated value, keeping known values. */
function parseConditions(value: unknown): string[] | undefined {
  const raw = Array.isArray(value) ? value : [first(value)];
  const parsed = raw
    .filter((entry): entry is string => typeof entry === "string")
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter((entry) => CONDITIONS.has(entry));

  return parsed.length > 0 ? [...new Set(parsed)] : undefined;
}

function parseAudience(value: unknown): string | undefined {
  const raw = first(value);
  if (!raw) return undefined;
  const normalised = `${raw.charAt(0).toUpperCase()}${raw.slice(1).toLowerCase()}`;
  return AUDIENCES.has(normalised) ? normalised : undefined;
}

export function parseSearchRequest(queryString: Request["query"]): SearchRequest {
  const q = first(queryString.q)?.trim().slice(0, MAX_QUERY_LENGTH) || undefined;

  const sortRaw = first(queryString.sort) as SortKey | undefined;
  // Ranking needs a query to rank against, so default to newest without one.
  const sort: SortKey =
    sortRaw && SORTS.has(sortRaw) ? sortRaw : q ? "relevance" : "newest";

  let minPrice = parseNumber(queryString.minPrice);
  let maxPrice = parseNumber(queryString.maxPrice);
  // A reversed range would match nothing at all; treat it as a typo and swap.
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  return {
    q,
    categorySlug: first(queryString.category) || undefined,
    audience: parseAudience(queryString.audience),
    city: first(queryString.city) || undefined,
    conditions: parseConditions(queryString.condition),
    minPrice,
    maxPrice,
    postedWithinDays: parseNumber(queryString.postedWithin),
    sort,
    page: parsePositiveInt(queryString.page, 1),
    perPage: parsePositiveInt(queryString.perPage, 24),
  };
}
