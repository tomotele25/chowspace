import { describe, it, expect, vi, afterEach } from "vitest";
import axios from "axios";
import {
  formatCurrency,
  formatPhoneNumber,
  generateOrderId,
  isAbeokutaVendor,
  isVendorStillOpen,
  validatePhone,
  validateName,
} from "./checkout";

vi.mock("axios");

describe("formatCurrency", () => {
  it("adds thousand separators to a number", () => {
    expect(formatCurrency(1234567)).toBe("1,234,567");
  });

  it("falls back to '0' for non-numbers", () => {
    expect(formatCurrency(undefined)).toBe("0");
    expect(formatCurrency(null)).toBe("0");
    expect(formatCurrency("1000")).toBe("0");
  });
});

describe("formatPhoneNumber", () => {
  it("converts a leading 0 to the 234 country code", () => {
    expect(formatPhoneNumber("08012345678")).toBe("2348012345678");
  });

  it("strips non-digit characters before converting", () => {
    expect(formatPhoneNumber("0801 234 5678")).toBe("2348012345678");
    expect(formatPhoneNumber("+234-801-234-5678")).toBe("2348012345678");
  });

  it("leaves a number already in international format untouched", () => {
    expect(formatPhoneNumber("2348012345678")).toBe("2348012345678");
  });
});

describe("generateOrderId", () => {
  it("produces a CS-prefixed 6-digit id", () => {
    const id = generateOrderId();
    expect(id).toMatch(/^CS-\d{6}$/);
  });

  it("produces different ids across calls (not hardcoded)", () => {
    const ids = new Set(Array.from({ length: 20 }, generateOrderId));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe("isAbeokutaVendor", () => {
  it("matches on location, case- and whitespace-insensitively", () => {
    expect(isAbeokutaVendor({ location: "Abeokuta" })).toBe(true);
    expect(isAbeokutaVendor({ location: "  ABEOKUTA  " })).toBe(true);
    expect(isAbeokutaVendor({ location: "abeokuta" })).toBe(true);
  });

  it("returns false for other locations or missing data", () => {
    expect(isAbeokutaVendor({ location: "Lagos" })).toBe(false);
    expect(isAbeokutaVendor({})).toBe(false);
    expect(isAbeokutaVendor(null)).toBe(false);
    expect(isAbeokutaVendor(undefined)).toBe(false);
  });
});

describe("validatePhone", () => {
  it("accepts phone numbers with 7 to 15 digits", () => {
    expect(validatePhone("1234567")).toBe(true);
    expect(validatePhone("123456789012345")).toBe(true);
    expect(validatePhone("0801-234-5678")).toBe(true);
  });

  it("rejects phone numbers outside that range", () => {
    expect(validatePhone("123456")).toBe(false);
    expect(validatePhone("1234567890123456")).toBe(false);
    expect(validatePhone("")).toBe(false);
  });
});

describe("validateName", () => {
  it("accepts ordinary names", () => {
    expect(validateName("Chioma Okafor")).toBe(true);
    expect(validateName("Mary-Jane")).toBe(true);
    expect(validateName("O'Brien")).toBe(true);
  });

  it("rejects names shorter than 2 characters", () => {
    expect(validateName("A")).toBe(false);
    expect(validateName(" ")).toBe(false);
  });

  it("rejects names with digits or symbols", () => {
    expect(validateName("John123")).toBe(false);
    expect(validateName("John@Doe")).toBe(false);
  });

  it("rejects names that are just one character repeated (junk input)", () => {
    expect(validateName("aaaaaaa")).toBe(false);
    expect(validateName("zzzz")).toBe(false);
  });
});

describe("isVendorStillOpen", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns true when the backend reports the vendor open", async () => {
    axios.get.mockResolvedValueOnce({ data: { status: "open" } });
    await expect(isVendorStillOpen("vendor-1")).resolves.toBe(true);
  });

  it("returns false when the backend reports the vendor closed", async () => {
    axios.get.mockResolvedValueOnce({ data: { status: "closed" } });
    await expect(isVendorStillOpen("vendor-1")).resolves.toBe(false);
  });

  it("fails open (returns true) on a network error", async () => {
    axios.get.mockRejectedValueOnce(new Error("network down"));
    await expect(isVendorStillOpen("vendor-1")).resolves.toBe(true);
  });
});
