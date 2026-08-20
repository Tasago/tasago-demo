import { findExpediente, publicApiError } from "../../../../lib/expedientes";
import { validateValuationInput } from "../../../../lib/domain";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const expediente = await findExpediente(token);
    if (!expediente) return Response.json({ error: "Expediente no encontrado" }, { status: 404 });
    const supabase = getSupabaseAdmin();
    const { data: documentos, error } = await supabase.from("documentos").select("tipo, nombre_original, tamano_bytes, estado").eq("expediente_id", expediente.id);
    if (error) throw error;
    return Response.json({ expediente, documentos });
  } catch (error) {
    return publicApiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const expediente = await findExpediente(token);
    if (!expediente) return Response.json({ error: "Expediente no encontrado" }, { status: 404 });
    const input = validateValuationInput(await request.json());
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("expedientes").update({
      servicio: input.service,
      finalidad: input.purpose,
      tipo_inmueble: input.propertyType,
      direccion: input.address,
      comuna: input.commune,
      superficie_m2: Number(input.area),
      nombre: input.name,
      correo: input.email,
      telefono: input.phone,
      updated_at: new Date().toISOString(),
    }).eq("id", expediente.id);
    if (error) throw error;
    await supabase.from("eventos_expediente").insert({ expediente_id: expediente.id, tipo: "datos_actualizados", detalle: { canal: "web" } });
    return Response.json({ ok: true, folio: expediente.folio });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes("inválid"))) {
      return Response.json({ error: error instanceof Error ? error.message : "Solicitud inválida" }, { status: 400 });
    }
    return publicApiError(error);
  }
}
