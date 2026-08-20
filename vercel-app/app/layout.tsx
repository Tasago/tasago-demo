import type { Metadata, Viewport } from "next";
import "./globals.css";

const publicUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://tasago.cl";
export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title: "TasaGo — Tranquilidad para decidir bien",
  description: "Tasaciones inmobiliarias con experiencia, metodología y respaldo profesional. Express 100% digital o con visita especializada.",
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
    title: "TasaGo — Tranquilidad para decidir bien",
    description: "No vendemos una cifra. Entregamos seguridad profesional para decisiones inmobiliarias importantes.",
    images: [{ url: "/og.png", width: 1744, height: 915, alt: "TasaGo — Tasación inmobiliaria digital" }],
  },
  twitter: { card: "summary_large_image", title: "TasaGo — Tranquilidad para decidir bien", description: "Tasaciones inmobiliarias con experiencia y respaldo profesional.", images: ["/og.png"] },
};
export const viewport:Viewport={
  width:"device-width",
  initialScale:1,
  viewportFit:"cover",
  themeColor:"#0D2444",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
