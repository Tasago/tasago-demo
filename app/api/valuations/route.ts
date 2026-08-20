import { apiUser, cleanNumber, cleanText, db, jsonError } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await apiUser();
  if (!user) return jsonError("Debes iniciar sesión",401);
  const result = await db().prepare(`SELECT id, folio, client_name AS clientName, client_email AS clientEmail,
    client_phone AS clientPhone, property_type AS propertyType, address, commune,
    useful_surface AS usefulSurface, total_surface AS totalSurface, bedrooms, bathrooms, parking,
    purpose, plan, status, fee, payment_status AS paymentStatus, estimated_value AS estimatedValue,
    workflow_step AS workflowStep, completion_percent AS completionPercent, automation_status AS automationStatus,
    notes, created_at AS createdAt, updated_at AS updatedAt
    FROM valuations ORDER BY created_at DESC LIMIT 100`).all();
  return Response.json({ valuations:result.results });
}

export async function POST(request:Request) {
  const user = await apiUser();
  if (!user) return jsonError("Debes iniciar sesión",401);
  const body = await request.json().catch(() => null) as Record<string,unknown> | null;
  if (!body) return jsonError("Solicitud inválida");
  const clientName=cleanText(body.clientName,120), propertyType=cleanText(body.propertyType,60);
  const address=cleanText(body.address,180), commune=cleanText(body.commune,80), usefulSurface=cleanNumber(body.usefulSurface,1,1_000_000);
  if (!clientName || !propertyType || !address || !commune || !usefulSurface) return jsonError("Completa los campos obligatorios");
  const id=crypto.randomUUID();
  const now=new Date();
  const folio=`TG-${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}${String(now.getUTCDate()).padStart(2,"0")}-${now.getTime().toString().slice(-5)}`;
  const customerToken=crypto.randomUUID().replaceAll("-","");
  await db().prepare(`INSERT INTO valuations (id,folio,customer_token,plan,owner_id,owner_email,client_name,client_email,client_phone,
    property_type,address,commune,useful_surface,total_surface,bedrooms,bathrooms,parking,purpose,status,fee,
    payment_status,estimated_value,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      id,folio,customerToken,"Interno",user.userId,user.email,clientName,cleanText(body.clientEmail,120),cleanText(body.clientPhone,40),
      propertyType,address,commune,usefulSurface,cleanNumber(body.totalSurface),cleanNumber(body.bedrooms,0,30),
      cleanNumber(body.bathrooms,0,30),cleanNumber(body.parking,0,30),cleanText(body.purpose,60)||"Comercial",
      "Solicitud",cleanNumber(body.fee),"Pendiente",0,cleanText(body.notes,2000),
    ).run();
  return Response.json({ id,folio },{ status:201 });
}
