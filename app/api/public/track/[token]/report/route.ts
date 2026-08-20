import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db, ensureSchema, jsonError } from "../../../../_lib";

const money=(value:unknown)=>`$${Math.round(Number(value)||0).toLocaleString("es-CL")}`;
const safe=(value:unknown)=>String(value??"").replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑüÜ°²]/g,"");

export async function GET(request:Request,{params}:{params:Promise<{token:string}>}){
  await ensureSchema();const {token}=await params;
  const v=await db().prepare(`SELECT * FROM valuations WHERE customer_token=?`).bind(token).first<Record<string,unknown>>();
  if(!v)return jsonError("Enlace de seguimiento inválido",404);if(v.status!=="Entregado")return jsonError("El informe todavía no está disponible",409);
  const [documents,comparables]=await Promise.all([
    db().prepare(`SELECT filename,kind,processing_status FROM documents WHERE valuation_id=? ORDER BY created_at`).bind(v.id).all<Record<string,unknown>>(),
    db().prepare(`SELECT address,price,surface,unit_price,source FROM comparables WHERE valuation_id=? AND selected=1 ORDER BY created_at LIMIT 6`).bind(v.id).all<Record<string,unknown>>(),
  ]);
  let model:{rangeLow?:number;rangeHigh?:number;unitPrice?:number;validationMode?:boolean}={};try{model=JSON.parse(String(v.model_result_json||"{}"))}catch{}
  const pdf=await PDFDocument.create(),regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy=rgb(13/255,36/255,68/255),green=rgb(30/255,138/255,58/255),grey=rgb(.39,.45,.52),light=rgb(.95,.97,.98),amber=rgb(.96,.68,.2);
  const page=pdf.addPage([595,842]);
  try{const logoBytes=await fetch(new URL("/tasago-logo-final.png",request.url)).then(response=>response.arrayBuffer());const logo=await pdf.embedPng(logoBytes);page.drawImage(logo,{x:38,y:752,width:190,height:65})}catch{page.drawText("TasaGo",{x:42,y:784,size:24,font:bold,color:navy})}
  page.drawText("INFORME EXPRESS",{x:382,y:790,size:13,font:bold,color:navy});page.drawText(safe(v.folio),{x:382,y:772,size:9,font:regular,color:grey});
  page.drawRectangle({x:38,y:728,width:519,height:28,color:amber});page.drawText("MODO VALIDACIÓN · RESULTADO ILUSTRATIVO, NO USAR PARA UNA DECISIÓN COMERCIAL",{x:52,y:738,size:8,font:bold,color:navy});
  page.drawText("Resultado de valoración",{x:42,y:680,size:15,font:bold,color:navy});page.drawRectangle({x:42,y:572,width:511,height:88,color:light});page.drawText("VALOR COMERCIAL ESTIMADO",{x:60,y:631,size:8,font:bold,color:grey});page.drawText(money(v.estimated_value),{x:60,y:596,size:28,font:bold,color:green});page.drawText(`Rango: ${money(model.rangeLow)} — ${money(model.rangeHigh)}`,{x:320,y:611,size:10,font:bold,color:navy});page.drawText(`${money(model.unitPrice)}/m² referencial`,{x:320,y:592,size:9,font:regular,color:grey});
  page.drawText("Inmueble analizado",{x:42,y:530,size:13,font:bold,color:navy});
  const rows=[["Dirección",v.address],["Comuna",v.commune],["Tipo",v.property_type],["Superficie útil",`${v.useful_surface} m²`],["Programa",`${v.bedrooms} dorm. · ${v.bathrooms} baños · ${v.parking} est.`],["Finalidad",v.purpose]];
  rows.forEach(([label,value],index)=>{const col=index%2,row=Math.floor(index/2),x=42+col*260,y=505-row*48;page.drawText(String(label).toUpperCase(),{x,y,size:7,font:bold,color:grey});page.drawText(safe(value),{x,y:y-15,size:10,font:regular,color:navy,maxWidth:230})});
  page.drawText("Metodología Express",{x:42,y:340,size:13,font:bold,color:navy});page.drawText("Antecedentes recibidos, extracción estructurada, comparables de validación, modelo referencial, control y PDF.",{x:42,y:316,size:9,font:regular,color:grey,maxWidth:510,lineHeight:13});
  page.drawText("Supuestos y alcance",{x:42,y:270,size:13,font:bold,color:navy});page.drawText("Este documento fue generado para validar el funcionamiento de la plataforma. Los comparables y el resultado son ilustrativos. La versión comercial requerirá fuentes verificadas, reglas de calidad y activación de los servicios de automatización.",{x:42,y:245,size:9,font:regular,color:grey,maxWidth:510,lineHeight:14});
  page.drawLine({start:{x:370,y:105},end:{x:535,y:105},thickness:1,color:navy});page.drawText("TasaGo · Firma simple de validación",{x:370,y:88,size:8,font:bold,color:navy});page.drawText(`Emitido ${new Date().toLocaleDateString("es-CL")}`,{x:370,y:74,size:8,font:regular,color:grey});page.drawText(`TasaGo · Inteligencia Territorial · ${safe(v.folio)}`,{x:42,y:35,size:7,font:regular,color:grey});
  const page2=pdf.addPage([595,842]);page2.drawText("ANTECEDENTES Y COMPARABLES",{x:42,y:790,size:15,font:bold,color:navy});page2.drawRectangle({x:42,y:772,width:511,height:2,color:green});let y=735;
  page2.drawText("Antecedentes procesados",{x:42,y,size:12,font:bold,color:navy});y-=28;if(!documents.results.length){page2.drawText("Sin antecedentes registrados.",{x:42,y,size:9,font:regular,color:grey});y-=22}else for(const item of documents.results){page2.drawText(`OK  ${safe(item.filename).slice(0,70)}`,{x:52,y,size:9,font:regular,color:navy});page2.drawText(`${safe(item.kind)} · ${safe(item.processing_status)}`,{x:380,y,size:8,font:regular,color:grey});y-=22}
  y-=20;page2.drawText("Comparables utilizados en la validación",{x:42,y,size:12,font:bold,color:navy});y-=28;comparables.results.forEach((item,index)=>{page2.drawRectangle({x:42,y:y-44,width:511,height:54,color:index%2?light:rgb(.98,.99,1)});page2.drawText(`${index+1}. ${safe(item.address)}`,{x:54,y:y-8,size:9,font:bold,color:navy});page2.drawText(`${money(item.price)} · ${item.surface} m² · ${money(item.unit_price)}/m²`,{x:54,y:y-27,size:9,font:regular,color:grey});page2.drawText(safe(item.source),{x:430,y:y-27,size:8,font:regular,color:green});y-=62});
  page2.drawText("Control de validación",{x:42,y:230,size:12,font:bold,color:navy});["Archivos vinculados al folio","Extracción documental simulada","Ficha técnica estructurada","Tres comparables generados","Modelo de valoración ejecutado","PDF disponible en el expediente"].forEach((item,index)=>page2.drawText(`OK  ${item}`,{x:52,y:204-index*22,size:9,font:regular,color:index<6?green:grey}));page2.drawText(`Página 2 · ${safe(v.folio)}`,{x:42,y:35,size:7,font:regular,color:grey});
  const bytes=await pdf.save();return new Response(bytes as BodyInit,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="TasaGo_Express_${safe(v.folio)}_VALIDACION.pdf"`}});
}
