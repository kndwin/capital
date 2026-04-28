import { Effect, Layer, Schema } from "effect";
import { Workflow, WorkflowEngine } from "effect/unstable/workflow";
import { ErrorCompanyNotFound } from "../company/company.error";
import { CompanyCheckEngineQueue } from "./company-check.queue";
import { CompanyCheckService } from "./company-check.service";

export const CompanyCheckEngineWorkflow = Workflow.make({
  name: "CompanyCheckEngineWorkflow",
  payload: {
    companyId: Schema.String,
    reason: Schema.String,
    inputKey: Schema.String,
  },
  success: Schema.String,
  error: ErrorCompanyNotFound,
  idempotencyKey: (payload) => `${payload.companyId}:${payload.reason}:${payload.inputKey}`,
});

export const CompanyCheckEngineWorkflowLive = CompanyCheckEngineWorkflow.toLayer((payload) =>
  Effect.gen(function* () {
    const service = yield* CompanyCheckService;
    const run = yield* service
      .runCheckEngine(payload.companyId, payload.reason)
      .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
    return run.id;
  }),
);

export const CompanyCheckEngineQueueLive = Layer.effect(
  CompanyCheckEngineQueue,
  Effect.gen(function* () {
    const workflowEngine = yield* WorkflowEngine.WorkflowEngine;
    return CompanyCheckEngineQueue.of({
      enqueue: Effect.fn("CompanyCheckEngineQueue.enqueue")(function* (input) {
        const executionId = yield* CompanyCheckEngineWorkflow.executionId(input);
        return yield* workflowEngine
          .execute(CompanyCheckEngineWorkflow, {
            executionId,
            payload: input,
            discard: true,
          })
          .pipe(Effect.catchTags({ ErrorCompanyNotFound: Effect.die }));
      }),
    });
  }),
);

export const CompanyCheckWorkflowLive = Layer.mergeAll(CompanyCheckEngineWorkflowLive);
