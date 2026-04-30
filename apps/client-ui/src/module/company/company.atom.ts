import { AtomRpc } from "effect/unstable/reactivity";
import { ApiGroup, rpcProtocolLayer } from "@capital/client-api/rpc";

export class CompanyClient extends AtomRpc.Service<CompanyClient>()(
  "client-ui/company/CompanyClient",
  { group: ApiGroup, protocol: rpcProtocolLayer("/api/rpc") },
) {}

export const companiesAtom = CompanyClient.query("CompanyList", undefined, {
  reactivityKeys: ["companies"],
});

export const companyAtom = (id: string) =>
  CompanyClient.query("CompanyGet", { id }, { reactivityKeys: [`company:${id}`] });

export const companyDetailAtom = (id: string) =>
  CompanyClient.query("CompanyDetailGet", { id }, { reactivityKeys: [`company:${id}`] });

export const createCompany = CompanyClient.mutation("CompanyCreate");

export const updateCompany = CompanyClient.mutation("CompanyUpdate");

export const deleteCompany = CompanyClient.mutation("CompanyDelete");

export const createCompanySource = CompanyClient.mutation("CompanySourceCreate");

export const retryCompanySource = CompanyClient.mutation("CompanySourceRetry");

export const createCompanyWatchTarget = CompanyClient.mutation("CompanyWatchTargetCreate");

export const createCompanyApplicationInvite = CompanyClient.mutation(
  "CompanyApplicationInviteCreate",
);
