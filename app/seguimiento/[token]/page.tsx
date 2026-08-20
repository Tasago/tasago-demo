"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function TrackingLink(){
  const params=useParams<{token:string}>();
  useEffect(()=>{
    window.localStorage.setItem("tasago_tracking_token",params.token);
    window.location.replace("/?screen=seguimiento");
  },[params.token]);
  return <main className="link-loading"><img src="/tasago-logo-final.png" alt="TasaGo"/><p>Abriendo tu tasación…</p></main>;
}
