import { AtomRpc } from "effect/unstable/reactivity";
import { ApiGroup, rpcProtocolLayer } from "@capital/client-api/rpc";

export class CompanyCheckClient extends AtomRpc.Service<CompanyCheckClient>()(
  "client-ui/company-check/CompanyCheckClient",
  { group: ApiGroup, protocol: rpcProtocolLayer("/api/rpc") },
) {}

export const setCompanyCheckOverride = CompanyCheckClient.mutation("CompanyCheckOverrideSet");

export const runCompanyCheckEngine = CompanyCheckClient.mutation("CompanyCheckEngineRun");
