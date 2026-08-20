import { apiUser, cleanNumber, cleanText, db, jsonError } from "../../../_lib";

export async function POST(request:Request,{ params }:{ params:Promise<{id:string}> }) {
  const user=await apiUser(); if(!user) return jsonError("Debes iniciar sesión",401);
  const {id}=await params;
  const owner=await db().prepare(`SELECT id FROM valuations WHERE id=?`).bind(id).first();
  if(!owner) return jsonError("Tasación no encontrada",404);
  const body=await request.json().catch(()=>null) as Record<string,unknown>|null; if(!body) return jsonError("Solicitud inválida");
  const address=cleanText(body.address,180),price=cleanNumber(body.price,1),surface=cleanNumber(body.surface,1);
  if(!address||!price||!surface) return jsonError("Completa dirección, precio y superficie");
  const comparableId=crypto.randomUUID();
  await db().prepare(`INSERT INTO comparables (id,valuation_id,source,address,price,surface,unit_price,link,selected)
    VALUES (?,?,?,?,?,?,?,?,1)`).bind(comparableId,id,cleanText(body.source,80)||"Manual",address,price,surface,price/surface,cleanText(body.link,500)).run();
  return Response.json({ id:comparableId },{status:201});
}
