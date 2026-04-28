import { Context, Effect, Schema } from "effect";
import type { PgAsyncDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { company } from "../module/company/company.table";
import type { account, session, user, verification } from "./auth/auth.table";

export class ErrorDb extends Schema.TaggedErrorClass<ErrorDb>()("ErrorDb", {
  message: Schema.String,
  cause: Schema.Defect,
}) {}

export type DbSchema = {
  company: typeof company;
  user: typeof user;
  session: typeof session;
  account: typeof account;
  verification: typeof verification;
};
export type DbClient = PgAsyncDatabase<PgQueryResultHKT, DbSchema>;

export interface DbService {
  readonly client: DbClient;
  readonly query: <A>(fn: (db: DbClient) => A | Promise<A>) => Effect.Effect<Awaited<A>, ErrorDb>;
}

export class Db extends Context.Service<Db, DbService>()("platform/Db") {}
