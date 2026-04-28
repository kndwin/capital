import { createFileRoute, Link } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import type { Company } from "@capital/server-core/rpc";
import { companyDetailAtom } from "./company.atom";
import { CompanyDetail, CompanyDetailError, CompanyDetailLoading } from "./ui/company-detail.ui";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb.ui";
import { ModuleLayout, ModuleLayoutBody, ModuleLayoutHeader } from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/company/$companyId")({
  component: CompanyDetailPage,
});

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  const company = useAtomValue(companyDetailAtom(companyId));

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        {AsyncResult.match(company, {
          onInitial: () => <CompanyDetailBreadcrumb />,
          onFailure: () => <CompanyDetailBreadcrumb />,
          onSuccess: (result) => <CompanyDetailBreadcrumb company={result.value.company} />,
        })}
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        {AsyncResult.match(company, {
          onInitial: () => <CompanyDetailLoading />,
          onFailure: () => <CompanyDetailError />,
          onSuccess: (result) => <CompanyDetail detail={result.value} />,
        })}
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}

function CompanyDetailBreadcrumb({ company }: { readonly company?: Company }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link to="/company" />}>Companies</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{company?.name ?? "Company"}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
