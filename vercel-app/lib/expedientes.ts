import "server-only";
import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "./supabase-admin";

export const hashAccessToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function findExpediente(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("expedientes")
    .select("id, folio, servicio, estado, porcentaje_documentos, nombre, correo, telefono, finalidad, tipo_inmueble, direccion, comuna, superficie_m2, created_at, updated_at")
    .eq("access_token_hash", hashAccessToken(token))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function publicApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Error inesperado";
  if (message === "BACKEND_NOT_CONFIGURED") {
    return Response.json({ error: "La infraestructura segura aún no está configurada" }, { status: 503 });
  }
  console.error(error);
  return Response.json({ error: "No pudimos completar la operación. Intenta nuevamente." }, { status: 500 });
}
