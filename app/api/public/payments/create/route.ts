import { db, ensureSchema, jsonError } from "../../../_lib";

export async function POST(request:Request) {
  await ensureSchema();const body=await request.json().catch(()=>null) as {token?:string}|null;
  if(!body?.token) return jsonError("Falta el código seguro");
  const valuation=await db().prepare(`SELECT id,folio,client_name,client_email,fee,customer_token FROM valuations WHERE customer_token=?`).bind(body.token).first<Record<string,unknown>>();
  if(!valuation) return jsonError("Tasación no encontrada",404);
  const amount=Number(valuation.fee||0);
  if(amount<=0) return jsonError("Confirmaremos el valor en CLP antes de habilitar el pago",409);
  const accessToken=process.env.MERCADOPAGO_ACCESS_TOKEN;
  if(!accessToken) return Response.json({error:"Mercado Pago aún no está activado",demoAvailable:true},{status:503});
  const origin=new URL(request.url).origin;
  const response=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json","X-Idempotency-Key":crypto.randomUUID()},body:JSON.stringify({
    items:[{id:String(valuation.id),title:`Tasación inmobiliaria ${valuation.folio}`,quantity:1,currency_id:"CLP",unit_price:amount}],
    payer:{email:String(valuation.client_email)},external_reference:String(valuation.id),
    back_urls:{success:`${origin}/seguimiento/${valuation.customer_token}?payment=success`,pending:`${origin}/seguimiento/${valuation.customer_token}?payment=pending`,failure:`${origin}/seguimiento/${valuation.customer_token}?payment=failure`},
    auto_return:"approved",notification_url:`${origin}/api/payments/webhook`,
  })});
  const preference=await response.json() as {id?:string;init_point?:string;message?:string};
  if(!response.ok||!preference.id||!preference.init_point) return jsonError(preference.message||"No fue posible iniciar el pago",502);
  await db().prepare(`INSERT INTO payments (id,valuation_id,preference_id,amount,status) VALUES (?,?,?,?,?)`).bind(crypto.randomUUID(),valuation.id,preference.id,amount,"Pendiente").run();
  return Response.json({checkoutUrl:preference.init_point});
}
