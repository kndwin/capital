import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { HttpApiDef } from "../../platform/http.contract";
import { CompanyService } from "./company.service";

export const CompanyHttpHandlers = HttpApiBuilder.group(
  HttpApiDef,
  "company",
  Effect.fn("CompanyHttpHandlers")(function* (handlers) {
    const service = yield* CompanyService;
    return handlers.handle(
      "submitApplication",
      Effect.fn("HttpApi.company.submitApplication")(function* ({ payload }) {
        return yield* service
          .submitApplication(payload)
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
    );
  }),
);
