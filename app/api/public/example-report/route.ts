import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const money=(value:number)=>`$${value.toLocaleString("es-CL")}`;

export async function GET(request:Request){
  const pdf=await PDFDocument.create();
  const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy=rgb(13/255,36/255,68/255),green=rgb(30/255,138/255,58/255),grey=rgb(.39,.45,.52),light=rgb(.95,.97,.98),blue=rgb(36/255,95/255,137/255);
  const page=pdf.addPage([595,842]);
  try{const bytes=await fetch(new URL("/tasago-logo-final.png",request.url)).then(response=>response.arrayBuffer());const logo=await pdf.embedPng(bytes);page.drawImage(logo,{x:38,y:752,width:190,height:65})}catch{page.drawText("TasaGo",{x:42,y:784,size:24,font:bold,color:navy})}
  page.drawText("INFORME EXPRESS · EJEMPLO",{x:352,y:790,size:12,font:bold,color:navy});page.drawText("TG-EJEMPLO-0001",{x:408,y:772,size:9,font:regular,color:grey});
  page.drawRectangle({x:38,y:724,width:519,height:27,color:blue});page.drawText("DOCUMENTO DEMOSTRATIVO · DATOS Y VALORES ILUSTRATIVOS",{x:143,y:734,size:8,font:bold,color:rgb(1,1,1)});
  page.drawText("Resultado de valoración",{x:42,y:678,size:15,font:bold,color:navy});page.drawRectangle({x:42,y:570,width:511,height:88,color:light});page.drawText("VALOR COMERCIAL ESTIMADO",{x:60,y:629,size:8,font:bold,color:grey});page.drawText(money(198000000),{x:60,y:594,size:28,font:bold,color:green});page.drawText(`Rango: ${money(186000000)} - ${money(212000000)}`,{x:318,y:610,size:10,font:bold,color:navy});page.drawText(`${money(3093750)}/m² referencial`,{x:318,y:590,size:9,font:regular,color:grey});
  page.drawText("Inmueble analizado",{x:42,y:528,size:13,font:bold,color:navy});
  const rows=[["DIRECCIÓN","Av. Ejemplo 1234, Depto. 805"],["COMUNA","Ñuñoa"],["TIPO","Departamento"],["SUPERFICIE ÚTIL","64 m²"],["PROGRAMA","2 dorm. · 2 baños · 1 est."],["FINALIDAD","Venta"]];
  rows.forEach(([label,value],index)=>{const col=index%2,row=Math.floor(index/2),x=42+col*260,y=503-row*48;page.drawText(label,{x,y,size:7,font:bold,color:grey});page.drawText(value,{x,y:y-15,size:10,font:regular,color:navy,maxWidth:230})});
  page.drawText("Conclusión ejecutiva",{x:42,y:339,size:13,font:bold,color:navy});page.drawText("El valor referencial se obtiene a partir de antecedentes declarados, características del inmueble y comparables seleccionados en su microzona. El rango expresa la variabilidad observada y los ajustes del modelo.",{x:42,y:314,size:9,font:regular,color:grey,maxWidth:510,lineHeight:14});
  page.drawText("Contenido del informe",{x:42,y:247,size:13,font:bold,color:navy});["Ficha técnica del inmueble","Antecedentes considerados","Comparables seleccionados","Rango de valor y valor estimado","Supuestos, alcance, folio y firma simple"].forEach((item,index)=>page.drawText(`• ${item}`,{x:52,y:222-index*20,size:9,font:regular,color:navy}));
  page.drawLine({start:{x:370,y:91},end:{x:535,y:91},thickness:1,color:navy});page.drawText("TasaGo · Firma simple",{x:370,y:75,size:8,font:bold,color:navy});page.drawText("Ejemplo para conocer el formato de entrega",{x:42,y:35,size:7,font:regular,color:grey});
  const page2=pdf.addPage([595,842]);page2.drawText("COMPARABLES Y TRAZABILIDAD",{x:42,y:790,size:15,font:bold,color:navy});page2.drawRectangle({x:42,y:772,width:511,height:2,color:green});
  page2.drawText("Comparables seleccionados",{x:42,y:735,size:12,font:bold,color:navy});const comps=[["Av. Irarrázaval 3200","$205.000.000","66 m²","$3.106.061/m²"],["Pedro de Valdivia 4100","$191.000.000","62 m²","$3.080.645/m²"],["José Domingo Cañas 1700","$199.500.000","65 m²","$3.069.231/m²"]];let y=700;comps.forEach((item,index)=>{page2.drawRectangle({x:42,y:y-45,width:511,height:55,color:index%2?light:rgb(.98,.99,1)});page2.drawText(`${index+1}. ${item[0]}`,{x:54,y:y-10,size:9,font:bold,color:navy});page2.drawText(`${item[1]} · ${item[2]} · ${item[3]}`,{x:54,y:y-29,size:9,font:regular,color:grey});y-=64});
  page2.drawText("Antecedentes considerados",{x:42,y:466,size:12,font:bold,color:navy});["Identificación y dirección del inmueble","Superficie útil y programa","Fotografías de referencia","Declaración del solicitante"].forEach((item,index)=>page2.drawText(`OK  ${item}`,{x:52,y:438-index*23,size:9,font:regular,color:green}));
  page2.drawText("Alcance",{x:42,y:320,size:12,font:bold,color:navy});page2.drawText("Este PDF ilustra la estructura de una entrega Express. No corresponde a una propiedad real ni puede utilizarse para decisiones de compraventa, crédito, juicio o garantía. La versión comercial identificará fuentes, fecha de observación, supuestos y responsable de emisión.",{x:42,y:294,size:9,font:regular,color:grey,maxWidth:510,lineHeight:14});
  page2.drawText("Página 2 · TG-EJEMPLO-0001",{x:42,y:35,size:7,font:regular,color:grey});
  const bytes=await pdf.save();return new Response(bytes as BodyInit,{headers:{"Content-Type":"application/pdf","Content-Disposition":"inline; filename=\"TasaGo_Informe_Express_Ejemplo.pdf\"","Cache-Control":"public, max-age=3600"}});
}
