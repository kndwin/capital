import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

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
