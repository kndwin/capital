import { BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, Logger, Redacted } from "effect";
import { CompanyCheckEngineQueueNoopLive } from "./module/company-check/company-check.queue";
import { CompanyCheckRepoLive } from "./module/company-check/company-check.repo";
import {
  CompanyCheckService,
  CompanyCheckServiceLive,
} from "./module/company-check/company-check.service";
import { CompanyRepoLive } from "./module/company/company.repo";
import { seedCompanies } from "./module/company/company.seed";
import { CompanySourceIngestQueue } from "./module/company/company-source.queue";
import { CompanyService, CompanyServiceLive } from "./module/company/company.service";
import { Db } from "./platform/db.contract";
import { DbSsl, DbUrl } from "./platform/db.config";
import { makeDb } from "./platform/db.impl";

type SeedScenario = {
  readonly name: string;
  readonly run: Effect.Effect<void, unknown, CompanyService | CompanyCheckService>;
};

const SeedDbLive = Layer.unwrap(
  Effect.gen(function* () {
    const url = yield* DbUrl;
    const ssl = yield* DbSsl;
    const db = yield* makeDb(Redacted.value(url), ssl);
    return Layer.succeed(Db, db);
  }),
);

const CompanyCheckSeedLive = CompanyCheckServiceLive.pipe(
  Layer.provide(CompanyCheckRepoLive),
  Layer.provide(CompanyRepoLive),
  Layer.provide(CompanyCheckEngineQueueNoopLive),
);

const CompanySourceIngestQueueNoopLive = Layer.succeed(
  CompanySourceIngestQueue,
  CompanySourceIngestQueue.of({ enqueue: () => Effect.succeed("seed-noop") }),
);

const SeedLive = Layer.mergeAll(
  CompanyCheckSeedLive,
  CompanyServiceLive.pipe(
    Layer.provide(CompanyRepoLive),
    Layer.provide(CompanyCheckSeedLive),
    Layer.provide(CompanySourceIngestQueueNoopLive),
  ),
).pipe(Layer.provide(SeedDbLive));

const scenarios: ReadonlyArray<SeedScenario> = [
  {
    name: "company",
    run: seedCompanies(),
  },
];

const scenarioNames = scenarios.map((scenario) => scenario.name);

const parseRequestedScenarios = Effect.sync(() => {
  const args = Bun.argv.slice(2).flatMap((arg, index, all) => {
    if (arg === "--scenario" || arg === "--scenarios") return [];
    if (all[index - 1] === "--scenario" || all[index - 1] === "--scenarios") return arg.split(",");
    if (arg.startsWith("--scenario=")) return arg.slice("--scenario=".length).split(",");
    if (arg.startsWith("--scenarios=")) return arg.slice("--scenarios=".length).split(",");
    return arg.split(",");
  });
  return args.length === 0 || args.includes("all") ? scenarioNames : args;
});

const program = Effect.gen(function* () {
  const requested = yield* parseRequestedScenarios;
  const unknown = requested.filter((name) => !scenarioNames.includes(name));
  if (unknown.length > 0) {
    yield* Effect.logError(`Unknown seed scenario(s): ${unknown.join(", ")}`);
    yield* Effect.logInfo(`Available seed scenarios: all, ${scenarioNames.join(", ")}`);
    return;
  }

  for (const scenario of scenarios) {
    if (requested.includes(scenario.name)) {
      yield* Effect.logInfo(`Running seed scenario: ${scenario.name}`);
      yield* scenario.run;
    }
  }
}).pipe(Effect.provide(SeedLive));

const LoggerLive = Logger.layer([Logger.consoleLogFmt]);

BunRuntime.runMain(program.pipe(Effect.provide(LoggerLive)));
