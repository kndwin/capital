import { describe, expect, it } from "vitest";
import { memoSeedPreviewAtom } from "./memo.atom";

describe("memo atoms", () => {
  it("exports memo atoms", () => {
    expect(memoSeedPreviewAtom).toBeDefined();
  });
});
