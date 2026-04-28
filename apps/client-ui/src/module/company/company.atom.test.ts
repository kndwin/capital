import { describe, expect, it } from "vitest";
import { companiesAtom, companyAtom, companyDetailAtom, createCompany } from "./company.atom";

describe("company atoms", () => {
  it("exports company atoms", () => {
    expect(companiesAtom).toBeDefined();
    expect(companyAtom).toBeDefined();
    expect(companyDetailAtom).toBeDefined();
    expect(createCompany).toBeDefined();
  });
});
