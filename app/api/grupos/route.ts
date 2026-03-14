import { NextRequest, NextResponse } from "next/server";

const GRUPOS_URL = process.env.EXTERNAL_GRUPOS_URL || "";
const EXTERNAL_API_TOKEN = process.env.EXTERNAL_API_TOKEN || "";
const EXTERNAL_API_TOKEN_TYPE = process.env.EXTERNAL_API_TOKEN_TYPE || "Bearer";

const buildAuthHeader = (request: NextRequest) => {
  const incoming = request.headers.get("authorization");
  if (incoming) return incoming;
  if (!EXTERNAL_API_TOKEN) return "";
  return `${EXTERNAL_API_TOKEN_TYPE} ${EXTERNAL_API_TOKEN}`;
};

type GrupoOption = {
  id: string;
  label: string;
  value: string;
};

const normalizeGroups = (payload: unknown): GrupoOption[] => {
  const raw = (payload as any)?.data ?? payload;
  if (!raw) return [];

  const values = Array.isArray(raw) ? raw : [];

  return values
    .map((item) => {
      if (item === null || item === undefined) return null;
      if (typeof item === "string" || typeof item === "number") {
        const value = String(item).trim();
        if (!value) return null;
        return { id: value, label: value, value };
      }
      if (typeof item === "object") {
        const record = item as Record<string, unknown>;
        const candidate =
          record.GRUPO ||
          record.grupo ||
          record.nombre ||
          record.Nombre ||
          record.label ||
          record.value;
        const value = candidate ? String(candidate).trim() : "";
        if (!value) return null;
        return { id: value, label: value, value };
      }
      return null;
    })
    .filter((item): item is GrupoOption => Boolean(item));
};

export async function GET(request: NextRequest) {
  if (!GRUPOS_URL) {
    return NextResponse.json(
      { error: "Falta configurar EXTERNAL_GRUPOS_URL" },
      { status: 500 }
    );
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const authorization = buildAuthHeader(request);
    if (authorization) headers.Authorization = authorization;

    const response = await fetch(GRUPOS_URL, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Error al obtener grupos",
          status: response.status,
          statusText: response.statusText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const grupos = normalizeGroups(data);
    return NextResponse.json({ data: grupos }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al conectar con la API externa de grupos" },
      { status: 500 }
    );
  }
}
