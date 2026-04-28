import { Effect } from "effect";
import { CompanyCheckRpcs } from "./company-check.rpc.contract";
import { CompanyCheckService } from "./company-check.service";
import { CompanyCheckEngineWorkflow } from "./company-check.workflow";

export const CompanyCheckLive = CompanyCheckRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* CompanyCheckService;
    return {
      CompanyCheckOverrideSet: Effect.fn("Rpc.CompanyCheckOverrideSet")(function* (input) {
        return yield* service
          .setCheckOverride(input)
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      CompanyCheckEngineRun: Effect.fn("Rpc.CompanyCheckEngineRun")(function* (input) {
        return yield* CompanyCheckEngineWorkflow.execute(input, { discard: true });
      }),
    };
  }),
);
