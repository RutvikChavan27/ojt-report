import type { Request } from "express";
import { parseGender } from "../utils/gender";
import type { Gender } from "../types/dto";

export type SearchQuery = { q: string; gender?: Gender };

/** Validates ?q=&gender= for the search endpoint. Returns null when q is missing/blank. */
export function parseSearchQuery(query: Request["query"]): SearchQuery | null {
  const q = typeof query.q === "string" ? query.q.trim() : "";
  if (!q) return null;

  return { q, gender: parseGender(query.gender) };
}
