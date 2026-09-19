import { describe, expect, it } from "vitest";
import { validatePartnerSlug } from "./slugs";
import { PartnerProfileSchema, ThemeConfigSchema } from "./schema";

describe("partner validation", () => {
  it("normalizes a usable partner slug", () => {
    expect(validatePartnerSlug("  Jessica’s Home Care  ")).toBe("jessica-s-home-care");
  });

  it("rejects reserved partner slugs", () => {
    expect(() => validatePartnerSlug("dashboard")).toThrow("reserved");
  });

  it("allows only the controlled theme configuration", () => {
    expect(() => ThemeConfigSchema.parse({ primaryColor: "blue", backgroundTone: "neon", fontPreset: "comic", buttonStyle: "square" })).toThrow();
    expect(ThemeConfigSchema.parse({ primaryColor: "#26573d", backgroundTone: "light", fontPreset: "modern", buttonStyle: "soft" }).primaryColor).toBe("#26573d");
  });

  it("accepts Instagram profile links and clears an empty link", () => {
    expect(PartnerProfileSchema.parse({ instagramUrl: "https://www.instagram.com/cleanie/" }).instagramUrl).toBe("https://www.instagram.com/cleanie/");
    expect(PartnerProfileSchema.parse({ instagramUrl: "" }).instagramUrl).toBeNull();
  });

  it("rejects non-Instagram social links", () => {
    expect(() => PartnerProfileSchema.parse({ instagramUrl: "https://example.com/cleanie" })).toThrow("Instagram");
  });
});
