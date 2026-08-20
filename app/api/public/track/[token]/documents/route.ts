import { bucket, db, ensureSchema, jsonError } from "../../../../_lib";

const allowed=new Set(["application/pdf","image/jpeg","image/png","image/webp"]);
const maxBytes=10*1024*1024;

export async function POST(request:Request,{params}:{params:Promise<{token:string}>}) {
  await ensureSchema();const {token}=await params;
  const valuation=await db().prepare(`SELECT id FROM valuations WHERE customer_token=?`).bind(token).first<{id:string}>();
  if(!valuation) return jsonError("Enlace de seguimiento inválido",404);
  const form=await request.formData();const file=form.get("file");
  if(!(file instanceof File)) return jsonError("Selecciona un documento");
  if(!allowed.has(file.type)||file.size>maxBytes) return jsonError("Usa PDF, JPG, PNG o WEBP de hasta 10 MB");
  const kind=String(form.get("kind")||"otro").replace(/[^a-zA-Z0-9_-]/g,"").slice(0,40)||"otro";
  const id=crypto.randomUUID(),safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-120);
  const storageKey=`valuations/${valuation.id}/${id}-${safeName}`;
  await bucket().put(storageKey,await file.arrayBuffer(),{httpMetadata:{contentType:file.type}});
  await db().prepare(`INSERT INTO documents (id,valuation_id,storage_key,filename,content_type,size,kind,processing_status) VALUES (?,?,?,?,?,?,?,?)`)
    .bind(id,valuation.id,storageKey,file.name.slice(0,180),file.type,file.size,kind,"Recibido").run();
  const record=await db().prepare(`SELECT plan FROM valuations WHERE id=?`).bind(valuation.id).first<{plan:string}>();
  const count=await db().prepare(`SELECT COUNT(DISTINCT kind) AS total FROM documents WHERE valuation_id=?`).bind(valuation.id).first<{total:number}>();
  const required=record?.plan==="Express"?3:5,documentPercent=Math.min(100,Math.round((Number(count?.total||0)/required)*100));
  await db().prepare(`UPDATE valuations SET status='Antecedentes',workflow_step=MAX(workflow_step,4),completion_percent=?,automation_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .bind(documentPercent,documentPercent>=100?"Antecedentes listos":"Esperando antecedentes",valuation.id).run();
  return Response.json({id,filename:file.name,kind,completionPercent:documentPercent},{status:201});
}
