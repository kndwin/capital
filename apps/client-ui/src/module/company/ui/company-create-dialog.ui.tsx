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
  open,
}: {
  readonly error?: string | null;
  readonly isSubmitting?: boolean;
  readonly name: string;
  readonly onNameChange: (name: string) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: () => void;
  readonly open: boolean;
}) {
  const trimmedName = name.trim();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button type="button" size="sm" />}>
        <PlusIcon />
        New company
      </DialogTrigger>
      <DialogContent className="max-w-lg" showCloseButton={!isSubmitting}>
        <form
          data-slot="company-create-dialog"
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmedName) onSubmit();
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

          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Create now with a name. Sources and checks come in the next iteration.
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
            <Button type="submit" disabled={!trimmedName || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
