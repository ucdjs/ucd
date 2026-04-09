import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export type UnicodeVersionStatus = "stable" | "draft" | "unsupported";

export const versions = sqliteTable("versions", {
  version: text("version").primaryKey(),
  major: integer("major").notNull(),
  minor: integer("minor").notNull(),
  patch: integer("patch").notNull(),
  documentationUrl: text("documentation_url").notNull(),
  date: text("date"),
  url: text("url").notNull(),
  mappedUcdVersion: text("mapped_ucd_version"),
  status: text("status").$type<UnicodeVersionStatus>().notNull(),
  manifestPath: text("manifest_path"),
  snapshotPath: text("snapshot_path"),
  fileCount: integer("file_count"),
  totalSize: integer("total_size"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  indexedAt: integer("indexed_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  index("versions_status_idx").on(table.status),
  index("versions_semver_idx").on(table.major, table.minor, table.patch),
  index("versions_indexed_at_idx").on(table.indexedAt),
]);

export type Version = typeof versions.$inferSelect;
export type InsertVersion = typeof versions.$inferInsert;
