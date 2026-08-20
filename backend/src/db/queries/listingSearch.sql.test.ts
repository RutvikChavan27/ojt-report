import { describe, expect, it } from "vitest";
import { buildListingWhere, type ListingFilters } from "./listingSearch.sql";

describe("buildListingWhere", () => {
  it("always requires status = 'active', with no other clause when no filter is set", () => {
    const where = buildListingWhere({});
    expect(where.text).toBe("l.status = 'active'");
    expect(where.values).toEqual([]);
  });

  it("combines several filters, one clause and one bound value each", () => {
    const filters: ListingFilters = {
      categorySlug: "mobiles",
      city: "Pune",
      conditions: ["Good", "Fair"],
      minPrice: 500,
      maxPrice: 5000,
    };

    const where = buildListingWhere(filters);

    expect(where.text).toContain("l.category_slug = $1");
    expect(where.text).toContain("l.city = $2");
    expect(where.text).toContain("l.condition = ANY($3::listing_condition[])");
    expect(where.text).toContain("l.price >= $4");
    expect(where.text).toContain("l.price <= $5");
    expect(where.values).toEqual([
      "mobiles",
      "Pune",
      ["Good", "Fair"],
      500,
      5000,
    ]);
  });

  it("drops exactly the clause for a filter that is cleared, leaving the rest untouched", () => {
    const withCity = buildListingWhere({ categorySlug: "mobiles", city: "Pune" });
    const cityCleared = buildListingWhere({ categorySlug: "mobiles" });

    expect(withCity.text).toContain("l.city =");
    expect(cityCleared.text).not.toContain("l.city =");
    // The surviving filter's placeholder does not shift just because another
    // filter was removed — each filter's own presence decides its own $n.
    expect(cityCleared.text).toContain("l.category_slug = $1");
    expect(cityCleared.values).toEqual(["mobiles"]);
  });

  it("continues placeholder numbering from startIndex, for a caller that already bound $1", () => {
    const where = buildListingWhere({ categorySlug: "mobiles" }, 1);
    expect(where.text).toBe("l.status = 'active'\n       AND l.category_slug = $2");
  });

  it("treats an empty conditions/sizes/colours array as no filter at all", () => {
    const where = buildListingWhere({ conditions: [], sizes: [], colours: [] });
    expect(where.text).toBe("l.status = 'active'");
    expect(where.values).toEqual([]);
  });
});
