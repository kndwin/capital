import type { Meta, StoryObj } from "@storybook/react";
import { MemoPreview, MemoPreviewError, MemoPreviewLoading } from "./memo-preview.ui";

const sampleHtml = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><style>body{margin:0;background:#f5f4ed;color:#141413;font-family:Georgia,serif}.memo{padding:40px}.card{border:1px solid #e8e6dc;background:#faf9f5;padding:24px}h1{font-size:42px;margin:0 0 12px}</style></head>
<body><main class="memo"><section class="card"><p>SEED · ROBOTICS</p><h1>Acme Robotics</h1><p>Warehouse autonomy for mid-market 3PLs.</p></section></main></body>
</html>`;

const meta: Meta<typeof MemoPreview> = {
  title: "Company/MemoPreview",
  component: MemoPreview,
  args: {
    html: sampleHtml,
    records: [],
    activeMemoId: null,
    onSelectMemo: () => undefined,
    maxPages: 1,
    onMaxPagesChange: () => undefined,
    isGenerating: false,
    error: null,
    onGenerate: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof MemoPreview>;

export const Default: Story = {};
export const Loading: Story = { render: () => <MemoPreviewLoading /> };
export const Error: Story = { render: () => <MemoPreviewError /> };
