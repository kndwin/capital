import { LinkIcon } from "lucide-react";
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

export function CompanyApplicationInviteDialog({
  copied,
  error,
  expiresInDays,
  inviteUrl,
  isSubmitting,
  onCopy,
  onExpiresInDaysChange,
  onOpenChange,
  onSubmit,
  open,
}: {
  readonly copied?: boolean;
  readonly error?: string | null;
  readonly expiresInDays: number;
  readonly inviteUrl?: string | null;
  readonly isSubmitting?: boolean;
  readonly onCopy: () => void;
  readonly onExpiresInDaysChange: (days: number) => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: () => void;
  readonly open: boolean;
}) {
  const canSubmit = expiresInDays >= 1 && expiresInDays <= 90;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button type="button" size="sm" variant="outline" />}>
        <LinkIcon />
        Invite founder
      </DialogTrigger>
      <DialogContent showCloseButton={!isSubmitting}>
        <form
          data-slot="company-application-invite-dialog"
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) onSubmit();
          }}
        >
          <DialogHeader>
            <DialogDescription className="text-xs font-medium uppercase tracking-[0.18em]">
              Single-use application link
            </DialogDescription>
            <DialogTitle>Invite a founder</DialogTitle>
          </DialogHeader>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="invite-expiry">
              Expires in days
            </label>
            <Input
              id="invite-expiry"
              type="number"
              min={1}
              max={90}
              value={String(expiresInDays)}
              onChange={(event) => onExpiresInDaysChange(Number(event.currentTarget.value))}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Links are single-use and become unavailable after a successful submission.
            </p>
          </div>

          {inviteUrl ? (
            <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="invite-url">
                Invite URL
              </label>
              <Input id="invite-url" readOnly value={inviteUrl} />
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCopy}>
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  render={<a href={inviteUrl} target="_blank" rel="noreferrer" />}
                >
                  Open
                </Button>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Close
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Generating..." : inviteUrl ? "Generate another" : "Generate link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
