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
  history: [
    {
      id: "pitch-deck-v3:history",
      companyId: "acme-robotics",
      sourceId: "pitch-deck-v3",
      sourceTitle: "Pitch deck v3",
      sourceKind: "pdf",
      sourceStatus: "ready",
      insightCount: 1,
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
      ],
      affectedChecks: [
        {
          id: "traction-arr",
          checkDefinitionId: "traction.arr",
          groupLabel: "Traction",
          label: "ARR",
          status: "pass",
          detail: "$1.2M",
        },
        {
          id: "traction-growth",
          checkDefinitionId: "traction.growth_rate",
          groupLabel: "Traction",
          label: "Growth rate",
          status: "concern",
          detail: "22% MoM",
        },
      ],
      updatedAt: 1_777_680_000_000,
    },
    {
      id: "q3-financials:history",
      companyId: "acme-robotics",
      sourceId: "q3-financials",
      sourceTitle: "Q3 financials",
      sourceKind: "xlsx",
      sourceStatus: "ready",
      insightCount: 1,
      insights: [
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
      affectedChecks: [],
      updatedAt: 1_777_680_000_000,
    },
  ],
};

const meta: Meta<typeof CompanyDetail> = {
  title: "Company/CompanyDetail",
  component: CompanyDetail,
  args: {
    detail,
    leftPanel: "checks",
    onLeftPanelChange: () => {},
    rightPanel: "sources",
    onRightPanelChange: () => {},
    memoPanel: <div className="p-5 text-sm text-muted-foreground">Memo preview placeholder</div>,
    onCompanyDelete: () => {},
  },
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
export const Editing: Story = {
  args: {
    isEditingCompany: true,
    companyEditDraft: {
      name: detail.company.name,
      description: detail.company.description ?? "",
      website: detail.company.website ?? "",
      stage: detail.company.stage,
      sector: detail.company.sector ?? "",
      location: detail.company.location ?? "",
      riskLevel: detail.company.riskLevel,
    },
    onCompanyEditChange: () => {},
    onCompanyEditCancel: () => {},
    onCompanyEditSubmit: () => {},
  },
};
export const DraggablePanels: Story = {
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-6">
        <Story />
      </div>
    ),
  ],
};
export const Memo: Story = {
  args: {
    rightPanel: "memo",
    memoPanel: <div className="p-5 text-sm text-muted-foreground">Memo preview placeholder</div>,
  },
};
export const History: Story = {
  args: {
    leftPanel: "history",
  },
};
export const Sparse: Story = {
  args: {
    detail: {
      ...detail,
      checkGroups: [],
      sources: [],
      insights: [],
      history: [],
    },
  },
};
export const SourcesProcessing: Story = {
  args: {
    detail: {
      ...detail,
      sources: [
        {
          ...detail.sources[0]!,
          id: "queued-source",
          title: "Founder LinkedIn",
          status: "pending",
          confidence: 0,
        },
        {
          ...detail.sources[1]!,
          id: "fetching-source",
          title: "Company website",
          status: "acquiring",
          confidence: 0,
        },
        {
          ...detail.sources[2]!,
          id: "extracting-source",
          title: "Crunchbase profile",
          status: "extracting",
          confidence: 0,
        },
        {
          ...detail.sources[3]!,
          id: "failed-source",
          title: "Broken article",
          status: "failed",
          error: "Cloudflare returned no markdown",
        },
      ],
      history: [
        {
          id: "extracting-source:history",
          companyId: "acme-robotics",
          sourceId: "extracting-source",
          sourceTitle: "Crunchbase profile",
          sourceKind: "url",
          sourceStatus: "extracting",
          insightCount: 0,
          insights: [],
          affectedChecks: [],
          updatedAt: 1_777_680_000_000,
        },
      ],
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
    status: "ready",
    title,
    subtitle,
    confidence,
    selected,
    order,
    url: kind === "url" ? title : null,
    fileName: kind === "pdf" || kind === "xlsx" ? title : null,
    fileUrl: kind === "pdf" ? `/uploads/company-sources/${id}.pdf` : null,
    acquiredProvider: "user_note",
    acquiredText:
      kind === "url"
        ? `Seeded web content from ${title}. Acme Robotics has expanded its warehouse pilots across mid-market 3PLs.`
        : kind === "pdf"
          ? "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDQ0Pj5zdHJlYW0KQlQKL0YxIDI0IFRmCjcyIDcyMCBUZAooQUNNRSBQaXRjaCBEZWNrKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjEgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDMgMCBSIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdIC9Db250ZW50cyAyIDAgUj4+CmVuZG9iagozIDAgb2JqCjw8L1R5cGUgL1BhZ2VzIC9LaWRzIFsxIDAgUl0gL0NvdW50IDEgL1Jlc291cmNlcyA8PC9Gb250IDw8L0YxIDQgMCBSPj4+Pj4+CmVuZG9iago0IDAgb2JqCjw8L1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMyAwIFI+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMTAyIDAwMDAwIG4gCjAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMjE1IDAwMDAwIG4gCjAwMDAwMDAzMTggMDAwMDAgbiAKMDAwMDAwMDM5MiAwMDAwMCBuIAp0cmFpbGVyCjw8L1NpemUgNiAvUm9vdCA1IDAgUj4+CnN0YXJ0eHJlZgo0NDEKJSVFT0YK"
          : "Manual source note: customer references report faster deployments, but onboarding still requires founder-led support.",
    acquiredTextTruncated: false,
    acquiredTextCharCount: null,
    acquiredTextHash: null,
    error: null,
    updatedAt: 1_777_680_000_000,
  };
}
