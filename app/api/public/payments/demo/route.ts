import { db, ensureSchema, jsonError } from "../../../_lib";

const communeUnitPrice:Record<string,number>={"Las Condes":4200000,"Vitacura":4700000,"Providencia":3900000,"Ñuñoa":3200000,"La Reina":3100000,"Santiago":2600000,"San Miguel":2450000,"La Florida":2100000,"Peñalolén":2300000,"Maipú":1750000,"Colina":2650000};

export async function POST(request:Request){
  await ensureSchema();const body=await request.json().catch(()=>null) as {token?:string}|null;
  if(!body?.token)return jsonError("Falta el código seguro");
  const valuation=await db().prepare(`SELECT id,folio,plan,commune,address,useful_surface AS usefulSurface,parking,client_email AS clientEmail FROM valuations WHERE customer_token=?`).bind(body.token).first<Record<string,unknown>>();
  if(!valuation)return jsonError("Tasación no encontrada",404);if(valuation.plan!=="Express")return jsonError("La validación automática sólo está disponible para Express",409);
  const documentCount=await db().prepare(`SELECT COUNT(*) AS total FROM documents WHERE valuation_id=?`).bind(valuation.id).first<{total:number}>();
  if(!Number(documentCount?.total||0))return jsonError("Sube al menos un antecedente antes de validar el flujo",409);
  const surface=Math.max(1,Number(valuation.usefulSurface||0)),baseUnit=communeUnitPrice[String(valuation.commune)]||2400000;
  const estimated=Math.round((surface*baseUnit+Number(valuation.parking||0)*14000000)/1000000)*1000000;
  const comparableIds=[crypto.randomUUID(),crypto.randomUUID(),crypto.randomUUID()];
  const comparableFactors=[.94,1,1.06],surfaceOffsets=[-4,2,6];
  const jobs=["validate_documents","extract_ocr","build_technical_sheet","select_comparables","run_valuation_model","generate_pdf"];
  const database=db();
  const statements=[
    database.prepare(`DELETE FROM comparables WHERE valuation_id=? AND source='Validación Express'`).bind(valuation.id),
    database.prepare(`DELETE FROM automation_jobs WHERE valuation_id=?`).bind(valuation.id),
    database.prepare(`UPDATE documents SET processing_status='Extraído' WHERE valuation_id=?`).bind(valuation.id),
    ...comparableFactors.map((factor,index)=>{const comparableSurface=Math.max(20,surface+surfaceOffsets[index]);const price=Math.round(comparableSurface*baseUnit*factor/1000000)*1000000;return database.prepare(`INSERT INTO comparables (id,valuation_id,source,address,price,surface,unit_price,link,selected) VALUES (?,?,?,?,?,?,?,?,1)`).bind(comparableIds[index],valuation.id,"Validación Express",`Comparable ${index+1} · sector ${valuation.commune}`,price,comparableSurface,Math.round(price/comparableSurface),"")}),
    ...jobs.map(job=>database.prepare(`INSERT INTO automation_jobs (id,valuation_id,job_type,status,attempts,payload_json,result_json) VALUES (?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),valuation.id,job,"Completado",1,JSON.stringify({validationMode:true}),JSON.stringify({completedAt:new Date().toISOString()}))),
    database.prepare(`UPDATE valuations SET payment_status='Validación',workflow_step=7,status='Entregado',automation_status='Completado',estimated_value=?,technical_sheet_json=?,model_result_json=?,report_storage_key=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(
      estimated,JSON.stringify({surface,commune:valuation.commune,documents:Number(documentCount?.total||0),validationMode:true}),
      JSON.stringify({estimated,rangeLow:Math.round(estimated*.93/1000000)*1000000,rangeHigh:Math.round(estimated*1.07/1000000)*1000000,unitPrice:baseUnit,validationMode:true}),
      `generated/validation/${valuation.id}/express.pdf`,valuation.id,
    ),
  ];
  await database.batch(statements);
  return Response.json({ok:true,folio:valuation.folio,estimatedValue:estimated,reportUrl:`/api/public/track/${body.token}/report`,delivery:`Disponible en la app para ${valuation.clientEmail}`});
}
