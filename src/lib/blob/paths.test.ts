import { describe, expect, it } from "vitest";
import { isPartnerMediaPath, parsePartnerMediaPath } from "./paths";

const partnerId = "940bdd33-a9d7-4c08-bcde-b4e522bf76e6";

describe("partner media paths", () => {
  it("accepts current UUID keys and older named Blob keys", () => {
    expect(isPartnerMediaPath(`partners/${partnerId}/profile/965aedee-4d00-4b0b-9ebd-7be253933a3d`)).toBe(true);
    const oldHero = `partners/${partnerId}/hero/ChatGPT-Image-Sep-18--2026--04_16_15-PM--7--fzpZ0mET852sdJbkUSFmQArUuuuWRf.png`;
    expect(parsePartnerMediaPath(oldHero)).toEqual({
      partnerId,
      purpose: "hero",
      filename: "ChatGPT-Image-Sep-18--2026--04_16_15-PM--7--fzpZ0mET852sdJbkUSFmQArUuuuWRf.png",
    });
  });

  it("keeps paths within the requested partner and purpose", () => {
    const path = `partners/${partnerId}/hero/image.png`;
    expect(isPartnerMediaPath(path, "00000000-0000-4000-8000-000000000001")).toBe(false);
    expect(isPartnerMediaPath(`partners/${partnerId}/other/image.png`)).toBe(false);
    expect(isPartnerMediaPath(`partners/${partnerId}/hero/../profile/image.png`)).toBe(false);
    expect(isPartnerMediaPath(`partners/${partnerId}/hero/evil%2Fimage.png`)).toBe(false);
  });
});
