import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPassword,
  doPasswordsMatch,
  isValidPartnerCode,
  isValidNonEmptyText,
  isValidPositiveAmount,
  VALIDATION_CONFIG,
} from "../src/constants/validation";

describe("Validation Rules & Helper Suite", () => {
  describe("isValidEmail", () => {
    it("accepts valid email addresses", () => {
      expect(isValidEmail("hero@traki.app")).toBe(true);
      expect(isValidEmail("irishpureza@gmail.com")).toBe(true);
      expect(isValidEmail("user.name+tag@example.co.uk")).toBe(true);
      expect(isValidEmail("  spaced@domain.com  ")).toBe(true);
    });

    it("rejects invalid email formats", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("   ")).toBe(false);
      expect(isValidEmail("plainaddress")).toBe(false);
      expect(isValidEmail("@missingusername.com")).toBe(false);
      expect(isValidEmail("username@.com")).toBe(false);
      expect(isValidEmail("username@com")).toBe(false);
      expect(isValidEmail(null as unknown as string)).toBe(false);
    });
  });

  describe("isValidPassword & doPasswordsMatch", () => {
    it("validates password minimum length requirement", () => {
      expect(isValidPassword("123456")).toBe(true);
      expect(isValidPassword("hunter2!")).toBe(true);
      expect(isValidPassword("12345")).toBe(false);
      expect(isValidPassword("")).toBe(false);
    });

    it("verifies passwords match when valid", () => {
      expect(doPasswordsMatch("secret123", "secret123")).toBe(true);
      expect(doPasswordsMatch("secret123", "wrongpass")).toBe(false);
      expect(doPasswordsMatch("short", "short")).toBe(false); // below min length
    });
  });

  describe("isValidPartnerCode", () => {
    it("accepts exactly 6 alphanumeric characters", () => {
      expect(isValidPartnerCode("ABC123")).toBe(true);
      expect(isValidPartnerCode("trk999")).toBe(true); // case-insensitive trimmed
      expect(isValidPartnerCode("  ZZZ777  ")).toBe(true);
    });

    it("rejects invalid partner codes", () => {
      expect(isValidPartnerCode("ABC12")).toBe(false); // too short
      expect(isValidPartnerCode("ABC1234")).toBe(false); // too long
      expect(isValidPartnerCode("AB-123")).toBe(false); // non-alphanumeric
      expect(isValidPartnerCode("")).toBe(false);
    });
  });

  describe("isValidNonEmptyText", () => {
    it("accepts valid non-empty strings", () => {
      expect(isValidNonEmptyText("Daily Cash")).toBe(true);
      expect(isValidNonEmptyText("Trip")).toBe(true);
    });

    it("rejects empty or whitespace-only strings", () => {
      expect(isValidNonEmptyText("")).toBe(false);
      expect(isValidNonEmptyText("   ")).toBe(false);
      expect(isValidNonEmptyText(null as unknown as string)).toBe(false);
    });
  });

  describe("isValidPositiveAmount", () => {
    it("accepts positive numeric amounts and strings", () => {
      expect(isValidPositiveAmount(100)).toBe(true);
      expect(isValidPositiveAmount("250.50")).toBe(true);
      expect(isValidPositiveAmount("1")).toBe(true);
    });

    it("rejects zero, negative, or non-numeric values", () => {
      expect(isValidPositiveAmount(0)).toBe(false);
      expect(isValidPositiveAmount("0")).toBe(false);
      expect(isValidPositiveAmount("-50")).toBe(false);
      expect(isValidPositiveAmount("abc")).toBe(false);
      expect(isValidPositiveAmount("")).toBe(false);
    });
  });
});
