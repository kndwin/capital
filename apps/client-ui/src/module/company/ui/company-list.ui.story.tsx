import type { Meta, StoryObj } from "@storybook/react";
import type { Company } from "@capital/server-core/rpc";
import {
  CompanyList,
  CompanyListEmpty,
  CompanyListError,
  CompanyListLoading,
} from "./company-list.ui";

const base: Company = {
  id: "northstar-ai",
  name: "Northstar AI",
  description:
    "AI workflow platform for revenue teams that turns call, CRM, and support data into account-level execution plans.",
  website: "https://northstar.example",
  stage: "seed",
  sector: "Enterprise AI",
  location: "San Francisco, CA",
  score: 82,
  riskLevel: "medium",
  updatedAt: 1_777_334_400_000,
};

const meta: Meta<typeof CompanyList> = {
  title: "Module/Company/CompanyList",
  component: CompanyList,
  args: { companies: [base] },
  decorators: [
    (Story) => (
      <div className="max-w-5xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof CompanyList>;

export const Single: Story = {};

export const Many: Story = {
  args: {
    companies: [
      base,
      {
        ...base,
        id: "voltframe",
        name: "Voltframe",
        sector: "Climate Infrastructure",
        stage: "series_b",
        score: 88,
        riskLevel: "low",
      },
      {
        ...base,
        id: "ledgergrid",
        name: "LedgerGrid",
        description:
          "Programmable treasury controls for multi-entity finance teams with automated approvals.",
        sector: "Fintech",
        stage: "series_a",
        score: 71,
        riskLevel: "medium",
        updatedAt: 1_777_420_800_000,
      },
      {
        ...base,
        id: "cordage",
        name: "Cordage",
        description: "Developer tooling for contract test generation across API-first teams.",
        sector: "Devtools",
        stage: "pre_seed",
        score: 54,
        riskLevel: "medium",
        updatedAt: 1_777_593_600_000,
      },
      {
        ...base,
        id: "clearbrief",
        name: "ClearBrief",
        sector: "Legaltech",
        stage: "pre_seed",
        score: 64,
        riskLevel: "high",
      },
      {
        ...base,
        id: "unscored-labs",
        name: "Unscored Labs",
        description: null,
        website: null,
        sector: null,
        stage: "unknown",
        score: null,
        riskLevel: "unknown",
        updatedAt: 1_777_680_000_000,
      },
    ],
  },
};

export const Empty: Story = { render: () => <CompanyListEmpty /> };
export const Loading: Story = { render: () => <CompanyListLoading /> };
export const Error: Story = { render: () => <CompanyListError /> };
