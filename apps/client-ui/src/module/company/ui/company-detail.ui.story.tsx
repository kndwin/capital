import type { Meta, StoryObj } from "@storybook/react";
import type { CompanyCheck, CompanyDetail as CompanyDetailData } from "@capital/server-core/rpc";
import { CompanyDetail, CompanyDetailError, CompanyDetailLoading } from "./company-detail.ui";

const checks: ReadonlyArray<CompanyCheck> = [
  check("team-founder-prestige", "team", "Team", "Founder prestige", "pass", "ex-Stripe", 10),
  check(
    "team-technical-cofounder",
    "team",
    "Team",
    "Technical co-founder",
    "pass",
    "CTO · 12y",
    20,
  ),
  check("team-completeness", "team", "Team", "Team completeness", "concern", "no GTM lead", 30),
  check("team-churn", "team", "Team", "Employee churn", "unknown", null, 40),
  check("market-tam", "market", "Market", "TAM credibility", "pass", "$8B", 50),
  check("market-growth", "market", "Market", "Growth rate", "pass", "17% CAGR", 60),
  check("market-competition", "market", "Market", "Competition", "fail", "2 incumbents", 70),
  check("traction-arr", "traction", "Traction", "ARR", "pass", "$1.2M", 80, "override"),
  check(
    "traction-growth",
    "traction",
    "Traction",
    "Growth rate",
    "concern",
    "22% MoM",
    90,
    "engine",
  ),
];

const detail: CompanyDetailData = {
  company: {
    id: "acme-robotics",
    name: "Acme Robotics",
    description: "Warehouse autonomy for mid-market 3PLs.",
    website: "https://acme-robotics.com",
    stage: "seed",
    sector: "Robotics",
    location: "Pittsburgh, PA",
    score: 60,
    riskLevel: "medium",
    updatedAt: 1_777_680_000_000,
  },
  checkGroups: [
    { id: "team", label: "Team", verdict: "strong", score: 87, checks: checks.slice(0, 4) },
    { id: "market", label: "Market", verdict: "mixed", score: 73, checks: checks.slice(4, 7) },
    { id: "traction", label: "Traction", verdict: "mixed", score: 60, checks: checks.slice(7) },
  ],
  sources: [
    source("pitch-deck-v3", "pdf", "Pitch deck v3", "14p · yest.", 92, true, 10),
    source("q3-financials", "xlsx", "Q3 financials", "4 sheets · today", 88, false, 20),
    source("crunchbase-acme", "url", "crunchbase.com/acme", "fetched yest.", 76, false, 30),
    source("acme-robotics-com", "url", "acme-robotics.com", "homepage", 70, false, 40),
  ],
  insights: [
    {
      id: "pitch-deck-v3-growth-excerpt",
      companyId: "acme-robotics",
      sourceId: "pitch-deck-v3",
      kind: "excerpt",
      locator: "P7",
      text: "Our last quarter we hit 22% MoM growth, with $1.2M ARR and a 71% gross margin.",
      extractorVersion: "insight-workflow-seed-v1",
      insightWorkflowRunId: "seed-acme-pitch-deck-v3",
      order: 10,
      updatedAt: 1_777_680_000_000,
    },
    {
      id: "q3-financials-growth-excerpt",
      companyId: "acme-robotics",
      sourceId: "q3-financials",
      kind: "excerpt",
      locator: "Sheet 1",
      text: "Q3 close shows $700k ARR and 11% MoM growth after excluding pilots.",
      extractorVersion: "insight-workflow-seed-v1",
      insightWorkflowRunId: "seed-acme-q3-financials",
      order: 20,
      updatedAt: 1_777_680_000_000,
    },
  ],
};

const meta: Meta<typeof CompanyDetail> = {
  title: "Company/CompanyDetail",
  component: CompanyDetail,
  args: { detail },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof CompanyDetail>;

export const Default: Story = {};
export const Sparse: Story = {
  args: {
    detail: {
      ...detail,
      checkGroups: [],
      sources: [],
      insights: [],
    },
  },
};
export const Loading: Story = { render: () => <CompanyDetailLoading /> };
export const Error: Story = { render: () => <CompanyDetailError /> };

function check(
  id: string,
  groupId: string,
  groupLabel: string,
  label: string,
  status: CompanyCheck["status"],
  detailText: string | null,
  order: number,
  source: CompanyCheck["source"] = "seed",
): CompanyCheck {
  return {
    id,
    companyId: "acme-robotics",
    checkDefinitionId:
      source === "seed"
        ? `seed.${groupId}.${id}`
        : `traction.${label.toLowerCase().replaceAll(" ", "_")}`,
    groupId,
    groupLabel,
    label,
    status,
    score: status === "pass" ? 100 : status === "concern" ? 60 : status === "fail" ? 20 : 0,
    detail: detailText,
    rationale:
      source === "override"
        ? "Investor override accepted management ARR."
        : "Generated from source insights.",
    source,
    overrideId: source === "override" ? "acme-traction-arr-kevin-override" : null,
    supportingInsightIds: ["pitch-deck-v3-growth-excerpt"],
    order,
    updatedAt: 1_777_680_000_000,
  };
}

function source(
  id: string,
  kind: CompanyDetailData["sources"][number]["kind"],
  title: string,
  subtitle: string,
  confidence: number,
  selected: boolean,
  order: number,
): CompanyDetailData["sources"][number] {
  return {
    id,
    companyId: "acme-robotics",
    kind,
    title,
    subtitle,
    confidence,
    selected,
    order,
    updatedAt: 1_777_680_000_000,
  };
}
