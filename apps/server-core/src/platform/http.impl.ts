import { Layer } from "effect";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { HealthHttpHandlers } from "../module/health/health.http.impl";
import { AuthHttpHandlers } from "./auth/auth.http.impl";
import { HttpApiDef } from "./http.contract";

const ApiRoutes = HttpApiBuilder.layer(HttpApiDef, {
  openapiPath: "/api/http/openapi.json",
}).pipe(Layer.provide(HealthHttpHandlers), Layer.provide(AuthHttpHandlers));

const DocsRoute = HttpApiScalar.layer(HttpApiDef, { path: "/api/http/docs" });

export const HttpApiLive = Layer.mergeAll(ApiRoutes, DocsRoute);
