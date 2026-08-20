import { requireChatGPTUser } from "../chatgpt-auth";
import PanelClient from "./PanelClient";

export const dynamic="force-dynamic";

export default async function PanelPage() {
  const user=await requireChatGPTUser("/panel");
  if(user.email.toLowerCase()!=="javiercastroarq@gmail.com") {
    return <main style={{padding:"60px",fontFamily:"Arial"}}><h1>Acceso restringido</h1><p>Este panel está reservado para la administración de TasaGo.</p><a href="/">Volver al sitio</a></main>;
  }
  return <PanelClient/>;
}
