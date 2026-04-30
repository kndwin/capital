import { Cron, Effect } from "effect";
import { ClusterCron } from "effect/unstable/cluster";
import { CompanyMarketWatchService } from "./company-market-watch.service";

export const CompanyMarketWatchCronLive = ClusterCron.make({
  name: "CompanyMarketWatchDaily",
  cron: Cron.parseUnsafe("0 0 9 * * *", "America/New_York"),
  calculateNextRunFromPrevious: true,
  skipIfOlderThan: "6 hours",
  execute: Effect.gen(function* () {
    const service = yield* CompanyMarketWatchService;
    yield* service.scanAll();
  }).pipe(Effect.catch((error) => Effect.logWarning("company_market_watch.daily_failed", error))),
});
