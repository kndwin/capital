import type { CompanyCheckDefinition } from "../../company-check.schema";
import type { CompanyCheckGroupDefinition } from "../traction/traction.group";

export const dealRiskGroup = {
  id: "deal_risk",
  label: "Deal & Risk",
  checks: [
    {
      id: "deal_risk.cap_table_cleanliness",
      groupId: "deal_risk",
      groupLabel: "Deal & Risk",
      label: "Cap table cleanliness",
      weight: 1,
      order: 410,
    },
    {
      id: "deal_risk.valuation_reasonableness",
      groupId: "deal_risk",
      groupLabel: "Deal & Risk",
      label: "Valuation reasonableness",
      weight: 1,
      order: 420,
    },
    {
      id: "deal_risk.legal_red_flags",
      groupId: "deal_risk",
      groupLabel: "Deal & Risk",
      label: "Legal red flags",
      weight: 1,
      order: 430,
    },
    {
      id: "deal_risk.source_consistency",
      groupId: "deal_risk",
      groupLabel: "Deal & Risk",
      label: "Source consistency",
      weight: 1,
      order: 440,
    },
  ] satisfies ReadonlyArray<CompanyCheckDefinition>,
} satisfies CompanyCheckGroupDefinition;
