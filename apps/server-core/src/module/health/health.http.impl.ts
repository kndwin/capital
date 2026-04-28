import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { sql } from "drizzle-orm";
import { Db } from "../../platform/db.contract";
import { HttpApiDef } from "../../platform/http.contract";

export const HealthHttpHandlers = HttpApiBuilder.group(
  HttpApiDef,
  "health",
  Effect.fn("HealthHttpHandlers")(function* (handlers) {
    const db = yield* Db;
    return handlers
      .handle("live", () => Effect.succeed({ status: "ok" as const }))
      .handle("ready", () =>
        Effect.gen(function* () {
          const dbOk = yield* db
            .query((d) => d.execute(sql`SELECT 1`))
            .pipe(
              Effect.as("ok" as const),
              Effect.catch(() => Effect.succeed("down" as const)),
            );
          return { db: dbOk };
        }),
      );
  }),
);
