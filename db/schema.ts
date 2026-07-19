import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const semanticRateLimits = sqliteTable("semantic_rate_limits", {
  ipHash: text("ip_hash").primaryKey(),
  windowStartedAt: integer("window_started_at").notNull(),
  requestCount: integer("request_count").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
