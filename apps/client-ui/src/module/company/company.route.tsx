import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Cause, Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import type { Company } from "@capital/server-core/rpc";
import {
  companiesAtom,
  createCompany,
  createCompanyApplicationInvite,
  deleteCompany,
} from "./company.atom";
import { CompanyApplicationInviteDialog } from "./ui/company-application-invite-dialog.ui";
import { CompanyCreateDialog } from "./ui/company-create-dialog.ui";
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
  const createInvite = useAtomSet(createCompanyApplicationInvite, { mode: "promiseExit" });
  const deleteCompanyById = useAtomSet(deleteCompany, { mode: "promiseExit" });
  const [isInviteOpen, setInviteOpen] = React.useState(false);
  const [inviteExpiresInDays, setInviteExpiresInDays] = React.useState(14);
  const [inviteUrl, setInviteUrl] = React.useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createUrl, setCreateUrl] = React.useState("");
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = React.useState<string | null>(null);
  const [isCreatingInvite, startInviteTransition] = React.useTransition();
  const [isCreating, startCreateTransition] = React.useTransition();
  const [, startDeleteTransition] = React.useTransition();

  const handleCreateInvite = () => {
    setInviteError(null);
    setInviteCopied(false);
    startInviteTransition(async () => {
      const exit = await createInvite({ payload: { expiresInDays: inviteExpiresInDays } });
      if (Exit.isFailure(exit)) {
        setInviteError(Cause.pretty(exit.cause));
        return;
      }
      setInviteUrl(new URL(exit.value.url, window.location.origin).toString());
    });
  };

  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    void navigator.clipboard.writeText(inviteUrl).then(() => setInviteCopied(true));
  };

  const handleCreateCompany = () => {
    const url = createUrl.trim();
    if (!url) return;
    setCreateError(null);
    startCreateTransition(async () => {
      const exit = await create({
        payload: {
          name: createName.trim(),
          url,
        },
        reactivityKeys: ["companies"],
      });
      if (Exit.isFailure(exit)) {
        setCreateError(Cause.pretty(exit.cause));
        return;
      }
      setCreateName("");
      setCreateUrl("");
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
          <CompanyApplicationInviteDialog
            copied={inviteCopied}
            error={inviteError}
            expiresInDays={inviteExpiresInDays}
            inviteUrl={inviteUrl}
            isSubmitting={isCreatingInvite}
            onCopy={handleCopyInvite}
            onExpiresInDaysChange={setInviteExpiresInDays}
            onOpenChange={(open) => {
              setInviteOpen(open);
              if (open) {
                setInviteError(null);
                setInviteCopied(false);
              }
            }}
            onSubmit={handleCreateInvite}
            open={isInviteOpen}
          />
          <CompanyCreateDialog
            error={createError}
            isSubmitting={isCreating}
            name={createName}
            onNameChange={setCreateName}
            onOpenChange={(open) => {
              setCreateOpen(open);
              if (open) setCreateError(null);
            }}
            onSubmit={handleCreateCompany}
            onUrlChange={setCreateUrl}
            open={isCreateOpen}
            url={createUrl}
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
