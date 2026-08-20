import { cleanNumber, cleanText, db, ensureSchema, jsonError } from "../../../_lib";

export const dynamic = "force-dynamic";

export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}) {
  await ensureSchema();const {token}=await params;
  const valuation=await db().prepare(`SELECT id,folio,plan,client_name AS clientName,client_email AS clientEmail,client_phone AS clientPhone,
    property_type AS propertyType,address,commune,useful_surface AS usefulSurface,total_surface AS totalSurface,bedrooms,bathrooms,parking,
    purpose,status,fee,payment_status AS paymentStatus,estimated_value AS estimatedValue,notes,workflow_step AS workflowStep,
    completion_percent AS completionPercent,automation_status AS automationStatus,review_reason AS reviewReason,
    created_at AS createdAt,updated_at AS updatedAt FROM valuations WHERE customer_token=?`).bind(token).first<Record<string,unknown>>();
  if(!valuation) return jsonError("Enlace de seguimiento inválido",404);
  const documents=await db().prepare(`SELECT id,filename,content_type AS contentType,size,kind,processing_status AS processingStatus,created_at AS createdAt FROM documents WHERE valuation_id=? ORDER BY created_at DESC`).bind(valuation.id).all();
  return Response.json({valuation,documents:documents.results});
}

export async function PATCH(request:Request,{params}:{params:Promise<{token:string}>}) {
  await ensureSchema();const {token}=await params;
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null;if(!body)return jsonError("Solicitud inválida");
  const current=await db().prepare(`SELECT id FROM valuations WHERE customer_token=?`).bind(token).first<{id:string}>();
  if(!current)return jsonError("Enlace de seguimiento inválido",404);
  const propertyType=cleanText(body.propertyType,60),address=cleanText(body.address,180),commune=cleanText(body.commune,80);
  const usefulSurface=cleanNumber(body.usefulSurface,1,1_000_000);if(!propertyType||!address||!commune||!usefulSurface)return jsonError("Completa los datos obligatorios");
  const workflowStep=cleanNumber(body.workflowStep,1,7),plan=cleanText(body.plan,20);
  await db().prepare(`UPDATE valuations SET client_name=?,client_email=?,client_phone=?,property_type=?,address=?,commune=?,useful_surface=?,
    total_surface=?,bedrooms=?,bathrooms=?,parking=?,purpose=?,notes=?,workflow_step=MAX(workflow_step,?),
    status=CASE WHEN ?=7 AND ?='Profesional' THEN 'En tasación' ELSE status END,
    automation_status=CASE WHEN ?=7 AND ?='Profesional' THEN 'Revisión profesional' ELSE automation_status END,
    updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(
      cleanText(body.clientName,120),cleanText(body.clientEmail,120),cleanText(body.clientPhone,40),propertyType,address,commune,usefulSurface,
      cleanNumber(body.totalSurface),cleanNumber(body.bedrooms,0,30),cleanNumber(body.bathrooms,0,30),cleanNumber(body.parking,0,30),
      cleanText(body.purpose,80)||"Venta",cleanText(body.notes,1000),workflowStep,workflowStep,plan,workflowStep,plan,current.id,
    ).run();
  return Response.json({ok:true});
}
