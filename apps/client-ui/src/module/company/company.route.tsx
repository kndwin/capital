import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Cause, Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { companiesAtom, createCompany } from "./company.atom";
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
  const companies = useAtomValue(companiesAtom);
  const create = useAtomSet(createCompany, { mode: "promiseExit" });
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const [createName, setCreateName] = React.useState("");
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [isCreating, startCreateTransition] = React.useTransition();

  const handleCreateCompany = () => {
    const name = createName.trim();
    if (!name) return;
    setCreateError(null);
    startCreateTransition(async () => {
      const exit = await create({
        payload: { name },
        reactivityKeys: ["companies"],
      });
      if (Exit.isFailure(exit)) {
        setCreateError(Cause.pretty(exit.cause));
        return;
      }
      setCreateName("");
      setCreateOpen(false);
    });
  };

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <ModuleLayoutTitle>Companies</ModuleLayoutTitle>
        <ModuleLayoutActions>
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
            open={isCreateOpen}
          />
        </ModuleLayoutActions>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        {AsyncResult.match(companies, {
          onInitial: () => <CompanyListLoading />,
          onFailure: () => <CompanyListError />,
          onSuccess: (result) =>
            result.value.length === 0 ? (
              <CompanyListEmpty />
            ) : (
              <CompanyList companies={result.value} />
            ),
        })}
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
