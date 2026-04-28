import { Context, Effect, Layer } from "effect";

export type CompanyCheckEngineQueueInput = {
  readonly companyId: string;
  readonly reason: string;
  readonly inputKey: string;
};

export class CompanyCheckEngineQueue extends Context.Service<
  CompanyCheckEngineQueue,
  {
    readonly enqueue: (input: CompanyCheckEngineQueueInput) => Effect.Effect<string>;
  }
>()("module/CompanyCheckEngineQueue") {}

export const CompanyCheckEngineQueueNoopLive = Layer.succeed(
  CompanyCheckEngineQueue,
  CompanyCheckEngineQueue.of({
    enqueue: (_input: CompanyCheckEngineQueueInput) => Effect.succeed("noop"),
  }),
);
