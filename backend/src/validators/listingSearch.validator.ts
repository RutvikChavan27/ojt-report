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

/** No real size or colour is longer than this, or selected more times. */
const MAX_VALUE_LENGTH = 40;
const MAX_LIST_VALUES = 20;

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

/**
 * Accepts repeated params or one comma-separated value.
 *
 * `allowed` restricts the result to a known set where one exists. Sizes and
 * colours are open-ended seed data rather than enums, so they are length-capped
 * instead — they still reach SQL as bind parameters either way.
 */
function parseList(
  value: unknown,
  allowed?: Set<string>,
): string[] | undefined {
  const raw = Array.isArray(value) ? value : [first(value)];
  const parsed = raw
    .filter((entry): entry is string => typeof entry === "string")
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry.length <= MAX_VALUE_LENGTH)
    .filter((entry) => !allowed || allowed.has(entry));

  // Capped so a hand-written URL cannot turn one request into a huge ANY(...).
  const unique = [...new Set(parsed)].slice(0, MAX_LIST_VALUES);
  return unique.length > 0 ? unique : undefined;
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
    conditions: parseList(queryString.condition, CONDITIONS),
    sizes: parseList(queryString.size),
    colours: parseList(queryString.colour),
    minPrice,
    maxPrice,
    postedWithinDays: parseNumber(queryString.postedWithin),
    sort,
    page: parsePositiveInt(queryString.page, 1),
    perPage: parsePositiveInt(queryString.perPage, 24),
  };
}
