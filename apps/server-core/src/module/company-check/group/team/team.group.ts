import type { CompanyCheckDefinition } from "../../company-check.schema";
import type { CompanyCheckGroupDefinition } from "../traction/traction.group";

export const teamGroup = {
  id: "team",
  label: "Team",
  checks: [
    {
      id: "team.founder_prestige",
      groupId: "team",
      groupLabel: "Team",
      label: "Founder prestige",
      weight: 1,
      order: 10,
    },
    {
      id: "team.technical_cofounder",
      groupId: "team",
      groupLabel: "Team",
      label: "Technical co-founder",
      weight: 1,
      order: 20,
    },
    {
      id: "team.founder_market_fit",
      groupId: "team",
      groupLabel: "Team",
      label: "Founder-market fit",
      weight: 1,
      order: 30,
    },
    {
      id: "team.completeness",
      groupId: "team",
      groupLabel: "Team",
      label: "Team completeness",
      weight: 1,
      order: 40,
    },
    {
      id: "team.employee_churn",
      groupId: "team",
      groupLabel: "Team",
      label: "Employee churn",
      weight: 1,
      order: 50,
    },
  ] satisfies ReadonlyArray<CompanyCheckDefinition>,
} satisfies CompanyCheckGroupDefinition;
