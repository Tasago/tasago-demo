import { randomUUID } from "node:crypto";
import { validateDocument } from "../../../../../lib/domain";
import { findExpediente, publicApiError } from "../../../../../lib/expedientes";
import { documentsBucket, getSupabaseAdmin } from "../../../../../lib/supabase-admin";

export const runtime = "nodejs";

const safeExtension = (name: string) => {
  const value = name.split(".").pop()?.toLowerCase() || "bin";
  return /^[a-z0-9]{1,5}$/.test(value) ? value : "bin";
};

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const expediente = await findExpediente(token);
    if (!expediente) return Response.json({ error: "Expediente no encontrado" }, { status: 404 });
    const document = validateDocument(await request.json());
    const path = `${expediente.id}/${document.kind}/${randomUUID()}.${safeExtension(document.fileName)}`;
    const supabase = getSupabaseAdmin();
    const { data: previous } = await supabase.from("documentos").select("ruta_storage").eq("expediente_id", expediente.id).eq("tipo", document.kind).maybeSingle();
    const { data: signed, error: signedError } = await supabase.storage.from(documentsBucket()).createSignedUploadUrl(path);
    if (signedError) throw signedError;
    const { error } = await supabase.from("documentos").upsert({
      expediente_id: expediente.id,
      tipo: document.kind,
      nombre_original: document.fileName,
      ruta_storage: path,
      content_type: document.mimeType,
      tamano_bytes: document.size,
      estado: "pendiente_carga",
      updated_at: new Date().toISOString(),
    }, { onConflict: "expediente_id,tipo" });
    if (error) throw error;
    return Response.json({ path, previousPath: previous?.ruta_storage || null, uploadToken: signed.token, bucket: documentsBucket() });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && (error.message.includes("inválid") || error.message.includes("permitido") || error.message.includes("15 MB")))) {
      return Response.json({ error: error instanceof Error ? error.message : "Documento inválido" }, { status: 400 });
    }
    return publicApiError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const expediente = await findExpediente(token);
    if (!expediente) return Response.json({ error: "Expediente no encontrado" }, { status: 404 });
    const { kind } = await request.json() as { kind?: string };
    if (!kind) return Response.json({ error: "Tipo de antecedente requerido" }, { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("documentos").select("ruta_storage").eq("expediente_id", expediente.id).eq("tipo", kind).maybeSingle();
    if (data?.ruta_storage) await supabase.storage.from(documentsBucket()).remove([data.ruta_storage]);
    const { error } = await supabase.from("documentos").delete().eq("expediente_id", expediente.id).eq("tipo", kind);
    if (error) throw error;
    const { count } = await supabase.from("documentos").select("id", { count: "exact", head: true }).eq("expediente_id", expediente.id).eq("estado", "recibido");
    const completion = Math.min(100, Math.round(((count || 0) / 3) * 100));
    await supabase.from("expedientes").update({ porcentaje_documentos: completion, updated_at: new Date().toISOString() }).eq("id", expediente.id);
    return Response.json({ ok: true, completion });
  } catch (error) {
    return publicApiError(error);
  }
}
