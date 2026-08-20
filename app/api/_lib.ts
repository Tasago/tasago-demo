import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../chatgpt-auth";

export async function apiUser() {
  const user = await getChatGPTUser();
  if (!user || user.email.toLowerCase() !== "javiercastroarq@gmail.com") return null;
  await ensureSchema();
  return user;
}

export function db() {
  if (!env.DB) throw new Error("Base de datos no disponible");
  return env.DB;
}

export function bucket() {
  if (!env.BUCKET) throw new Error("Almacenamiento no disponible");
  return env.BUCKET;
}

let schemaReady:Promise<void>|null=null;
export async function ensureSchema(){
  if(schemaReady)return schemaReady;
  schemaReady=(async()=>{
    const database=db();
    await database.batch([
      database.prepare(`CREATE TABLE IF NOT EXISTS valuations (id TEXT PRIMARY KEY NOT NULL, folio TEXT NOT NULL UNIQUE, customer_token TEXT NOT NULL UNIQUE, plan TEXT NOT NULL DEFAULT 'Pro', owner_id TEXT NOT NULL, owner_email TEXT NOT NULL, client_name TEXT NOT NULL, client_email TEXT NOT NULL DEFAULT '', client_phone TEXT NOT NULL DEFAULT '', property_type TEXT NOT NULL, address TEXT NOT NULL, commune TEXT NOT NULL, useful_surface REAL NOT NULL, total_surface REAL NOT NULL DEFAULT 0, bedrooms INTEGER NOT NULL DEFAULT 0, bathrooms INTEGER NOT NULL DEFAULT 0, parking INTEGER NOT NULL DEFAULT 0, purpose TEXT NOT NULL DEFAULT 'Comercial', status TEXT NOT NULL DEFAULT 'Solicitud', fee INTEGER NOT NULL DEFAULT 0, payment_status TEXT NOT NULL DEFAULT 'Pendiente', estimated_value INTEGER NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      database.prepare(`CREATE TABLE IF NOT EXISTS comparables (id TEXT PRIMARY KEY NOT NULL, valuation_id TEXT NOT NULL REFERENCES valuations(id) ON DELETE CASCADE, source TEXT NOT NULL DEFAULT 'Manual', address TEXT NOT NULL, price INTEGER NOT NULL, surface REAL NOT NULL, unit_price REAL NOT NULL, link TEXT NOT NULL DEFAULT '', selected INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      database.prepare(`CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY NOT NULL, valuation_id TEXT NOT NULL REFERENCES valuations(id) ON DELETE CASCADE, preference_id TEXT NOT NULL DEFAULT '', provider_payment_id TEXT NOT NULL DEFAULT '', amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'Pendiente', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      database.prepare(`CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY NOT NULL, valuation_id TEXT NOT NULL REFERENCES valuations(id) ON DELETE CASCADE, storage_key TEXT NOT NULL, filename TEXT NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      database.prepare(`CREATE TABLE IF NOT EXISTS automation_jobs (id TEXT PRIMARY KEY NOT NULL, valuation_id TEXT NOT NULL REFERENCES valuations(id) ON DELETE CASCADE, job_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Pendiente', attempts INTEGER NOT NULL DEFAULT 0, payload_json TEXT NOT NULL DEFAULT '{}', result_json TEXT NOT NULL DEFAULT '{}', last_error TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      database.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_valuations_customer_token ON valuations(customer_token)`),
      database.prepare(`CREATE INDEX IF NOT EXISTS idx_valuations_owner_created ON valuations(owner_id,created_at)`),
      database.prepare(`CREATE INDEX IF NOT EXISTS idx_valuations_owner_status ON valuations(owner_id,status)`),
      database.prepare(`CREATE INDEX IF NOT EXISTS idx_comparables_valuation ON comparables(valuation_id)`),
      database.prepare(`CREATE INDEX IF NOT EXISTS idx_payments_valuation ON payments(valuation_id)`),
      database.prepare(`CREATE INDEX IF NOT EXISTS idx_documents_valuation ON documents(valuation_id)`),
      database.prepare(`CREATE INDEX IF NOT EXISTS idx_automation_jobs_valuation_status ON automation_jobs(valuation_id,status)`),
    ]);
    const valuationColumns=new Set(((await database.prepare(`PRAGMA table_info(valuations)`).all()).results as {name:string}[]).map(column=>column.name));
    const valuationAdditions:[string,string][]=[
      ["workflow_step","INTEGER NOT NULL DEFAULT 1"],["completion_percent","INTEGER NOT NULL DEFAULT 0"],
      ["automation_status","TEXT NOT NULL DEFAULT 'Pendiente'"],["extraction_json","TEXT NOT NULL DEFAULT '{}'"],
      ["technical_sheet_json","TEXT NOT NULL DEFAULT '{}'"],["model_result_json","TEXT NOT NULL DEFAULT '{}'"],
      ["report_storage_key","TEXT NOT NULL DEFAULT ''"],["review_reason","TEXT NOT NULL DEFAULT ''"],
    ];
    for(const [name,definition] of valuationAdditions) if(!valuationColumns.has(name)) await database.prepare(`ALTER TABLE valuations ADD COLUMN ${name} ${definition}`).run();
    const documentColumns=new Set(((await database.prepare(`PRAGMA table_info(documents)`).all()).results as {name:string}[]).map(column=>column.name));
    const documentAdditions:[string,string][]=[
      ["kind","TEXT NOT NULL DEFAULT 'otro'"],["processing_status","TEXT NOT NULL DEFAULT 'Recibido'"],["extracted_data","TEXT NOT NULL DEFAULT '{}'"],
    ];
    for(const [name,definition] of documentAdditions) if(!documentColumns.has(name)) await database.prepare(`ALTER TABLE documents ADD COLUMN ${name} ${definition}`).run();
    await database.prepare(`PRAGMA optimize`).run();
  })().catch(error=>{schemaReady=null;throw error});
  return schemaReady;
}

export function jsonError(message:string, status=400) {
  return Response.json({ error:message }, { status });
}

export function cleanText(value:unknown, max=300) {
  return String(value ?? "").trim().slice(0,max);
}

export function cleanNumber(value:unknown, min=0, max=2_000_000_000) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max,Math.max(min,parsed)) : 0;
}
