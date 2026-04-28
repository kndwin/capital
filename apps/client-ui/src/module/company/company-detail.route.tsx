import { createFileRoute } from "@tanstack/react-router";
import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import { companyAtom } from "./company.atom";
import { CompanyDetail, CompanyDetailError, CompanyDetailLoading } from "./ui/company-detail.ui";
import {
  ModuleLayout,
  ModuleLayoutBody,
  ModuleLayoutHeader,
  ModuleLayoutTitle,
} from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/company/$companyId")({
  component: CompanyDetailPage,
});

function CompanyDetailPage() {
  const { companyId } = Route.useParams();
  const company = useAtomValue(companyAtom(companyId));

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <ModuleLayoutTitle>Company Detail</ModuleLayoutTitle>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        {AsyncResult.match(company, {
          onInitial: () => <CompanyDetailLoading />,
          onFailure: () => <CompanyDetailError />,
          onSuccess: (result) => <CompanyDetail company={result.value} />,
        })}
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
