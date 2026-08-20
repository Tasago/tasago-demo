import { db, ensureSchema, jsonError } from "../../_lib";

function timingSafeHex(a:string,b:string) {
  if(a.length!==b.length) return false; let result=0;
  for(let i=0;i<a.length;i++) result|=a.charCodeAt(i)^b.charCodeAt(i);
  return result===0;
}

export async function POST(request:Request) {
  await ensureSchema();
  const accessToken=process.env.MERCADOPAGO_ACCESS_TOKEN, secret=process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if(!accessToken||!secret) return jsonError("Integración no configurada",503);
  const url=new URL(request.url); const dataId=url.searchParams.get("data.id")||url.searchParams.get("data_id")||"";
  const xRequestId=request.headers.get("x-request-id")||"", signature=request.headers.get("x-signature")||"";
  const parts=Object.fromEntries(signature.split(",").map(part=>part.split("=").map(value=>value.trim())));
  const ts=parts.ts||"",v1=parts.v1||""; if(!dataId||!ts||!v1) return jsonError("Firma incompleta",401);
  const manifest=`id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const digest=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(manifest));
  const expected=Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
  if(!timingSafeHex(expected,v1)) return jsonError("Firma inválida",401);
  const mpResponse=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`,{headers:{Authorization:`Bearer ${accessToken}`}});
  if(!mpResponse.ok) return jsonError("Pago no encontrado",404);
  const payment=await mpResponse.json() as {id:string|number;external_reference?:string;status?:string;transaction_amount?:number};
  const valuationId=String(payment.external_reference||""); if(!valuationId) return new Response(null,{status:204});
  const mapped=payment.status==="approved"?"Pagado":payment.status==="rejected"?"Rechazado":payment.status==="cancelled"?"Cancelado":"Pendiente";
  await db().batch([
    db().prepare(`UPDATE payments SET provider_payment_id=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE valuation_id=?`).bind(String(payment.id),mapped,valuationId),
    db().prepare(`UPDATE valuations SET payment_status=?,workflow_step=CASE WHEN ?='Pagado' THEN 7 ELSE workflow_step END,status=CASE WHEN ?='Pagado' THEN 'En tasación' ELSE status END,automation_status=CASE WHEN ?='Pagado' THEN 'En cola' ELSE automation_status END,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(mapped,mapped,mapped,mapped,valuationId),
  ]);
  return Response.json({received:true});
}
