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
      CompanyUpdate: Effect.fn("Rpc.CompanyUpdate")(function* (input) {
        yield* Effect.annotateCurrentSpan({ "company.id": input.id });
        return yield* service.update(input).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      CompanyDelete: Effect.fn("Rpc.CompanyDelete")(function* ({ id }) {
        yield* Effect.annotateCurrentSpan({ "company.id": id });
        return yield* service.delete(id).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      CompanyDetailGet: Effect.fn("Rpc.CompanyDetailGet")(function* ({ id }) {
        yield* Effect.annotateCurrentSpan({ "company.id": id });
        return yield* service.getDetail(id).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      CompanySourceCreate: Effect.fn("Rpc.CompanySourceCreate")(function* (input) {
        yield* Effect.annotateCurrentSpan({ "company.id": input.companyId });
        return yield* service.createSource(input).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      CompanySourceRetry: Effect.fn("Rpc.CompanySourceRetry")(function* (input) {
        yield* Effect.annotateCurrentSpan({
          "company.id": input.companyId,
          "source.id": input.sourceId,
        });
        return yield* service.retrySource(input).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      CompanyWatchTargetCreate: Effect.fn("Rpc.CompanyWatchTargetCreate")(function* (input) {
        yield* Effect.annotateCurrentSpan({ "company.id": input.companyId });
        return yield* service
          .createWatchTarget(input)
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      CompanyApplicationInviteCreate: Effect.fn("Rpc.CompanyApplicationInviteCreate")(
        function* (input) {
          return yield* service
            .createApplicationInvite(input)
            .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
        },
      ),
    };
  }),
);
