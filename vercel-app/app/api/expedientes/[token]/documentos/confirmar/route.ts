import { findExpediente, publicApiError } from "../../../../../../lib/expedientes";
import { documentsBucket, getSupabaseAdmin } from "../../../../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const expediente = await findExpediente(token);
    if (!expediente) return Response.json({ error: "Expediente no encontrado" }, { status: 404 });
    const { kind, path, previousPath } = await request.json() as { kind?: string; path?: string; previousPath?: string | null };
    if (!kind || !path || !path.startsWith(`${expediente.id}/`)) return Response.json({ error: "Carga inválida" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("documentos").update({ estado: "recibido", updated_at: new Date().toISOString() }).eq("expediente_id", expediente.id).eq("tipo", kind).eq("ruta_storage", path);
    if (error) throw error;
    if (previousPath && previousPath !== path && previousPath.startsWith(`${expediente.id}/`)) {
      await supabase.storage.from(documentsBucket()).remove([previousPath]);
    }
    const { count, error: countError } = await supabase.from("documentos").select("id", { count: "exact", head: true }).eq("expediente_id", expediente.id).eq("estado", "recibido");
    if (countError) throw countError;
    const percentage = Math.min(100, Math.round(((count || 0) / 3) * 100));
    await supabase.from("expedientes").update({ porcentaje_documentos: percentage, updated_at: new Date().toISOString() }).eq("id", expediente.id);
    await supabase.from("eventos_expediente").insert({ expediente_id: expediente.id, tipo: "documento_recibido", detalle: { tipo: kind } });
    return Response.json({ ok: true, completion: percentage });
  } catch (error) {
    return publicApiError(error);
  }
}
