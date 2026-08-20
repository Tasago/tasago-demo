import { apiUser, db, jsonError } from "../../_lib";

export async function POST(request:Request) {
  const user=await apiUser(); if(!user) return jsonError("Debes iniciar sesión",401);
  const body=await request.json().catch(()=>null) as { valuationId?:string }|null;
  if(!body?.valuationId) return jsonError("Falta la tasación");
  const valuation=await db().prepare(`SELECT id,folio,client_name,client_email,fee FROM valuations WHERE id=?`).bind(body.valuationId).first<Record<string,unknown>>();
  if(!valuation) return jsonError("Tasación no encontrada",404);
  const amount=Number(valuation.fee||0); if(amount<=0) return jsonError("Define los honorarios antes de cobrar");
  const accessToken=process.env.MERCADOPAGO_ACCESS_TOKEN;
  if(!accessToken) return jsonError("Mercado Pago está preparado, pero falta activar la credencial privada.",503);
  const origin=new URL(request.url).origin;
  const response=await fetch("https://api.mercadopago.com/checkout/preferences",{
    method:"POST", headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json","X-Idempotency-Key":crypto.randomUUID()},
    body:JSON.stringify({
      items:[{ id:String(valuation.id), title:`Tasación inmobiliaria ${valuation.folio}`, quantity:1, currency_id:"CLP", unit_price:amount }],
      payer:{ email:String(valuation.client_email||user.email) }, external_reference:String(valuation.id),
      back_urls:{ success:`${origin}/?payment=success`, pending:`${origin}/?payment=pending`, failure:`${origin}/?payment=failure` },
      auto_return:"approved", notification_url:`${origin}/api/payments/webhook`,
    }),
  });
  const preference=await response.json() as {id?:string;init_point?:string;message?:string};
  if(!response.ok||!preference.id||!preference.init_point) return jsonError(preference.message||"No fue posible iniciar el pago",502);
  await db().batch([
    db().prepare(`INSERT INTO payments (id,valuation_id,preference_id,amount,status) VALUES (?,?,?,?,?)`).bind(crypto.randomUUID(),valuation.id,preference.id,amount,"Pendiente"),
    db().prepare(`UPDATE valuations SET payment_status='Pendiente',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(valuation.id),
  ]);
  return Response.json({ checkoutUrl:preference.init_point });
}
