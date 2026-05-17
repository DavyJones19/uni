import { NextRequest, NextResponse } from "next/server";

// Asegúrate de que en tu .env esta URL apunte al controlador: insertar_grupo
const TABLA_INSERTAR_URL = process.env.EXTERNAL_INSERTAR_URL || "";
const EXTERNAL_API_TOKEN = process.env.EXTERNAL_API_TOKEN || "";
const EXTERNAL_API_TOKEN_TYPE = process.env.EXTERNAL_API_TOKEN_TYPE || "Bearer";

const buildAuthHeader = (request: NextRequest) => {
  const incoming = request.headers.get("authorization");
  if (incoming) return incoming;
  if (!EXTERNAL_API_TOKEN) return "";
  return `${EXTERNAL_API_TOKEN_TYPE} ${EXTERNAL_API_TOKEN}`;
};

const extractInsertedId = (payload: any): string | number | null => {
  if (payload === null || payload === undefined) return null;

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nested = extractInsertedId(item);
      if (nested !== null && nested !== undefined && nested !== "") return nested;
    }
    return null;
  }

  if (typeof payload === "object") {
    const directId = payload.id ?? payload.ID;
    if (directId !== null && directId !== undefined && directId !== "") {
      return directId;
    }

    const nestedSources = [
      payload.data,
      payload.result,
      payload.resultado,
      payload.rows,
      payload.JsonData,
    ];

    for (const source of nestedSources) {
      const nested = extractInsertedId(source);
      if (nested !== null && nested !== undefined && nested !== "") return nested;
    }
  }

  return null;
};

export async function POST(request: NextRequest) {
  if (!TABLA_INSERTAR_URL) {
    return NextResponse.json(
      { error: "Falta configurar EXTERNAL_INSERTAR_URL" },
      { status: 500 },
    );
  }

  try {
    // 1. Obtenemos el objeto 'datos' completo que viene del modal
    const body = await request.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const authorization = buildAuthHeader(request);
    if (authorization) headers.Authorization = authorization;

    // 2. Enviamos el JSON tal cual a tu API de .NET
    const response = await fetch(TABLA_INSERTAR_URL, {
      method: "POST", // Tu controlador usa [HttpPost]
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errorData.error || "Error al insertar los datos",
          status: response.status,
        },
        { status: response.status },
      );
    }

    const result = await response.json();
    const insertedId = extractInsertedId(result);

    // 3. Retornamos el resultado exitoso al frontend
    return NextResponse.json(
      { ok: true, id: insertedId ?? null, result },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error de conexión: " + error.message },
      { status: 500 },
    );
  }
}
