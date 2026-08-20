export type Service = "Express" | "Visita profesional";

export type ValuationInput = {
  service: Service;
  purpose: string;
  propertyType: string;
  address: string;
  commune: string;
  area: string;
  name: string;
  email: string;
  phone: string;
};

export const documentKinds = ["propiedad", "superficie", "fotos"] as const;
export type DocumentKind = (typeof documentKinds)[number];

const allowedServices = new Set<Service>(["Express", "Visita profesional"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9 ()-]{8,20}$/;

export function validateValuationInput(value: unknown): ValuationInput {
  if (!value || typeof value !== "object") throw new Error("Datos de solicitud inválidos");
  const raw = value as Record<string, unknown>;
  const text = (key: string, max: number) => {
    const result = typeof raw[key] === "string" ? raw[key].trim() : "";
    if (!result || result.length > max) throw new Error(`Campo inválido: ${key}`);
    return result;
  };
  const service = raw.service as Service;
  if (!allowedServices.has(service)) throw new Error("Servicio inválido");
  const email = text("email", 160).toLowerCase();
  const phone = text("phone", 30);
  const area = text("area", 10);
  if (!emailPattern.test(email)) throw new Error("Correo electrónico inválido");
  if (!phonePattern.test(phone)) throw new Error("Teléfono inválido");
  if (!/^\d{1,7}$/.test(area) || Number(area) < 1) throw new Error("Superficie inválida");
  return {
    service,
    purpose: text("purpose", 80),
    propertyType: text("propertyType", 80),
    address: text("address", 240),
    commune: text("commune", 100),
    area,
    name: text("name", 160),
    email,
    phone,
  };
}

export function validateDocument(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Documento inválido");
  const raw = value as Record<string, unknown>;
  const kind = raw.kind as DocumentKind;
  const fileName = typeof raw.fileName === "string" ? raw.fileName.trim() : "";
  const mimeType = typeof raw.mimeType === "string" ? raw.mimeType : "";
  const size = typeof raw.size === "number" ? raw.size : 0;
  const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif"]);
  if (!documentKinds.includes(kind)) throw new Error("Tipo de antecedente inválido");
  if (!fileName || fileName.length > 180) throw new Error("Nombre de archivo inválido");
  if (!allowedMimeTypes.has(mimeType)) throw new Error("Formato no permitido. Usa PDF, JPG, PNG o HEIC");
  if (!Number.isInteger(size) || size < 1 || size > 15 * 1024 * 1024) throw new Error("El archivo debe pesar menos de 15 MB");
  return { kind, fileName, mimeType, size };
}
