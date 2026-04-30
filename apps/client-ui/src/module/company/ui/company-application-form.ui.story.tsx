import type { Meta, StoryObj } from "@storybook/react";
import { CompanyApplicationForm, CompanyApplicationSubmitted } from "./company-application-form.ui";

const sampleValue = {
  name: "Bevel",
  website: "https://bevel.com",
  description: "AI diligence workspace for venture teams.",
  product: "A source-ingestion and memo automation platform for investment teams.",
  customer: "Seed and Series A venture funds that review high volumes of companies.",
  traction: "$42k ARR, 8 design partners, and weekly active usage across three funds.",
  fundraise: "Raising a $2.5M seed round.",
  notes: "Happy to share customer references after the first call.",
  links: [{ id: "link-1", title: "Deck", url: "https://bevel.com/deck" }],
  files: [],
};

const meta: Meta<typeof CompanyApplicationForm> = {
  title: "Module/Company/CompanyApplicationForm",
  component: CompanyApplicationForm,
  args: {
    error: null,
    isSubmitting: false,
    onAddLink: () => {},
    onChange: () => {},
    onFilesChange: () => {},
    onRemoveLink: () => {},
    onSubmit: () => {},
    onUpdateLink: () => {},
    tokenMissing: false,
    value: sampleValue,
  },
};

export default meta;

type Story = StoryObj<typeof CompanyApplicationForm>;

export const Filled: Story = {};

export const Empty: Story = {
  args: { value: { ...sampleValue, name: "", product: "", customer: "", traction: "" } },
};

export const MissingToken: Story = { args: { tokenMissing: true } };

export const Submitting: Story = { args: { isSubmitting: true } };

export const Error: Story = {
  args: { error: "Invite link is invalid, expired, or already used." },
};

export const Submitted: StoryObj<typeof CompanyApplicationSubmitted> = {
  render: () => <CompanyApplicationSubmitted />,
};
