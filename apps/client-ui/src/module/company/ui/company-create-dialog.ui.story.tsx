import type { Meta, StoryObj } from "@storybook/react";
import { CompanyCreateDialog } from "./company-create-dialog.ui";

const meta: Meta<typeof CompanyCreateDialog> = {
  title: "Module/Company/CompanyCreateDialog",
  component: CompanyCreateDialog,
  args: {
    error: null,
    isSubmitting: false,
    name: "Bevel",
    onNameChange: () => {},
    onOpenChange: () => {},
    onSubmit: () => {},
    open: true,
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

export const Submitting: Story = { args: { isSubmitting: true } };

export const Error: Story = { args: { error: "Company could not be created." } };
