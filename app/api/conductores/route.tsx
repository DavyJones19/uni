// POST /api/roles — proxy para obtener filas de roles.
// Soporta API externa por POST (body JSON) o GET (query o placeholder {grupo} en la URL).

import { NextRequest, NextResponse } from "next/server";

const CONDUCTORES_URL = process.env.EXTERNAL_CONDUCTORES_URL || "";
// EXTERNAL_CONDUCTORES_METHOD permite forzar GET si la API externa no usa POST.
const CONDUCTORES_METHOD =
  (process.env.EXTERNAL_CONDUCTORES_METHOD || "POST").toUpperCase() === "GET"
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

// Muchas APIs envuelven el array en { data }, { rows } o { resultado }.
const extractRows = (payload: unknown) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const record = payload as Record<string, unknown>;

  const parseJsonArray = (value: unknown) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string") return null;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const candidates = [
    record.data,
    record.rows,
    record.resultado,
    record.result,
    record.puntos,
    record.JsonData,
  ];

  for (const candidate of candidates) {
    const parsed = parseJsonArray(candidate);
    if (parsed) return parsed;
  }

  // Fallback: retorna el primer campo del objeto que sea array parseable.
  for (const value of Object.values(record)) {
    const parsed = parseJsonArray(value);
    if (parsed) return parsed;
  }

  return [];
};

export async function POST(request: NextRequest) {
  if (!CONDUCTORES_URL) {
    return NextResponse.json(
      { error: "Falta configurar EXTERNAL_CONDUCTORES_URL" },
      { status: 500 },
    );
  }

  let grupo = "";
  try {
    const body = await request.json();
    // ?? solo sustituye null/undefined; || también sustituiría "" (cadena vacía).
    grupo = String(body?.grupo ?? "").trim();
  } catch {
    grupo = "";
  }

  try {
    let url = CONDUCTORES_URL;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const authorization = buildAuthHeader(request);
    if (authorization) headers.Authorization = authorization;

    // RequestInit es el segundo argumento de fetch (método, headers, body...).
    let init: RequestInit = {
      method: CONDUCTORES_METHOD,
      headers,
      signal: AbortSignal.timeout(30000),
    };

    if (CONDUCTORES_METHOD === "GET") {
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
        // Spread ...init mantiene method, headers y signal; añadimos body.
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
          error: "Error al obtener conductores",
          status: response.status,
          statusText: response.statusText,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    const rows = extractRows(data);
    return NextResponse.json({ data: rows }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Error al conectar con la API externa de conductores" },
      { status: 500 },
    );
  }
}
