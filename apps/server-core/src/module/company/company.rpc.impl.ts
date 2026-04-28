import { Effect } from "effect";
import { CompanyService } from "./company.service";
import { CompanyRpcs } from "./company.rpc.contract";

export const CompanyLive = CompanyRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* CompanyService;
    return {
      CompanyCreate: Effect.fn("Rpc.CompanyCreate")(function* (input) {
        return yield* service.create(input).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      CompanyList: Effect.fn("Rpc.CompanyList")(function* () {
        return yield* service.list().pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      CompanyGet: Effect.fn("Rpc.CompanyGet")(function* ({ id }) {
        yield* Effect.annotateCurrentSpan({ "company.id": id });
        return yield* service.get(id).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
    };
  }),
);
