import { describe, expect, it } from "vitest";
import { toCompanyId } from "./company.util";

describe("toCompanyId", () => {
  it("slugifies company names", () => {
    expect(toCompanyId({ name: " Acme Robotics, Inc. " })).toBe("acme-robotics-inc");
  });

  it("falls back to company for empty slugs", () => {
    expect(toCompanyId({ name: "!!!" })).toBe("company");
  });
});
