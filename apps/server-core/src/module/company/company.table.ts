import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const company = pgTable("company", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  stage: text("stage").notNull(),
  sector: text("sector"),
  location: text("location"),
  score: integer("score"),
  riskLevel: text("risk_level").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const companySource = pgTable("company_source", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  confidence: integer("confidence").notNull(),
  selected: boolean("selected").notNull().default(false),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const companySourceInsight = pgTable("company_source_insight", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  sourceId: text("source_id").notNull(),
  kind: text("kind").notNull(),
  locator: text("locator"),
  text: text("text").notNull(),
  extractorVersion: text("extractor_version").notNull().default("seed-v1"),
  insightWorkflowRunId: text("insight_workflow_run_id").notNull().default("seed"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
