import { apiUser, jsonError } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await apiUser();
  if (!user) return jsonError("Debes iniciar sesión",401);
  return Response.json({ user });
}
