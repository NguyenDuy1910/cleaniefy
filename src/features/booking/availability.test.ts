import { describe, expect, it } from "vitest";
import { slotStarts } from "./service";

describe("slotStarts", () => {
  const rule = { weekdays: [1], startTime: "09:00", endTime: "12:00", slotIntervalMinutes: 60 };
  const monday = "2026-09-21";
  const beforeOpening = new Date("2026-09-20T00:00:00.000Z");

  it("uses configured weekday and duration boundaries", () => {
    expect(slotStarts(rule, monday, 120, [], beforeOpening).map((slot) => slot.toISOString())).toEqual([
      "2026-09-21T09:00:00.000Z",
      "2026-09-21T10:00:00.000Z",
    ]);
  });

  it("removes slots that overlap an existing booking", () => {
    const occupied = [{ scheduledStart: new Date("2026-09-21T10:00:00.000Z"), scheduledEnd: new Date("2026-09-21T11:00:00.000Z") }];
    expect(slotStarts(rule, monday, 120, occupied, beforeOpening)).toEqual([]);
  });
});
