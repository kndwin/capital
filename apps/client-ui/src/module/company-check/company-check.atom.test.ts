import { describe, expect, it } from "vitest";
import { runCompanyCheckEngine, setCompanyCheckOverride } from "./company-check.atom";

describe("company-check atoms", () => {
  it("exports check mutations", () => {
    expect(setCompanyCheckOverride).toBeDefined();
    expect(runCompanyCheckEngine).toBeDefined();
  });
});
