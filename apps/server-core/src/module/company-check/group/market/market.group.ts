import type { CompanyCheckDefinition } from "../../company-check.schema";
import type { CompanyCheckGroupDefinition } from "../traction/traction.group";

export const marketGroup = {
  id: "market",
  label: "Market",
  checks: [
    {
      id: "market.tam_credibility",
      groupId: "market",
      groupLabel: "Market",
      label: "TAM credibility",
      weight: 1,
      order: 110,
    },
    {
      id: "market.growth_rate",
      groupId: "market",
      groupLabel: "Market",
      label: "Market growth rate",
      weight: 1,
      order: 120,
    },
    {
      id: "market.competitive_landscape",
      groupId: "market",
      groupLabel: "Market",
      label: "Competitive landscape",
      weight: 1,
      order: 130,
    },
    {
      id: "market.timing_thesis",
      groupId: "market",
      groupLabel: "Market",
      label: "Timing thesis",
      weight: 1,
      order: 140,
    },
  ] satisfies ReadonlyArray<CompanyCheckDefinition>,
} satisfies CompanyCheckGroupDefinition;
