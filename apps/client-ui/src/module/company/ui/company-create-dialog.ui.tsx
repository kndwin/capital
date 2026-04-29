import { PlusIcon } from "lucide-react";
import { Button } from "@/shared/ui/button.ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog.ui";
import { Input } from "@/shared/ui/input.ui";

export type CompanyCreateSourceDraft = {
  readonly enabled: boolean;
  readonly kind: "url" | "note" | "pdf" | "chat";
  readonly title: string;
  readonly url: string;
  readonly text: string;
  readonly prompt: string;
  readonly file: File | null;
};

export function CompanyCreateDialog({
  description,
  error,
  isSubmitting,
  name,
  onDescriptionChange,
  onNameChange,
  onOpenChange,
  onSourceChange,
  onSubmit,
  onWebsiteChange,
  open,
  source,
  website,
}: {
  readonly description: string;
  readonly error?: string | null;
  readonly isSubmitting?: boolean;
  readonly name: string;
  readonly onDescriptionChange: (description: string) => void;
  readonly onNameChange: (name: string) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSourceChange: (source: CompanyCreateSourceDraft) => void;
  readonly onSubmit: () => void;
  readonly onWebsiteChange: (website: string) => void;
  readonly open: boolean;
  readonly source: CompanyCreateSourceDraft;
  readonly website: string;
}) {
  const trimmedName = name.trim();
  const canSubmitSource =
    !source.enabled ||
    (source.kind === "url"
      ? source.url.trim()
      : source.kind === "pdf"
        ? source.file
        : source.kind === "chat"
          ? source.prompt.trim()
          : source.text.trim());
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button type="button" size="sm" />}>
        <PlusIcon />
        New company
      </DialogTrigger>
      <DialogContent className="max-w-2xl" showCloseButton={!isSubmitting}>
        <form
          data-slot="company-create-dialog"
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmedName && canSubmitSource) onSubmit();
          }}
        >
          <DialogHeader>
            <DialogDescription className="text-xs font-medium uppercase tracking-[0.18em]">
              New company
            </DialogDescription>
            <DialogTitle>Add a company</DialogTitle>
          </DialogHeader>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="company-name">
              Name
            </label>
            <Input
              id="company-name"
              autoFocus
              value={name}
              onChange={(event) => onNameChange(event.currentTarget.value)}
              placeholder="Bevel"
              disabled={isSubmitting}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="company-website"
              >
                Website
              </label>
              <Input
                id="company-website"
                value={website}
                onChange={(event) => onWebsiteChange(event.currentTarget.value)}
                placeholder="https://bevel.com"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <label
                className="text-sm font-medium text-muted-foreground"
                htmlFor="company-description"
              >
                Description
              </label>
              <textarea
                id="company-description"
                data-slot="company-create-description"
                className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                value={description}
                onChange={(event) => onDescriptionChange(event.currentTarget.value)}
                placeholder="Short company summary or what you already know"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={source.enabled}
                onChange={(event) =>
                  onSourceChange({ ...source, enabled: event.currentTarget.checked })
                }
                disabled={isSubmitting}
              />
              Add a first source
            </label>
            {source.enabled ? (
              <div className="grid gap-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="xs"
                    variant={source.kind === "url" ? "secondary" : "ghost"}
                    onClick={() => onSourceChange({ ...source, kind: "url" })}
                    disabled={isSubmitting}
                  >
                    URL
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant={source.kind === "note" ? "secondary" : "ghost"}
                    onClick={() => onSourceChange({ ...source, kind: "note" })}
                    disabled={isSubmitting}
                  >
                    Note
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant={source.kind === "chat" ? "secondary" : "ghost"}
                    onClick={() => onSourceChange({ ...source, kind: "chat" })}
                    disabled={isSubmitting}
                  >
                    AI Research
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant={source.kind === "pdf" ? "secondary" : "ghost"}
                    onClick={() => onSourceChange({ ...source, kind: "pdf" })}
                    disabled={isSubmitting}
                  >
                    PDF
                  </Button>
                </div>
                <Input
                  value={source.title}
                  onChange={(event) =>
                    onSourceChange({ ...source, title: event.currentTarget.value })
                  }
                  placeholder="Optional source title"
                  disabled={isSubmitting}
                />
                {source.kind === "url" ? (
                  <Input
                    value={source.url}
                    onChange={(event) =>
                      onSourceChange({ ...source, url: event.currentTarget.value })
                    }
                    placeholder="https://company.com/deck"
                    disabled={isSubmitting}
                  />
                ) : source.kind === "pdf" ? (
                  <Input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) =>
                      onSourceChange({ ...source, file: event.currentTarget.files?.[0] ?? null })
                    }
                    disabled={isSubmitting}
                  />
                ) : source.kind === "chat" ? (
                  <textarea
                    data-slot="company-create-source-chat"
                    className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                    value={source.prompt}
                    onChange={(event) =>
                      onSourceChange({ ...source, prompt: event.currentTarget.value })
                    }
                    placeholder="Ask AI what to research, for example: Find recent traction, customer signals, pricing, competitors, and founder background."
                    disabled={isSubmitting}
                  />
                ) : (
                  <textarea
                    data-slot="company-create-source-note"
                    className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                    value={source.text}
                    onChange={(event) =>
                      onSourceChange({ ...source, text: event.currentTarget.value })
                    }
                    placeholder="Paste notes, transcript excerpts, or diligence observations"
                    disabled={isSubmitting}
                  />
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!trimmedName || !canSubmitSource || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
