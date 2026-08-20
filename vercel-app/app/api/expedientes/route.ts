import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { validateValuationInput } from "../../../lib/domain";
import { hashAccessToken, publicApiError } from "../../../lib/expedientes";
import { getSupabaseAdmin } from "../../../lib/supabase-admin";

export const runtime = "nodejs";

function createFolio() {
  const now = new Date();
  const date = `${String(now.getUTCFullYear()).slice(-2)}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `TG-${date}-${randomInt(100000, 999999)}`;
}

export async function POST(request: Request) {
  try {
    const input = validateValuationInput(await request.json());
    const accessToken = randomBytes(32).toString("hex");
    const expediente = {
      id: randomUUID(),
      folio: createFolio(),
      access_token_hash: hashAccessToken(accessToken),
      servicio: input.service,
      estado: "borrador",
      finalidad: input.purpose,
      tipo_inmueble: input.propertyType,
      direccion: input.address,
      comuna: input.commune,
      superficie_m2: Number(input.area),
      nombre: input.name,
      correo: input.email,
      telefono: input.phone,
    };
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("expedientes").insert(expediente).select("folio, estado").single();
    if (error) throw error;
    await supabase.from("eventos_expediente").insert({ expediente_id: expediente.id, tipo: "expediente_creado", detalle: { canal: "web" } });
    return Response.json({ ...data, accessToken }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message.includes("inválid"))) {
      return Response.json({ error: error instanceof Error ? error.message : "Solicitud inválida" }, { status: 400 });
    }
    return publicApiError(error);
  }
}
