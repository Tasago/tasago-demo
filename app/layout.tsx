import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
export const metadata: Metadata = {
  metadataBase: new URL("https://tasago-maqueta-v3.javcas50.chatgpt.site"),
  title: "TasaGo — Tasaciones inmobiliarias simples y trazables",
  description: "Solicita, documenta, paga y sigue una tasación inmobiliaria Express o Profesional desde una sola aplicación.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/tasago-app-icon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon-32.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "TasaGo",
    title: "TasaGo — El valor de tu propiedad, respaldado para decidir",
    description: "Un expediente continuo para solicitar, documentar, pagar y recibir tu tasación inmobiliaria.",
    images: [{ url: "/og.png", width: 1744, height: 915, alt: "TasaGo — Tasación inmobiliaria digital" }],
  },
  twitter: { card: "summary_large_image", title: "TasaGo — El valor de tu propiedad, respaldado para decidir", description: "Solicita, documenta, paga y recibe tu tasación desde una sola aplicación.", images: ["/og.png"] },
};
export const viewport:Viewport={
  width:"device-width",
  initialScale:1,
  viewportFit:"cover",
  themeColor:"#0D2444",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={manrope.variable}>{children}</body></html>;
}
