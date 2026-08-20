import { cleanNumber, cleanText, db, ensureSchema, jsonError } from "../../_lib";

export const dynamic = "force-dynamic";

export async function POST(request:Request) {
  await ensureSchema();
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  if(!body) return jsonError("Solicitud inválida");
  const clientName=cleanText(body.clientName,120),clientEmail=cleanText(body.clientEmail,120);
  const clientPhone=cleanText(body.clientPhone,40),propertyType=cleanText(body.propertyType,60);
  const address=cleanText(body.address,180),commune=cleanText(body.commune,80);
  const usefulSurface=cleanNumber(body.usefulSurface,1,1_000_000),plan=cleanText(body.plan,20)||"Express";
  if(!clientName||!clientEmail||!clientPhone||!propertyType||!address||!commune||!usefulSurface) return jsonError("Completa tus datos y los antecedentes básicos del inmueble");
  const id=crypto.randomUUID(),customerToken=crypto.randomUUID().replaceAll("-","");
  const now=new Date();
  const folio=`TG-${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}${String(now.getUTCDate()).padStart(2,"0")}-${now.getTime().toString().slice(-5)}`;
  const fee=plan==="Express"?39990:0;
  await db().prepare(`INSERT INTO valuations (id,folio,customer_token,plan,owner_id,owner_email,client_name,client_email,client_phone,
    property_type,address,commune,useful_surface,total_surface,bedrooms,bathrooms,parking,purpose,status,fee,payment_status,notes,workflow_step,completion_percent,automation_status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      id,folio,customerToken,plan,"public","tasago@public",clientName,clientEmail,clientPhone,
      propertyType,address,commune,usefulSurface,cleanNumber(body.totalSurface),cleanNumber(body.bedrooms,0,30),
      cleanNumber(body.bathrooms,0,30),cleanNumber(body.parking,0,30),cleanText(body.purpose,80)||"Venta",
      "Solicitud",fee,"Pendiente",cleanText(body.notes,1000),4,40,"Esperando antecedentes",
    ).run();
  return Response.json({folio,token:customerToken,trackingUrl:`/seguimiento/${customerToken}`,paymentReady:fee>0},{status:201});
}
