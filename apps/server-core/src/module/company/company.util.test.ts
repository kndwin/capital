import { describe, expect, it } from "vitest";
import {
  acquireNoteContent,
  capSourceText,
  getMaxAiInputChars,
  hashSourceText,
  toCompanyId,
} from "./company.util";

describe("hashSourceText", () => {
  it("hashes source text deterministically", () => {
    expect(hashSourceText({ text: "source" })).toBe(hashSourceText({ text: "source" }));
    expect(hashSourceText({ text: "source" })).toHaveLength(64);
  });
});

describe("toCompanyId", () => {
  it("slugifies company names", () => {
    expect(toCompanyId({ name: " Acme Robotics, Inc. " })).toBe("acme-robotics-inc");
  });

  it("falls back to company for empty slugs", () => {
    expect(toCompanyId({ name: "!!!" })).toBe("company");
  });
});

describe("getMaxAiInputChars", () => {
  it("returns a bounded AI input size", () => {
    expect(getMaxAiInputChars({ unit: undefined })).toBe(80_000);
  });
});

describe("capSourceText", () => {
  it("normalizes and caps source text", () => {
    const result = capSourceText({ text: " a\r\nb ", maxChars: 3 });

    expect(result.text).toBe("a\nb");
    expect(result.charCount).toBe(3);
    expect(result.truncated).toBe(false);
    expect(result.hash).toHaveLength(64);
  });

  it("marks truncated text", () => {
    const result = capSourceText({ text: "abcdef", maxChars: 3 });

    expect(result.text).toBe("abc");
    expect(result.charCount).toBe(6);
    expect(result.truncated).toBe(true);
  });
});

describe("acquireNoteContent", () => {
  it("turns note text into acquired content", () => {
    const content = acquireNoteContent({ text: "ARR is $1M" });

    expect(content.provider).toBe("user_note");
    expect(content.text).toBe("ARR is $1M");
    expect(content.finalUrl).toBe(null);
  });
});
