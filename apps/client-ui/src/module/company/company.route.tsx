import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Cause, Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import type { Company } from "@capital/server-core/rpc";
import { companiesAtom, createCompany, deleteCompany } from "./company.atom";
import { CompanyCreateDialog, type CompanyCreateSourceDraft } from "./ui/company-create-dialog.ui";
import {
  CompanyList,
  CompanyListEmpty,
  CompanyListError,
  CompanyListLoading,
} from "./ui/company-list.ui";
import {
  ModuleLayout,
  ModuleLayoutActions,
  ModuleLayoutBody,
  ModuleLayoutHeader,
  ModuleLayoutTitle,
} from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/company")({
  component: CompanyPage,
});

function CompanyPage() {
  const navigate = useNavigate();
  const companies = useAtomValue(companiesAtom);
  const create = useAtomSet(createCompany, { mode: "promiseExit" });
  const deleteCompanyById = useAtomSet(deleteCompany, { mode: "promiseExit" });
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createWebsite, setCreateWebsite] = React.useState("");
  const [createDescription, setCreateDescription] = React.useState("");
  const [createSource, setCreateSource] = React.useState<CompanyCreateSourceDraft>({
    enabled: false,
    kind: "url",
    title: "",
    url: "",
    text: "",
    prompt: "",
    file: null,
  });
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = React.useState<string | null>(null);
  const [isCreating, startCreateTransition] = React.useTransition();
  const [, startDeleteTransition] = React.useTransition();

  const handleCreateCompany = () => {
    const name = createName.trim();
    if (!name) return;
    setCreateError(null);
    startCreateTransition(async () => {
      const sourceTitle = createSource.title.trim() || null;
      const source = createSource.enabled
        ? createSource.kind === "url"
          ? {
              kind: "url" as const,
              url: createSource.url.trim(),
              title: sourceTitle,
            }
          : createSource.kind === "pdf" && createSource.file
            ? {
                kind: "pdf" as const,
                fileName: createSource.file.name,
                contentBase64: await readFileAsBase64(createSource.file),
                title: sourceTitle,
              }
            : createSource.kind === "chat"
              ? {
                  kind: "chat" as const,
                  prompt: createSource.prompt.trim(),
                  title: sourceTitle,
                }
              : {
                  kind: "note" as const,
                  text: createSource.text.trim(),
                  title: sourceTitle,
                }
        : null;
      const exit = await create({
        payload: {
          name,
          description: createDescription.trim() || null,
          website: createWebsite.trim() || null,
          source,
        },
        reactivityKeys: ["companies"],
      });
      if (Exit.isFailure(exit)) {
        setCreateError(Cause.pretty(exit.cause));
        return;
      }
      setCreateName("");
      setCreateWebsite("");
      setCreateDescription("");
      setCreateSource({
        enabled: false,
        kind: "url",
        title: "",
        url: "",
        text: "",
        prompt: "",
        file: null,
      });
      setCreateOpen(false);
      await navigate({ to: "/company/$companyId", params: { companyId: exit.value.id } });
    });
  };

  const handleDeleteCompany = (company: Company) => {
    setDeleteError(null);
    setDeletingCompanyId(company.id);
    startDeleteTransition(async () => {
      const exit = await deleteCompanyById({
        payload: { id: company.id },
        reactivityKeys: ["companies", `company:${company.id}`],
      });
      setDeletingCompanyId(null);
      if (Exit.isFailure(exit)) {
        setDeleteError(Cause.pretty(exit.cause));
      }
    });
  };

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <ModuleLayoutTitle>Companies</ModuleLayoutTitle>
        <ModuleLayoutActions>
          <CompanyCreateDialog
            description={createDescription}
            error={createError}
            isSubmitting={isCreating}
            name={createName}
            onDescriptionChange={setCreateDescription}
            onNameChange={setCreateName}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (open) setCreateError(null);
            }}
            onSourceChange={setCreateSource}
            onSubmit={handleCreateCompany}
            onWebsiteChange={setCreateWebsite}
            open={isCreateOpen}
            source={createSource}
            website={createWebsite}
          />
        </ModuleLayoutActions>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        {deleteError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {deleteError}
          </p>
        ) : null}
        {AsyncResult.match(companies, {
          onInitial: () => <CompanyListLoading />,
          onFailure: () => <CompanyListError />,
          onSuccess: (result) =>
            result.value.length === 0 ? (
              <CompanyListEmpty />
            ) : (
              <CompanyList
                companies={result.value}
                deletingCompanyId={deletingCompanyId}
                onDeleteCompany={handleDeleteCompany}
              />
            ),
        })}
      </ModuleLayoutBody>
    </ModuleLayout>
  );
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
