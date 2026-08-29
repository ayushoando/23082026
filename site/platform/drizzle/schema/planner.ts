import { sql } from "drizzle-orm";
import { bigint, boolean, check, date, integer, pgTable, text, timestamp, jsonb, uuid, index, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at"),
}, (table) => [
  index("profiles_created_at_idx").on(table.createdAt),
]);

export const plans = pgTable("oando_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  engine: text("engine").notNull(),
  payload: jsonb("payload").notNull().default({}),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").notNull().default("draft"),
  revision: bigint("revision", { mode: "number" }).notNull().default(1),
  schemaVersion: integer("schema_version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("plans_user_id_idx").on(table.userId),
  index("plans_status_idx").on(table.status),
  index("plans_created_at_idx").on(table.createdAt),
  index("plans_updated_at_idx").on(table.updatedAt),
  index("plans_user_id_status_idx").on(table.userId, table.status),
  index("plans_user_id_created_at_idx").on(table.userId, table.createdAt),
  index("plans_user_id_updated_at_idx").on(table.userId, table.updatedAt),
  check("oando_plans_revision_check", sql`${table.revision} >= 1`),
  check("oando_plans_schema_version_check", sql`${table.schemaVersion} >= 0`),
]);

export const plannerOperationIdempotency = pgTable("planner_operation_idempotency", {
  ownerId: uuid("owner_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  operation: text("operation").$type<"create" | "save" | "delete">().notNull(),
  projectId: uuid("project_id").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  requestFingerprint: text("request_fingerprint").notNull(),
  responseStatus: text("response_status").$type<"processing" | "success" | "not_found" | "conflict">().notNull(),
  responseRevision: bigint("response_revision", { mode: "number" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("planner_operation_idempotency_identity_key").on(
    table.ownerId,
    table.operation,
    table.projectId,
    table.idempotencyKey,
  ),
  index("planner_operation_idempotency_created_at_idx").on(table.createdAt),
  check("planner_operation_idempotency_operation_check", sql`${table.operation} in ('create', 'save', 'delete')`),
  check("planner_operation_idempotency_key_check", sql`char_length(${table.idempotencyKey}) between 1 and 120 and ${table.idempotencyKey} ~ '^[A-Za-z0-9._~-]+$'`),
  check("planner_operation_idempotency_fingerprint_check", sql`char_length(${table.requestFingerprint}) between 1 and 256`),
  check("planner_operation_idempotency_status_check", sql`${table.responseStatus} in ('processing', 'success', 'not_found', 'conflict')`),
  check("planner_operation_idempotency_revision_check", sql`${table.responseRevision} is null or ${table.responseRevision} >= 1`),
]);

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("teams_created_at_idx").on(table.createdAt),
]);

export const teamMembers = pgTable("team_members", {
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.teamId, table.userId] }),
  index("team_members_team_id_idx").on(table.teamId),
  index("team_members_user_id_idx").on(table.userId),
]);

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  invitedBy: uuid("invited_by").notNull().references(() => profiles.id),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("invites_team_id_idx").on(table.teamId),
  index("invites_invited_by_idx").on(table.invitedBy),
  index("invites_email_idx").on(table.email),
  index("invites_created_at_idx").on(table.createdAt),
]);

/** Admin P05 — versioned price books (Buyer P04 consumes emitted JSON contract). */
export const priceBooks = pgTable("price_books", {
  id: uuid("id").primaryKey().defaultRandom(),
  familySlug: text("family_slug").notNull(),
  bookId: text("book_id").notNull(),
  activeVersionId: text("active_version_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("price_books_book_id_uidx").on(table.bookId),
  index("price_books_family_slug_idx").on(table.familySlug),
]);

export const priceBookVersions = pgTable("price_book_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookRowId: uuid("book_row_id").notNull().references(() => priceBooks.id, { onDelete: "cascade" }),
  versionId: text("version_id").notNull(),
  effectiveFrom: date("effective_from").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull().default("draft"),
  rules: jsonb("rules").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("price_book_versions_book_version_uidx").on(table.bookRowId, table.versionId),
  index("price_book_versions_status_idx").on(table.status),
]);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").notNull(),
  actorId: uuid("actor_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: uuid("target_id"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("audit_events_team_id_idx").on(table.teamId),
  index("audit_events_actor_id_idx").on(table.actorId),
  index("audit_events_action_idx").on(table.action),
  index("audit_events_created_at_idx").on(table.createdAt),
  index("audit_events_team_id_created_at_idx").on(table.teamId, table.createdAt),
]);

/** Phase 05 — shared Studio/Planner furniture library (migrated from Products DB). */
export const furnitureCatalog = pgTable("furniture_catalog", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("uncategorized"),
  subcategory: text("subcategory"),
  tags: text("tags").array().notNull().default([]),
  dimensions: jsonb("dimensions").notNull().default({}),
  notes: text("notes"),
  isCustom: boolean("is_custom").notNull().default(true),
  thumbnailUrl: text("thumbnail_url"),
  topPngUrl: text("top_png_url"),
  topSvgUrl: text("top_svg_url"),
  frontPngUrl: text("front_png_url"),
  sidePngUrl: text("side_png_url"),
  topPngChecksum: text("top_png_checksum"),
  topFabricJson: jsonb("top_fabric_json"),
  frontFabricJson: jsonb("front_fabric_json"),
  sideFabricJson: jsonb("side_fabric_json"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("furniture_catalog_category_idx").on(table.category),
  index("furniture_catalog_is_custom_idx").on(table.isCustom),
  index("furniture_catalog_name_idx").on(table.name),
]);

/** Phase 05 — published descriptor release record (migrated from Products DB). */
export const blockDescriptors = pgTable("block_descriptors", {
  slug: text("slug").primaryKey(),
  currentVersion: integer("current_version").notNull(),
  currentChecksum: text("current_checksum"),
  descriptor: jsonb("descriptor").notNull(),
  lifecycle: text("lifecycle").notNull().default("live"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by"),
}, (table) => [
  index("block_descriptors_lifecycle_idx").on(table.lifecycle),
]);
