import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const companyMemo = pgTable("company_memo", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  narrative: jsonb("narrative").notNull(),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
