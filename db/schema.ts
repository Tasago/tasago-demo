import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const valuations = sqliteTable("valuations", {
  id: text("id").primaryKey(),
  folio: text("folio").notNull(),
  customerToken: text("customer_token").notNull(),
  plan: text("plan").notNull().default("Pro"),
  ownerId: text("owner_id").notNull(),
  ownerEmail: text("owner_email").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull().default(""),
  clientPhone: text("client_phone").notNull().default(""),
  propertyType: text("property_type").notNull(),
  address: text("address").notNull(),
  commune: text("commune").notNull(),
  usefulSurface: real("useful_surface").notNull(),
  totalSurface: real("total_surface").notNull().default(0),
  bedrooms: integer("bedrooms").notNull().default(0),
  bathrooms: integer("bathrooms").notNull().default(0),
  parking: integer("parking").notNull().default(0),
  purpose: text("purpose").notNull().default("Comercial"),
  status: text("status").notNull().default("Solicitud"),
  fee: integer("fee").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("Pendiente"),
  estimatedValue: integer("estimated_value").notNull().default(0),
  notes: text("notes").notNull().default(""),
  workflowStep: integer("workflow_step").notNull().default(1),
  completionPercent: integer("completion_percent").notNull().default(0),
  automationStatus: text("automation_status").notNull().default("Pendiente"),
  extractionJson: text("extraction_json").notNull().default("{}"),
  technicalSheetJson: text("technical_sheet_json").notNull().default("{}"),
  modelResultJson: text("model_result_json").notNull().default("{}"),
  reportStorageKey: text("report_storage_key").notNull().default(""),
  reviewReason: text("review_reason").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_valuations_folio").on(table.folio),
  index("idx_valuations_owner_created").on(table.ownerId, table.createdAt),
  index("idx_valuations_owner_status").on(table.ownerId, table.status),
]);

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  valuationId: text("valuation_id").notNull().references(() => valuations.id, { onDelete:"cascade" }),
  storageKey: text("storage_key").notNull(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  kind: text("kind").notNull().default("otro"),
  processingStatus: text("processing_status").notNull().default("Recibido"),
  extractedData: text("extracted_data").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_documents_valuation").on(table.valuationId)]);

export const comparables = sqliteTable("comparables", {
  id: text("id").primaryKey(),
  valuationId: text("valuation_id").notNull().references(() => valuations.id, { onDelete:"cascade" }),
  source: text("source").notNull().default("Manual"),
  address: text("address").notNull(),
  price: integer("price").notNull(),
  surface: real("surface").notNull(),
  unitPrice: real("unit_price").notNull(),
  link: text("link").notNull().default(""),
  selected: integer("selected", { mode:"boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_comparables_valuation").on(table.valuationId)]);

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  valuationId: text("valuation_id").notNull().references(() => valuations.id, { onDelete:"cascade" }),
  preferenceId: text("preference_id").notNull().default(""),
  providerPaymentId: text("provider_payment_id").notNull().default(""),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("Pendiente"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_payments_valuation").on(table.valuationId)]);

export const automationJobs = sqliteTable("automation_jobs", {
  id: text("id").primaryKey(),
  valuationId: text("valuation_id").notNull().references(() => valuations.id, { onDelete:"cascade" }),
  jobType: text("job_type").notNull(),
  status: text("status").notNull().default("Pendiente"),
  attempts: integer("attempts").notNull().default(0),
  payloadJson: text("payload_json").notNull().default("{}"),
  resultJson: text("result_json").notNull().default("{}"),
  lastError: text("last_error").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_automation_jobs_valuation_status").on(table.valuationId,table.status)]);
