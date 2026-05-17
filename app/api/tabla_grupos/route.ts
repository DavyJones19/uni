// POST /api/tabla_grupos — proxy para obtener filas de la tabla de grupos segun el grupo seleccionado.
// Soporta API externa por POST (body JSON) o GET (query o placeholder {grupo} en la URL).

import { NextRequest, NextResponse } from "next/server";

const TABLA_GRUPOS_URL = process.env.EXTERNAL_TABLA_GRUPOS_URL || "";
const TABLA_GRUPOS_METHOD =
  (process.env.EXTERNAL_TABLA_GRUPOS_METHOD || "POST").toUpperCase() === "GET"
    ? "GET"
    : "POST";
const EXTERNAL_API_TOKEN = process.env.EXTERNAL_API_TOKEN || "";
const EXTERNAL_API_TOKEN_TYPE = process.env.EXTERNAL_API_TOKEN_TYPE || "Bearer";

const buildAuthHeader = (request: NextRequest) => {
  const incoming = request.headers.get("authorization");
  if (incoming) return incoming;
  if (!EXTERNAL_API_TOKEN) return "";
  return `${EXTERNAL_API_TOKEN_TYPE} ${EXTERNAL_API_TOKEN}`;
};

const extractRows = (payload: unknown) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.rows)) return record.rows;
  if (Array.isArray(record.resultado)) return record.resultado;
  return [];
};

export async function POST(request: NextRequest) {
  if (!TABLA_GRUPOS_URL) {
    return NextResponse.json(
      { error: "Falta configurar EXTERNAL_TABLA_GRUPOS_URL" },
      { status: 500 }
    );
  }

  let grupo = "";
  try {
    const body = await request.json();
    grupo = String(body?.grupo ?? "").trim();
  } catch {
    grupo = "";
  }

  try {
    let url = TABLA_GRUPOS_URL;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const authorization = buildAuthHeader(request);
    if (authorization) headers.Authorization = authorization;

    let init: RequestInit = {
      method: TABLA_GRUPOS_METHOD,
      headers,
      signal: AbortSignal.timeout(30000),
    };

    if (TABLA_GRUPOS_METHOD === "GET") {
      if (url.includes("{grupo}")) {
        url = url.replace("{grupo}", encodeURIComponent(grupo));
      } else if (grupo) {
        const connector = url.includes("?") ? "&" : "?";
        url = `${url}${connector}grupo=${encodeURIComponent(grupo)}`;
      }
    } else {
      if (url.includes("{grupo}")) {
        url = url.replace("{grupo}", encodeURIComponent(grupo));
      } else {
        init = {
          ...init,
          body: JSON.stringify(grupo ? { grupo } : {}),
        };
      }
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Error al obtener tabla de grupos",
          status: response.status,
          statusText: response.statusText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rows = extractRows(data);
    return NextResponse.json({ data: rows }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Error al conectar con la API externa de tabla de grupos" },
      { status: 500 }
    );
  }
}
