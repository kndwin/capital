import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const companyCheck = pgTable("company_check", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  groupId: text("group_id").notNull(),
  groupLabel: text("group_label").notNull(),
  label: text("label").notNull(),
  status: text("status").notNull(),
  detail: text("detail"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const companyCheckRun = pgTable("company_check_run", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  status: text("status").notNull(),
  engineVersion: text("engine_version").notNull(),
  inputHash: text("input_hash").notNull(),
  reason: text("reason").notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const companyEngineCheck = pgTable("company_engine_check", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  checkDefinitionId: text("check_definition_id").notNull(),
  groupId: text("group_id").notNull(),
  groupLabel: text("group_label").notNull(),
  label: text("label").notNull(),
  status: text("status").notNull(),
  score: integer("score").notNull(),
  detail: text("detail"),
  rationale: text("rationale").notNull(),
  runId: text("run_id").notNull(),
  engineVersion: text("engine_version").notNull(),
  inputHash: text("input_hash").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const companyCheckOverride = pgTable("company_check_override", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  checkDefinitionId: text("check_definition_id").notNull(),
  status: text("status").notNull(),
  score: integer("score").notNull(),
  detail: text("detail"),
  rationale: text("rationale").notNull(),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const companyCheckInsight = pgTable("company_check_insight", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  checkDefinitionId: text("check_definition_id").notNull(),
  insightId: text("insight_id").notNull(),
  runId: text("run_id").notNull(),
  relationship: text("relationship").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
