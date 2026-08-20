import Link from "next/link";

export default function PanelPreview(){
  return <main style={{minHeight:"100vh",background:"#f3f7fb",padding:"32px 20px",fontFamily:"var(--font-manrope),sans-serif",color:"#0d2444"}}>
    <section style={{maxWidth:920,margin:"0 auto",background:"white",border:"1px solid #dce6ef",borderRadius:24,padding:"clamp(24px,5vw,56px)",boxShadow:"0 24px 60px rgba(13,36,68,.10)"}}>
      <img src="/tasago-logo-final.png" alt="TasaGo" style={{width:180,height:"auto"}}/>
      <p style={{marginTop:42,color:"#1e8a3a",fontWeight:800,letterSpacing:".12em",fontSize:12}}>PANEL PROFESIONAL</p>
      <h1 style={{fontSize:"clamp(32px,5vw,56px)",lineHeight:1.02,margin:"12px 0 18px"}}>La operación interna sigue protegida.</h1>
      <p style={{fontSize:18,lineHeight:1.6,maxWidth:680,color:"#4e6177"}}>Esta publicación permite validar la experiencia comercial y el flujo Express. El CRM, expedientes persistentes, Mercado Pago y archivos se conectarán en la etapa de infraestructura segura.</p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:32}}><Link href="/" style={{background:"#0d2444",color:"white",padding:"14px 22px",borderRadius:12,textDecoration:"none",fontWeight:800}}>Volver a la aplicación</Link><a href="mailto:contacto@tasago.cl" style={{border:"1px solid #0d2444",color:"#0d2444",padding:"14px 22px",borderRadius:12,textDecoration:"none",fontWeight:800}}>Solicitar acceso</a></div>
    </section>
  </main>;
}

