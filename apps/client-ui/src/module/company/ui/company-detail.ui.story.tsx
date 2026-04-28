import type { Meta, StoryObj } from "@storybook/react";
import type { Company } from "@capital/server-core/rpc";
import { CompanyDetail, CompanyDetailError, CompanyDetailLoading } from "./company-detail.ui";

const company: Company = {
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

const meta: Meta<typeof CompanyDetail> = {
  title: "Company/CompanyDetail",
  component: CompanyDetail,
  args: { company },
  decorators: [
    (Story) => (
      <div className="max-w-6xl p-4">
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
    company: {
      ...company,
      description: null,
      website: null,
      sector: null,
      location: null,
      score: null,
      riskLevel: "unknown",
      stage: "unknown",
    },
  },
};
export const Loading: Story = { render: () => <CompanyDetailLoading /> };
export const Error: Story = { render: () => <CompanyDetailError /> };
