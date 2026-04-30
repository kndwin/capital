import { describe, expect, it } from "@effect/vitest";
import { shouldCreateSource } from "./company-market-watch.service";

const candidate = {
  title: "Sample Company raises seed round",
  url: "https://techcrunch.com/sample-company-seed",
  summary: "Sample Company raised a seed round.",
  eventDate: "2026-04-30",
  relevanceReason: "Direct funding announcement for the exact company.",
  confidence: 0.91,
};

describe("CompanyMarketWatchService", () => {
  it("accepts high-confidence durable URLs", () => {
    expect(
      shouldCreateSource({
        candidate,
        existingUrls: new Set(),
        existingTitles: new Set(),
      }),
    ).toBe(true);
  });

  it("rejects low-confidence candidates", () => {
    expect(
      shouldCreateSource({
        candidate: { ...candidate, confidence: 0.79 },
        existingUrls: new Set(),
        existingTitles: new Set(),
      }),
    ).toBe(false);
  });

  it("rejects duplicate URLs and titles", () => {
    expect(
      shouldCreateSource({
        candidate,
        existingUrls: new Set([candidate.url]),
        existingTitles: new Set(),
      }),
    ).toBe(false);
    expect(
      shouldCreateSource({
        candidate,
        existingUrls: new Set(),
        existingTitles: new Set([candidate.title.toLowerCase()]),
      }),
    ).toBe(false);
  });
});
