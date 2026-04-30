import { Config, Effect, Layer, Logger } from "effect";
import { RpcSerialization } from "effect/unstable/rpc";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { HttpRouter } from "effect/unstable/http";
import { DbLive } from "./platform/db.impl";
import { AuthLive } from "./platform/auth/auth.impl";
import { AuthCatchallLive } from "./platform/auth/auth.catchall";
import { AuthMiddleware } from "./platform/auth/auth.middleware";
import { CompanyCheckLive } from "./module/company-check/company-check.rpc.impl";
import { CompanyCheckRepoLive } from "./module/company-check/company-check.repo";
import { CompanyCheckServiceLive } from "./module/company-check/company-check.service";
import { CompanyLive } from "./module/company/company.rpc.impl";
import { CompanyRepoLive } from "./module/company/company.repo";
import { CompanyServiceLive } from "./module/company/company.service";
import {
  CompanyCheckEngineQueueLive,
  CompanyCheckWorkflowLive,
} from "./module/company-check/company-check.workflow";
import {
  CompanySourceIngestQueueLive,
  CompanySourceWorkflowLive,
} from "./module/company/company-source.workflow";
import { CompanyMarketWatchCronLive } from "./module/company/company-market-watch.cron";
import { CompanyMarketWatchServiceLive } from "./module/company/company-market-watch.service";
import { CompanyAiServiceLive } from "./module/company-ai/company-ai.service";
import { HealthLive } from "./module/health/health.rpc.impl";
import { MemoRepoLive } from "./module/memo/memo.repo";
import { MemoLive } from "./module/memo/memo.rpc.impl";
import { MemoServiceLive } from "./module/memo/memo.service";
import { HttpApiLive } from "./platform/http.impl";
import { RpcLive } from "./platform/rpc.impl";
import { StaticLive } from "./platform/static.impl";
import { WorkflowEngineLive } from "./platform/workflow.impl";
import { UsersRepoLive } from "./module/users/users.repo.impl";

const Infra = DbLive;

const CompanyCheckDomain = CompanyCheckServiceLive.pipe(
  Layer.provide(CompanyCheckRepoLive),
  Layer.provide(CompanyRepoLive),
  Layer.provide(CompanyCheckEngineQueueLive),
);

const CompanySourceDomain = Layer.mergeAll(CompanyAiServiceLive);

const Domain = Layer.mergeAll(
  UsersRepoLive,
  CompanyCheckDomain,
  CompanyServiceLive.pipe(
    Layer.provide(CompanyRepoLive),
    Layer.provide(CompanyCheckDomain),
    Layer.provide(CompanySourceIngestQueueLive),
  ),
  CompanyMarketWatchServiceLive.pipe(
    Layer.provide(CompanyAiServiceLive),
    Layer.provide(CompanyRepoLive),
    Layer.provide(
      CompanyServiceLive.pipe(
        Layer.provide(CompanyRepoLive),
        Layer.provide(CompanyCheckDomain),
        Layer.provide(CompanySourceIngestQueueLive),
      ),
    ),
  ),
  MemoServiceLive,
  MemoRepoLive,
);

const Handlers = Layer.mergeAll(HealthLive, CompanyLive, CompanyCheckLive, MemoLive).pipe(
  Layer.provide(AuthLive),
);

const HttpRoutes = Layer.mergeAll(HttpApiLive, AuthCatchallLive, AuthMiddleware, StaticLive).pipe(
  Layer.provide(AuthLive),
);

const AppLive = Layer.mergeAll(
  // NDJSON instead of JSON so streaming RPCs (SessionEventsWatch) can frame
  // chunks over the response body. JSON serializer emits a single value per
  // response and would buffer the stream until completion.
  RpcLive.pipe(Layer.provide(Handlers), Layer.provide(RpcSerialization.layerNdjson)),
  HttpRoutes,
  CompanyCheckWorkflowLive,
  CompanySourceWorkflowLive.pipe(
    Layer.provide(CompanySourceDomain),
    Layer.provide(CompanyRepoLive),
  ),
  CompanyMarketWatchCronLive,
).pipe(Layer.provide(Domain), Layer.provide(Infra), Layer.provide(WorkflowEngineLive));

const PortConfig = Config.int("PORT").pipe(Config.withDefault(38412));

const LoggerLive = Layer.unwrap(
  Effect.gen(function* () {
    const nodeEnv = yield* Config.string("NODE_ENV").pipe(Config.withDefault("development"));
    return nodeEnv === "production"
      ? Logger.layer([Logger.consoleLogFmt])
      : Logger.layer([Logger.consoleLogFmt]);
  }),
);

const ServerLive = Layer.unwrap(
  Effect.gen(function* () {
    const port = yield* PortConfig;
    return HttpRouter.serve(AppLive).pipe(
      Layer.provide(BunHttpServer.layer({ hostname: "0.0.0.0", port })),
    );
  }),
);

BunRuntime.runMain(
  Effect.gen(function* () {
    const port = yield* PortConfig;
    yield* Effect.log(`Server listening on http://0.0.0.0:${port}`);
    yield* Layer.launch(ServerLive);
  }).pipe(Effect.provide(LoggerLive)),
);
