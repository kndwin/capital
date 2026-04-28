import { FetchHttpClient } from "effect/unstable/http";

export { HttpApiDef } from "@capital/server-core/http";

export const httpClientLayer = FetchHttpClient.layer;
