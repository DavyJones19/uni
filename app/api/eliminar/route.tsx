import { NextRequest, NextResponse } from "next/server";

const ELIMINAR_URL = process.env.EXTERNAL_ELIMINAR_URL || "";
const EXTERNAL_API_TOKEN = process.env.EXTERNAL_API_TOKEN || "";
const EXTERNAL_API_TOKEN_TYPE = process.env.EXTERNAL_API_TOKEN_TYPE || "Bearer";

const buildAuthHeader = (request: NextRequest) => {
  const incoming = request.headers.get("authorization");
  if (incoming) return incoming;
  if (!EXTERNAL_API_TOKEN) return "";
  return `${EXTERNAL_API_TOKEN_TYPE} ${EXTERNAL_API_TOKEN}`;
};

export async function POST(request: NextRequest) {
  if (!ELIMINAR_URL) {
    return NextResponse.json(
      { error: "Falta configurar EXTERNAL_ELIMINAR_URL" },
      { status: 500 },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  try {
    const authorization = buildAuthHeader(request);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authorization) headers.Authorization = authorization;

    const response = await fetch(ELIMINAR_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const apiMsg = typeof result?.error === "string" ? result.error : null;
      return NextResponse.json(
        { error: apiMsg || "Error al eliminar el registro" },
        { status: response.status },
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Error al conectar con la API externa de eliminación" },
      { status: 500 },
    );
  }
}
