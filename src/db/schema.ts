import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const ROLE_NAMES = ["student", "staff", "officer", "admin"] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export const STATUSES = [
  "pending",
  "assigned",
  "in_progress",
  "completed",
  "rejected",
  "cancelled",
] as const;
export type RequestStatus = (typeof STATUSES)[number];

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

const now = sql`(unixepoch())`;

export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { enum: ROLE_NAMES }).notNull().unique(),
  label: text("label").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  roleId: integer("role_id")
    .notNull()
    .references(() => roles.id),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const serviceRequests = sqliteTable(
  "service_requests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    location: text("location").notNull(),
    priority: text("priority", { enum: PRIORITIES }).notNull().default("medium"),
    status: text("status", { enum: STATUSES }).notNull().default("pending"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    requesterId: text("requester_id")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(now),
    completedAt: integer("completed_at", { mode: "timestamp" }),
  },
  (t) => [
    index("requests_status_idx").on(t.status),
    index("requests_requester_idx").on(t.requesterId),
  ]
);

export const assignments = sqliteTable(
  "assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    requestId: integer("request_id")
      .notNull()
      .references(() => serviceRequests.id, { onDelete: "cascade" }),
    officerId: text("officer_id")
      .notNull()
      .references(() => users.id),
    assignedById: text("assigned_by_id")
      .notNull()
      .references(() => users.id),
    note: text("note"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    assignedAt: integer("assigned_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [index("assignments_request_idx").on(t.requestId)]
);

export const statusLogs = sqliteTable("status_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requestId: integer("request_id")
    .notNull()
    .references(() => serviceRequests.id, { onDelete: "cascade" }),
  fromStatus: text("from_status", { enum: STATUSES }),
  toStatus: text("to_status", { enum: STATUSES }).notNull(),
  note: text("note"),
  changedById: text("changed_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  requestId: integer("request_id")
    .notNull()
    .references(() => serviceRequests.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(), // base64
  uploadedById: text("uploaded_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    requestId: integer("request_id").references(() => serviceRequests.id, {
      onDelete: "cascade",
    }),
    message: text("message").notNull(),
    readAt: integer("read_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => [index("notifications_user_idx").on(t.userId)]
);

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorId: text("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  meta: text("meta"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
});
