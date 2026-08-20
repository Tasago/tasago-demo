import { apiUser, cleanNumber, cleanText, db, jsonError } from "../../_lib";

export const dynamic = "force-dynamic";
const allowedStatus=["Solicitud","Antecedentes","En tasación","Entregado"];

export async function GET(_request:Request,{ params }:{ params:Promise<{id:string}> }) {
  const user=await apiUser(); if(!user) return jsonError("Debes iniciar sesión",401);
  const {id}=await params;
  const valuation=await db().prepare(`SELECT * FROM valuations WHERE id=?`).bind(id).first();
  if(!valuation) return jsonError("Tasación no encontrada",404);
  const comparables=await db().prepare(`SELECT * FROM comparables WHERE valuation_id=? ORDER BY created_at DESC`).bind(id).all();
  return Response.json({ valuation,comparables:comparables.results });
}

export async function PATCH(request:Request,{ params }:{ params:Promise<{id:string}> }) {
  const user=await apiUser(); if(!user) return jsonError("Debes iniciar sesión",401);
  const {id}=await params; const body=await request.json().catch(()=>null) as Record<string,unknown>|null;
  if(!body) return jsonError("Solicitud inválida");
  const current=await db().prepare(`SELECT id FROM valuations WHERE id=?`).bind(id).first();
  if(!current) return jsonError("Tasación no encontrada",404);
  const status=cleanText(body.status,40); if(status && !allowedStatus.includes(status)) return jsonError("Estado inválido");
  await db().prepare(`UPDATE valuations SET status=COALESCE(NULLIF(?,''),status), fee=?, payment_status=COALESCE(NULLIF(?,''),payment_status),
    estimated_value=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(
      status,cleanNumber(body.fee),cleanText(body.paymentStatus,40),cleanNumber(body.estimatedValue),cleanText(body.notes,2000),id,
    ).run();
  return Response.json({ ok:true });
}
