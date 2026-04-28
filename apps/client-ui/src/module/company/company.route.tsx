import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import { companiesAtom } from "./company.atom";
import {
  CompanyList,
  CompanyListEmpty,
  CompanyListError,
  CompanyListLoading,
} from "./ui/company-list.ui";
import {
  ModuleLayout,
  ModuleLayoutBody,
  ModuleLayoutHeader,
  ModuleLayoutTitle,
} from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/company")({
  component: CompanyPage,
});

function CompanyPage() {
  const companies = useAtomValue(companiesAtom);

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <ModuleLayoutTitle>Companies</ModuleLayoutTitle>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        {AsyncResult.match(companies, {
          onInitial: () => <CompanyListLoading />,
          onFailure: () => <CompanyListError />,
          onSuccess: (result) =>
            result.value.length === 0 ? (
              <CompanyListEmpty />
            ) : (
              <CompanyList
                companies={result.value.map((company) => ({
                  company,
                  detailHref: `/company/${company.id}`,
                }))}
              />
            ),
        })}
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
