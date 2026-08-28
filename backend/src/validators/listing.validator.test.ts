import { describe, expect, it } from "vitest";
import { normalizeIndianMobile, parseListingPatch, parseNewListing } from "./listing.validator";

describe("normalizeIndianMobile", () => {
  it("accepts a bare 10-digit number", () => {
    expect(normalizeIndianMobile("9876543210")).toBe("9876543210");
  });

  it("strips spaces and dashes", () => {
    expect(normalizeIndianMobile("98765 43210")).toBe("9876543210");
    expect(normalizeIndianMobile("98765-43210")).toBe("9876543210");
  });

  it("strips a +91/91 country code", () => {
    expect(normalizeIndianMobile("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianMobile("919876543210")).toBe("9876543210");
  });

  it("strips a leading trunk 0", () => {
    expect(normalizeIndianMobile("09876543210")).toBe("9876543210");
  });

  it("rejects a number not starting 6-9", () => {
    expect(normalizeIndianMobile("5876543210")).toBeNull();
    expect(normalizeIndianMobile("1234567890")).toBeNull();
  });

  it("rejects the wrong number of digits", () => {
    expect(normalizeIndianMobile("987654321")).toBeNull();
    expect(normalizeIndianMobile("98765432101")).toBeNull();
  });

  it("rejects a landline-shaped or empty input", () => {
    expect(normalizeIndianMobile("011-2345-6789")).toBeNull();
    expect(normalizeIndianMobile("")).toBeNull();
    expect(normalizeIndianMobile("not a number")).toBeNull();
  });
});

const VALID_LISTING = {
  title: "Dell XPS 13 Laptop",
  description: "Barely used, comes with charger and sleeve.",
  category: "computers",
  condition: "Good",
  price: 45000,
  city: "Pune",
  phone: "98765 43210",
};

describe("parseNewListing phone requirement", () => {
  it("requires a phone number", () => {
    const { phone: _phone, ...withoutPhone } = VALID_LISTING;
    const result = parseNewListing(withoutPhone);
    expect(result).toEqual({ error: "Add a contact number so buyers can reach you." });
  });

  it("rejects an invalid phone number", () => {
    const result = parseNewListing({ ...VALID_LISTING, phone: "12345" });
    expect(result).toEqual({
      error: "Enter a valid 10-digit Indian mobile number.",
    });
  });

  it("normalises a valid phone number on the way in", () => {
    const result = parseNewListing(VALID_LISTING);
    expect("value" in result && result.value.phone).toBe("9876543210");
  });
});

describe("parseListingPatch phone is optional but validated when present", () => {
  it("allows a patch with no phone at all", () => {
    const result = parseListingPatch({ title: "New title" });
    expect("value" in result && result.value.phone).toBeUndefined();
  });

  it("normalises a phone when the patch includes one", () => {
    const result = parseListingPatch({ phone: "+91 98765 43210" });
    expect("value" in result && result.value.phone).toBe("9876543210");
  });

  it("rejects an invalid phone in a patch", () => {
    const result = parseListingPatch({ phone: "abc" });
    expect(result).toEqual({
      error: "Enter a valid 10-digit Indian mobile number.",
    });
  });
});
