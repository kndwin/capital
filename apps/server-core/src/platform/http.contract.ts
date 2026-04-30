import { HttpApi, OpenApi } from "effect/unstable/httpapi";
import { CompanyHttpGroup } from "../module/company/company.http.contract";
import { HealthHttpGroup } from "../module/health/health.http.contract";
import { AuthHttpGroup } from "./auth/auth.http.contract";

export { CompanyHttpGroup } from "../module/company/company.http.contract";
export { HealthHttpGroup } from "../module/health/health.http.contract";
export { AuthHttpGroup } from "./auth/auth.http.contract";

export class HttpApiDef extends HttpApi.make("server-core")
  .add(HealthHttpGroup)
  .add(CompanyHttpGroup)
  .add(AuthHttpGroup)
  .prefix("/api/http")
  .annotateMerge(
    OpenApi.annotations({
      title: "server-core public API",
      description: "Public HTTP endpoints: health, readiness, docs.",
    }),
  ) {}
