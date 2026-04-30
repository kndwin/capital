import { Clock, Context, Effect, Layer } from "effect";
import { CompanyAiService } from "../company-ai/company-ai.service";
import type { CompanyAiMarketWatchCandidate } from "../company-ai/company-ai.schema";
import { CompanyRepo } from "./company.repo";
import { CompanyService } from "./company.service";
import type { Company } from "./company.schema";

const withModuleLogs = Effect.annotateLogs({ module: "company-market-watch" });
const confidenceThreshold = 0.8;
const maxSourcesPerCompany = 3;

export const marketWatchSites = [
  "company website news, press, blog, customers, and case studies pages",
  "producthunt.com",
  "news.ycombinator.com Launch HN posts",
  "techcrunch.com",
  "businesswire.com",
  "prnewswire.com",
] as const;

export class CompanyMarketWatchService extends Context.Service<CompanyMarketWatchService>()(
  "module/CompanyMarketWatchService",
  {
    make: Effect.gen(function* () {
      const ai = yield* CompanyAiService;
      const companyRepo = yield* CompanyRepo;
      const companyService = yield* CompanyService;

      const scanCompany = Effect.fn("CompanyMarketWatchService.scanCompany")(function* (
        companyId: string,
      ) {
        yield* Effect.annotateCurrentSpan({ "company.id": companyId });
        const company = yield* companyService.get(companyId);
        return yield* scanCompanyValue(company);
      }, withModuleLogs);

      const scanAll = Effect.fn("CompanyMarketWatchService.scanAll")(function* () {
        const companies = yield* companyRepo.list();
        let created = 0;
        let skipped = 0;
        for (const company of companies) {
          const result = yield* scanCompanyValue(company).pipe(
            Effect.catchTags({
              ErrorCompanyAi: (error) =>
                Effect.logWarning("company_market_watch.ai_failed", error).pipe(
                  Effect.as({ companyId: company.id, created: 0, skipped: 1 }),
                ),
              ErrorCompanyAiInvalidResponse: (error) =>
                Effect.logWarning("company_market_watch.ai_invalid_response", error).pipe(
                  Effect.as({ companyId: company.id, created: 0, skipped: 1 }),
                ),
              ErrorCompanyNotFound: () =>
                Effect.succeed({ companyId: company.id, created: 0, skipped: 1 }),
            }),
          );
          created += result.created;
          skipped += result.skipped;
        }
        yield* Effect.logInfo("company_market_watch.scan_all.completed", {
          companies: companies.length,
          created,
          skipped,
        });
        return { companies: companies.length, created, skipped };
      }, withModuleLogs);

      const scanCompanyValue = Effect.fn("CompanyMarketWatchService.scanCompanyValue")(function* (
        company: Company,
      ) {
        const watchTargets = yield* companyRepo.listWatchTargets(company.id);
        const activeWatchTargets = watchTargets.filter((target) => target.status === "active");
        if (!hasEnoughCompanyContext(company) && activeWatchTargets.length === 0) {
          return { companyId: company.id, created: 0, skipped: 1 };
        }

        const existingSources = yield* companyRepo.listSources(company.id);
        const existingUrls = new Set(
          existingSources.flatMap((source) => (source.url ? [normalizeUrl(source.url)] : [])),
        );
        const existingTitles = new Set(
          existingSources.map((source) => normalizeTitle(source.title)).filter(Boolean),
        );
        const candidates = yield* ai.findMarketWatchCandidates({
          company,
          sites: [...marketWatchSites, ...activeWatchTargets.map(formatWatchTargetSite)],
        });

        let created = 0;
        let skipped = 0;
        let matched = false;
        for (const candidate of candidates.candidates) {
          if (created >= maxSourcesPerCompany) {
            skipped += 1;
            continue;
          }
          if (!shouldCreateSource({ candidate, existingUrls, existingTitles })) {
            skipped += 1;
            continue;
          }

          const source = yield* companyService.createSource({
            companyId: company.id,
            kind: "url",
            title: candidate.title,
            url: candidate.url,
          });
          existingUrls.add(normalizeUrl(candidate.url));
          existingTitles.add(normalizeTitle(candidate.title));
          created += 1;
          matched = true;
          yield* Effect.logInfo("company_market_watch.source_created", {
            "company.id": company.id,
            "source.id": source.id,
            url: candidate.url,
          });
        }

        const now = yield* Clock.currentTimeMillis;
        for (const target of activeWatchTargets) {
          yield* companyRepo.updateWatchTargetScan({
            id: target.id,
            status: "active",
            lastScannedAt: now,
            lastMatchedAt: matched ? now : target.lastMatchedAt,
            error: null,
          });
        }
        yield* Effect.logInfo("company_market_watch.company_scanned", {
          "company.id": company.id,
          candidates: candidates.candidates.length,
          created,
          skipped,
          scannedAt: now,
        });
        return { companyId: company.id, created, skipped };
      }, withModuleLogs);

      return { scanCompany, scanAll } as const;
    }),
  },
) {}

export const CompanyMarketWatchServiceLive = Layer.effect(
  CompanyMarketWatchService,
  CompanyMarketWatchService.make,
);

export function shouldCreateSource({
  candidate,
  existingUrls,
  existingTitles,
}: {
  readonly candidate: CompanyAiMarketWatchCandidate;
  readonly existingUrls: ReadonlySet<string>;
  readonly existingTitles: ReadonlySet<string>;
}) {
  const normalizedUrl = normalizeUrl(candidate.url);
  const normalizedTitle = normalizeTitle(candidate.title);
  if (candidate.confidence < confidenceThreshold) return false;
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) return false;
  if (existingUrls.has(normalizedUrl)) return false;
  if (normalizedTitle && existingTitles.has(normalizedTitle)) return false;
  return true;
}

function hasEnoughCompanyContext(company: Company) {
  return Boolean(company.website || company.description || company.sector);
}

function formatWatchTargetSite(target: {
  readonly kind: "web_page" | "x_profile";
  readonly locator: string;
  readonly title: string | null;
  readonly url: string | null;
}) {
  const label = target.title ? `${target.title}: ` : "";
  if (target.kind === "x_profile") return `${label}X profile @${target.locator}`;
  return `${label}${target.url ?? target.locator}`;
}

function normalizeUrl(url: string) {
  return url.trim().replace(/\/+$/g, "").toLowerCase();
}

function normalizeTitle(title: string) {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}
