import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty.ui";
import { Skeleton } from "@/shared/ui/skeleton.ui";

export function MemoPreview({ html }: { readonly html: string }) {
  return (
    <div data-slot="memo-preview" className="h-full min-h-[34rem] bg-[#f5f4ed]">
      <iframe
        data-slot="memo-preview-frame"
        title="Memo preview"
        srcDoc={html}
        className="h-[calc(100vh-18rem)] min-h-[42rem] w-full border-0 bg-[#f5f4ed]"
        sandbox=""
      />
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
