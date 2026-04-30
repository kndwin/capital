import type { MemoMaxPages, MemoRecord } from "@capital/server-core/rpc";
import { Button } from "@/shared/ui/button.ui";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty.ui";
import { Skeleton } from "@/shared/ui/skeleton.ui";
import { cn } from "@/shared/util/cn.util";

const MAX_PAGES_OPTIONS: ReadonlyArray<MemoMaxPages> = [1, 2, 3];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function MemoPreview({
  html,
  records,
  activeMemoId,
  onSelectMemo,
  maxPages,
  onMaxPagesChange,
  isGenerating,
  error,
  onGenerate,
}: {
  readonly html: string;
  readonly records: ReadonlyArray<MemoRecord>;
  readonly activeMemoId: string | null;
  readonly onSelectMemo: (id: string | null) => void;
  readonly maxPages: MemoMaxPages;
  readonly onMaxPagesChange: (value: MemoMaxPages) => void;
  readonly isGenerating: boolean;
  readonly error: string | null;
  readonly onGenerate: () => void;
}) {
  const hasHistory = records.length > 0;
  return (
    <div data-slot="memo-preview" className="flex h-full min-h-[34rem] flex-col overflow-hidden">
      <div
        data-slot="memo-preview-toolbar"
        className="flex flex-wrap items-center justify-between gap-3 border-b bg-background/60 px-4 py-2"
      >
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Pages
            <div className="flex overflow-hidden rounded-md border">
              {MAX_PAGES_OPTIONS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onMaxPagesChange(value)}
                  className={cn(
                    "px-2 py-0.5 text-xs",
                    value === maxPages
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground hover:bg-muted",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          </label>
          <span className="text-xs text-muted-foreground">
            {hasHistory
              ? `${records.length} memo${records.length === 1 ? "" : "s"} on file`
              : "No memos yet"}
          </span>
        </div>
        <Button
          size="sm"
          variant={hasHistory ? "outline" : "default"}
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating…" : hasHistory ? "Generate new" : "Generate AI memo"}
        </Button>
      </div>
      {error ? (
        <div className="border-b bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</div>
      ) : null}
      {hasHistory ? (
        <div
          data-slot="memo-preview-history"
          className="flex gap-1.5 overflow-x-auto border-b bg-background/40 px-4 py-2"
        >
          {records.map((record) => (
            <button
              key={record.id}
              type="button"
              onClick={() => onSelectMemo(record.id)}
              className={cn(
                "shrink-0 rounded-md border px-2.5 py-1 text-xs",
                record.id === activeMemoId
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {dateFormatter.format(new Date(record.createdAt))} · {record.config.maxPages}p
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex-1 bg-[#f5f4ed]">
        <iframe
          data-slot="memo-preview-frame"
          title="Memo preview"
          srcDoc={html}
          className="h-[calc(100vh-24rem)] min-h-[40rem] w-full border-0 bg-[#f5f4ed]"
          sandbox=""
        />
      </div>
    </div>
  );
}

export function MemoPreviewLoading() {
  return (
    <div data-slot="memo-preview-loading" className="space-y-4 p-5">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function MemoPreviewError() {
  return (
    <Empty data-slot="memo-preview-error" className="min-h-[34rem]">
      <EmptyHeader>
        <EmptyMedia variant="icon">!</EmptyMedia>
        <EmptyTitle>Memo preview could not be loaded</EmptyTitle>
        <EmptyDescription>The seed memo renderer did not return preview HTML.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
