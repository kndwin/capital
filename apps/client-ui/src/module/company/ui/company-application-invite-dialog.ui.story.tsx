import type { Meta, StoryObj } from "@storybook/react";
import { CompanyApplicationInviteDialog } from "./company-application-invite-dialog.ui";

const meta: Meta<typeof CompanyApplicationInviteDialog> = {
  title: "Module/Company/CompanyApplicationInviteDialog",
  component: CompanyApplicationInviteDialog,
  args: {
    copied: false,
    error: null,
    expiresInDays: 14,
    inviteUrl: null,
    isSubmitting: false,
    onCopy: () => {},
    onExpiresInDaysChange: () => {},
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

type Story = StoryObj<typeof CompanyApplicationInviteDialog>;

export const Open: Story = {};

export const Generated: Story = {
  args: { inviteUrl: "http://localhost:38412/apply?token=sample-token" },
};

export const Copied: Story = {
  args: { copied: true, inviteUrl: "http://localhost:38412/apply?token=sample-token" },
};

export const Error: Story = { args: { error: "Invite could not be generated." } };

export const Submitting: Story = { args: { isSubmitting: true } };
