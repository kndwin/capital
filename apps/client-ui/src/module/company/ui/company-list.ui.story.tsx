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
  title: "Company/CompanyList",
  component: CompanyList,
  args: { companies: [{ company: base, detailHref: "/company/northstar-ai" }] },
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
      { company: base, detailHref: "/company/northstar-ai" },
      {
        company: {
          ...base,
          id: "voltframe",
          name: "Voltframe",
          sector: "Climate Infrastructure",
          stage: "series_b",
          score: 88,
          riskLevel: "low",
        },
        detailHref: "/company/voltframe",
      },
      {
        company: {
          ...base,
          id: "clearbrief",
          name: "ClearBrief",
          sector: "Legaltech",
          stage: "pre_seed",
          score: 64,
          riskLevel: "high",
        },
        detailHref: "/company/clearbrief",
      },
    ],
  },
};

export const Empty: Story = { render: () => <CompanyListEmpty /> };
export const Loading: Story = { render: () => <CompanyListLoading /> };
export const Error: Story = { render: () => <CompanyListError /> };
