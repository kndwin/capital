import { AtomRpc } from "effect/unstable/reactivity";
import { ApiGroup, rpcProtocolLayer } from "@capital/client-api/rpc";

export class CompanyClient extends AtomRpc.Service<CompanyClient>()(
  "client-ui/company/CompanyClient",
  { group: ApiGroup, protocol: rpcProtocolLayer("/api/rpc") },
) {}

export const companiesAtom = CompanyClient.query("CompanyList", undefined, {
  reactivityKeys: ["companies"],
});

export const companyAtom = (id: string) => CompanyClient.query("CompanyGet", { id });

export const companyDetailAtom = (id: string) => CompanyClient.query("CompanyDetailGet", { id });

export const createCompany = CompanyClient.mutation("CompanyCreate");
