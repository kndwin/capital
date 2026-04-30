import { PlusIcon, XIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "@/shared/ui/button.ui";
import { Input } from "@/shared/ui/input.ui";

export type CompanyApplicationLinkDraft = {
  readonly id: string;
  readonly title: string;
  readonly url: string;
};

export type CompanyApplicationFormValue = {
  readonly name: string;
  readonly website: string;
  readonly description: string;
  readonly product: string;
  readonly customer: string;
  readonly traction: string;
  readonly fundraise: string;
  readonly notes: string;
  readonly links: ReadonlyArray<CompanyApplicationLinkDraft>;
  readonly files: ReadonlyArray<File>;
};

export function CompanyApplicationForm({
  error,
  isSubmitting,
  onAddLink,
  onChange,
  onFilesChange,
  onRemoveLink,
  onSubmit,
  onUpdateLink,
  tokenMissing,
  value,
}: {
  readonly error?: string | null;
  readonly isSubmitting?: boolean;
  readonly onAddLink: () => void;
  readonly onChange: (value: CompanyApplicationFormValue) => void;
  readonly onFilesChange: (files: ReadonlyArray<File>) => void;
  readonly onRemoveLink: (id: string) => void;
  readonly onSubmit: () => void;
  readonly onUpdateLink: (link: CompanyApplicationLinkDraft) => void;
  readonly tokenMissing?: boolean;
  readonly value: CompanyApplicationFormValue;
}) {
  const canSubmit =
    !tokenMissing &&
    value.name.trim() &&
    value.product.trim() &&
    value.customer.trim() &&
    value.traction.trim();

  return (
    <main data-slot="company-application-form" className="min-h-dvh bg-background px-4 py-8">
      <div className="mx-auto grid max-w-3xl gap-6">
        <header className="grid gap-3 rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Capital application
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Application</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Answer the key questions, attach any supporting files, and add links we should review.
            Our agent will start source ingestion and public research automatically.
          </p>
        </header>

        {tokenMissing ? (
          <section className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            This application link is missing an invite token. Ask the team for a fresh invite link.
          </section>
        ) : null}

        <form
          className="grid gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) onSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" htmlFor="application-company-name" required>
              <Input
                id="application-company-name"
                autoFocus
                value={value.name}
                onChange={(event) => onChange({ ...value, name: event.currentTarget.value })}
                placeholder="Bevel"
                disabled={isSubmitting}
              />
            </Field>
            <Field label="Website" htmlFor="application-company-website">
              <Input
                id="application-company-website"
                value={value.website}
                onChange={(event) => onChange({ ...value, website: event.currentTarget.value })}
                placeholder="https://bevel.com"
                disabled={isSubmitting}
              />
            </Field>
          </div>

          <TextAreaField
            id="application-description"
            label="One-line description"
            value={value.description}
            onChange={(description) => onChange({ ...value, description })}
            placeholder="What should we remember about the business?"
            disabled={isSubmitting}
          />
          <TextAreaField
            id="application-product"
            label="What are you building?"
            required
            value={value.product}
            onChange={(product) => onChange({ ...value, product })}
            placeholder="Describe the product, workflow, or core technology."
            disabled={isSubmitting}
          />
          <TextAreaField
            id="application-customer"
            label="Who is the customer?"
            required
            value={value.customer}
            onChange={(customer) => onChange({ ...value, customer })}
            placeholder="ICP, buyer, users, and why they need it now."
            disabled={isSubmitting}
          />
          <TextAreaField
            id="application-traction"
            label="Current traction"
            required
            value={value.traction}
            onChange={(traction) => onChange({ ...value, traction })}
            placeholder="Revenue, usage, pilots, customers, growth, retention, or other proof."
            disabled={isSubmitting}
          />
          <TextAreaField
            id="application-fundraise"
            label="Fundraise"
            value={value.fundraise}
            onChange={(fundraise) => onChange({ ...value, fundraise })}
            placeholder="Round, target amount, timing, lead status, or valuation context."
            disabled={isSubmitting}
          />

          <section className="grid gap-3 rounded-xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Links</h2>
                <p className="text-xs text-muted-foreground">
                  Decks, demos, data rooms, press, or docs.
                </p>
              </div>
              <Button
                type="button"
                size="xs"
                variant="secondary"
                onClick={onAddLink}
                disabled={isSubmitting}
              >
                <PlusIcon />
                Add link
              </Button>
            </div>
            {value.links.map((link) => (
              <div key={link.id} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <Input
                  value={link.title}
                  onChange={(event) => onUpdateLink({ ...link, title: event.currentTarget.value })}
                  placeholder="Title"
                  disabled={isSubmitting}
                />
                <Input
                  value={link.url}
                  onChange={(event) => onUpdateLink({ ...link, url: event.currentTarget.value })}
                  placeholder="https://..."
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Remove link"
                  onClick={() => onRemoveLink(link.id)}
                  disabled={isSubmitting}
                >
                  <XIcon />
                </Button>
              </div>
            ))}
          </section>

          <section className="grid gap-3 rounded-xl border bg-muted/20 p-4">
            <div>
              <h2 className="text-sm font-semibold">Files</h2>
              <p className="text-xs text-muted-foreground">
                PDFs work best for now: pitch deck, memo, metrics export, or customer proof.
              </p>
            </div>
            <Input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={(event) => onFilesChange(Array.from(event.currentTarget.files ?? []))}
              disabled={isSubmitting}
            />
            {value.files.length ? (
              <ul className="grid gap-1 text-xs text-muted-foreground">
                {value.files.map((file) => (
                  <li key={`${file.name}:${file.size}`}>{file.name}</li>
                ))}
              </ul>
            ) : null}
          </section>

          <TextAreaField
            id="application-notes"
            label="Anything else we should know?"
            value={value.notes}
            onChange={(notes) => onChange({ ...value, notes })}
            placeholder="Risks, asks, timing, customer references, or context that does not fit above."
            disabled={isSubmitting}
          />

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit application"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export function CompanyApplicationSubmitted() {
  return (
    <main
      data-slot="company-application-submitted"
      className="grid min-h-dvh place-items-center bg-background px-4 py-8"
    >
      <section className="grid max-w-xl gap-3 rounded-2xl border bg-card p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Application received
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Thanks for sharing your company.</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          We created the company profile and started the research agent on your answers, files, and
          links.
        </p>
      </section>
    </main>
  );
}

function Field({
  children,
  htmlFor,
  label,
  required,
}: {
  readonly children: React.ReactNode;
  readonly htmlFor: string;
  readonly label: string;
  readonly required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-muted-foreground" htmlFor={htmlFor}>
        {label}
        {required ? " *" : null}
      </label>
      {children}
    </div>
  );
}

function TextAreaField({
  disabled,
  id,
  label,
  onChange,
  placeholder,
  required,
  value,
}: {
  readonly disabled?: boolean;
  readonly id: string;
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly placeholder: string;
  readonly required?: boolean;
  readonly value: string;
}) {
  return (
    <Field htmlFor={id} label={label} required={required}>
      <textarea
        id={id}
        className="min-h-28 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </Field>
  );
}
