import type { CompanyCheckDefinition } from "../../company-check.schema";
import type { CompanyCheckGroupDefinition } from "../traction/traction.group";

export const productGroup = {
  id: "product",
  label: "Product",
  checks: [
    {
      id: "product.maturity",
      groupId: "product",
      groupLabel: "Product",
      label: "Product maturity",
      weight: 1,
      order: 210,
    },
    {
      id: "product.differentiation",
      groupId: "product",
      groupLabel: "Product",
      label: "Differentiation",
      weight: 1,
      order: 220,
    },
    {
      id: "product.user_love",
      groupId: "product",
      groupLabel: "Product",
      label: "User love",
      weight: 1,
      order: 230,
    },
    {
      id: "product.defensibility",
      groupId: "product",
      groupLabel: "Product",
      label: "Defensibility",
      weight: 1,
      order: 240,
    },
  ] satisfies ReadonlyArray<CompanyCheckDefinition>,
} satisfies CompanyCheckGroupDefinition;
