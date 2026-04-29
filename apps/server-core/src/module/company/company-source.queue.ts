import { Context, Effect } from "effect";

export type CompanySourceIngestQueueInput = {
  readonly companyId: string;
  readonly sourceId: string;
  readonly reason: "source_created" | "source_retried";
};

export class CompanySourceIngestQueue extends Context.Service<
  CompanySourceIngestQueue,
  {
    readonly enqueue: (input: CompanySourceIngestQueueInput) => Effect.Effect<string>;
  }
>()("module/CompanySourceIngestQueue") {}
