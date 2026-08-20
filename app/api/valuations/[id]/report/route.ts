import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { apiUser, db, jsonError } from "../../../_lib";

function money(value:unknown) { return `$${Math.round(Number(value)||0).toLocaleString("es-CL")}`; }
function safe(value:unknown) { return String(value??"").replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑüÜ°²]/g,""); }

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await apiUser(); if(!user) return jsonError("Debes iniciar sesión",401);
  const {id}=await params;
  const v=await db().prepare(`SELECT * FROM valuations WHERE id=?`).bind(id).first<Record<string,unknown>>();
  if(!v) return jsonError("Tasación no encontrada",404);
  const comps=await db().prepare(`SELECT address,price,surface,unit_price FROM comparables WHERE valuation_id=? AND selected=1 ORDER BY created_at DESC LIMIT 8`).bind(id).all<Record<string,unknown>>();
  const pdf=await PDFDocument.create(); const page=pdf.addPage([595,842]);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold),regular=await pdf.embedFont(StandardFonts.Helvetica);
  const navy=rgb(13/255,36/255,68/255),green=rgb(30/255,138/255,58/255),grey=rgb(.38,.43,.5);
  let y=790;
  try { const logoBytes=await fetch(new URL("/tasago-logo-final.png",request.url)).then(r=>r.arrayBuffer()); const logo=await pdf.embedPng(logoBytes); page.drawImage(logo,{x:42,y:755,width:190,height:65}); } catch { page.drawText("TasaGo",{x:42,y:782,size:24,font:bold,color:navy}); }
  page.drawText(`INFORME DE TASACION · ${safe(v.folio)}`,{x:310,y:795,size:10,font:bold,color:navy});
  page.drawText(`Emitido: ${new Date().toLocaleDateString("es-CL")}`,{x:390,y:777,size:8,font:regular,color:grey});
  page.drawRectangle({x:42,y:738,width:511,height:3,color:green}); y=710;
  const heading=(text:string)=>{page.drawText(text,{x:42,y,size:12,font:bold,color:navy});y-=23;};
  const row=(label:string,value:unknown,x=42)=>{page.drawText(label.toUpperCase(),{x,y,size:7,font:bold,color:grey});page.drawText(safe(value)||"-",{x,y:y-13,size:10,font:regular,color:navy});};
  heading("1. Identificación del encargo"); row("Cliente",v.client_name);row("Finalidad",v.purpose,305);y-=40;row("Dirección",v.address);row("Comuna",v.commune,305);y-=46;
  heading("2. Características del inmueble"); row("Tipo",v.property_type);row("Superficie útil",`${v.useful_surface} m²`,220);row("Superficie total",`${v.total_surface} m²`,390);y-=40;row("Dormitorios",v.bedrooms);row("Baños",v.bathrooms,220);row("Estacionamientos",v.parking,390);y-=48;
  heading("3. Resultado de tasación");
  page.drawRectangle({x:42,y:y-48,width:511,height:58,color:rgb(.95,.97,.96)});page.drawText("VALOR COMERCIAL ESTIMADO",{x:58,y:y-10,size:8,font:bold,color:grey});page.drawText(money(v.estimated_value),{x:58,y:y-34,size:22,font:bold,color:green});page.drawText(`Estado: ${safe(v.status)}`,{x:405,y:y-27,size:9,font:bold,color:navy});y-=78;
  heading("4. Comparables seleccionados");
  if(!comps.results.length){page.drawText("No se han incorporado comparables al expediente.",{x:42,y,size:9,font:regular,color:grey});y-=20;}
  else for(const comp of comps.results){page.drawText(safe(comp.address).slice(0,48),{x:42,y,size:8,font:regular,color:navy});page.drawText(`${money(comp.price)} · ${comp.surface} m² · ${money(comp.unit_price)}/m²`,{x:320,y,size:8,font:regular,color:navy});y-=18;}
  y=Math.min(y-25,210);heading("5. Observaciones");
  const notes=safe(v.notes)||"Tasación emitida sobre la base de los antecedentes proporcionados y comparables incorporados al expediente.";
  page.drawText(notes.slice(0,110),{x:42,y,size:8,font:regular,color:grey,maxWidth:510,lineHeight:12});
  page.drawLine({start:{x:370,y:92},end:{x:540,y:92},thickness:1,color:navy});page.drawText(safe(user.displayName),{x:370,y:76,size:9,font:bold,color:navy});page.drawText("Perito tasador · Firma simple",{x:370,y:62,size:8,font:regular,color:grey});
  page.drawText(`TasaGo · Inteligencia Territorial · Folio ${safe(v.folio)}`,{x:42,y:32,size:7,font:regular,color:grey});
  const bytes=await pdf.save();
  return new Response(bytes as BodyInit,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="TasaGo_${safe(v.folio)}.pdf"`}});
}
