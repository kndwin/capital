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

export function CompanyCreateDialog({
  error,
  isSubmitting,
  name,
  onNameChange,
  onOpenChange,
  onSubmit,
  onUrlChange,
  open,
  url,
}: {
  readonly error?: string | null;
  readonly isSubmitting?: boolean;
  readonly name: string;
  readonly onNameChange: (name: string) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: () => void;
  readonly onUrlChange: (url: string) => void;
  readonly open: boolean;
  readonly url: string;
}) {
  const trimmedUrl = url.trim();
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
            if (trimmedUrl) onSubmit();
          }}
        >
          <DialogHeader>
            <DialogDescription className="text-xs font-medium uppercase tracking-[0.18em]">
              Initial sourcing
            </DialogDescription>
            <DialogTitle>Add a company</DialogTitle>
          </DialogHeader>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="company-name">
              Name <span className="font-normal text-muted-foreground/70">optional</span>
            </label>
            <Input
              id="company-name"
              autoFocus
              value={name}
              onChange={(event) => onNameChange(event.currentTarget.value)}
              placeholder="Leave blank for stealth"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Blank names are created as stealth companies while sourcing starts from the URL.
            </p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="company-url">
              URL
            </label>
            <Input
              id="company-url"
              value={url}
              onChange={(event) => onUrlChange(event.currentTarget.value)}
              placeholder="https://company.com"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-muted-foreground">
              Capital will source the website, market research, and founder research automatically.
            </p>
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
            <Button type="submit" disabled={!trimmedUrl || isSubmitting}>
              {isSubmitting ? "Starting sourcing..." : "Start sourcing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
