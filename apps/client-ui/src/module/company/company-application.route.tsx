import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import {
  CompanyApplicationForm,
  CompanyApplicationSubmitted,
  type CompanyApplicationFormValue,
  type CompanyApplicationLinkDraft,
} from "./ui/company-application-form.ui";

export const Route = createFileRoute("/apply")({
  component: CompanyApplicationPage,
});

const emptyApplication: CompanyApplicationFormValue = {
  name: "",
  website: "",
  description: "",
  product: "",
  customer: "",
  traction: "",
  fundraise: "",
  notes: "",
  links: [{ id: "link-1", title: "", url: "" }],
  files: [],
};

function CompanyApplicationPage() {
  const search = new URLSearchParams(window.location.search);
  const token = search.get("token")?.trim() ?? "";
  const [value, setValue] = React.useState<CompanyApplicationFormValue>(emptyApplication);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [isSubmitting, startSubmitTransition] = React.useTransition();

  const handleSubmit = () => {
    setError(null);
    startSubmitTransition(async () => {
      const files = await Promise.all(
        value.files.map(async (file) => ({
          fileName: file.name,
          contentBase64: await readFileAsBase64(file),
        })),
      );
      const response = await fetch("/api/http/company/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          name: value.name.trim(),
          website: value.website.trim() || null,
          description: value.description.trim() || null,
          product: value.product.trim(),
          customer: value.customer.trim(),
          traction: value.traction.trim(),
          fundraise: value.fundraise.trim() || null,
          notes: value.notes.trim() || null,
          links: value.links
            .map((link) => ({ title: link.title.trim() || null, url: link.url.trim() }))
            .filter((link) => link.url),
          files,
        }),
      });
      if (!response.ok) {
        setError(await readErrorMessage(response));
        return;
      }
      setSubmitted(true);
    });
  };

  if (submitted) return <CompanyApplicationSubmitted />;

  return (
    <CompanyApplicationForm
      error={error}
      isSubmitting={isSubmitting}
      onAddLink={() => setValue({ ...value, links: [...value.links, createLinkDraft()] })}
      onChange={setValue}
      onFilesChange={(files) => setValue({ ...value, files })}
      onRemoveLink={(id) =>
        setValue({ ...value, links: value.links.filter((link) => link.id !== id) })
      }
      onSubmit={handleSubmit}
      onUpdateLink={(next) =>
        setValue({
          ...value,
          links: value.links.map((link) => (link.id === next.id ? next : link)),
        })
      }
      tokenMissing={!token}
      value={value}
    />
  );
}

function createLinkDraft(): CompanyApplicationLinkDraft {
  return { id: crypto.randomUUID(), title: "", url: "" };
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",")[1] ?? "");
    });
    reader.addEventListener("error", () =>
      reject(reader.error ?? new Error("Failed to read file")),
    );
    reader.readAsDataURL(file);
  });
}

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return "Application could not be submitted.";
  return text;
}
