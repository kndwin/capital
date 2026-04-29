import type { Meta, StoryObj } from "@storybook/react";
import { CompanyCreateDialog } from "./company-create-dialog.ui";

const meta: Meta<typeof CompanyCreateDialog> = {
  title: "Module/Company/CompanyCreateDialog",
  component: CompanyCreateDialog,
  args: {
    description: "AI diligence workspace for venture teams.",
    error: null,
    isSubmitting: false,
    name: "Bevel",
    onDescriptionChange: () => {},
    onNameChange: () => {},
    onOpenChange: () => {},
    onSourceChange: () => {},
    onSubmit: () => {},
    onWebsiteChange: () => {},
    open: true,
    source: {
      enabled: false,
      kind: "url",
      title: "",
      url: "",
      text: "",
      prompt: "",
      file: null,
    },
    website: "https://bevel.com",
  },
  decorators: [
    (Story) => (
      <div className="min-h-96 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof CompanyCreateDialog>;

export const Open: Story = {};

export const Empty: Story = { args: { name: "" } };

export const WithUrlSource: Story = {
  args: {
    source: {
      enabled: true,
      kind: "url",
      title: "Pitch deck",
      url: "https://bevel.com/deck",
      text: "",
      prompt: "",
      file: null,
    },
  },
};

export const WithAiResearchSource: Story = {
  args: {
    source: {
      enabled: true,
      kind: "chat",
      title: "Public diligence research",
      url: "",
      text: "",
      prompt:
        "Find recent customer traction, competitors, pricing, founder background, and market signals.",
      file: null,
    },
  },
};

export const Submitting: Story = { args: { isSubmitting: true } };

export const Error: Story = { args: { error: "Company could not be created." } };
