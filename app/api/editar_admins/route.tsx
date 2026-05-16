// GET /api/editar_admins — proxy hacia la API externa de listado de administradores.
// La autenticación puede venir del header Authorization del navegador o de variables .env.

import { NextRequest, NextResponse } from "next/server";

const EDITAR_ADMINS_URL = process.env.EXTERNAL_EDITAR_ADMINS_URL || "";
const EXTERNAL_API_TOKEN = process.env.EXTERNAL_API_TOKEN || "";
const EXTERNAL_API_TOKEN_TYPE = process.env.EXTERNAL_API_TOKEN_TYPE || "Bearer";

// Prioridad: si el cliente envía Authorization, úsalo (token del login del usuario).
// Si no, opcionalmente usa token fijo del .env (útil en pruebas o APIs sin login por usuario).
const buildAuthHeader = (request: NextRequest) => {
  const incoming = request.headers.get("authorization");
  if (incoming) return incoming;
  if (!EXTERNAL_API_TOKEN) return "";
  return `${EXTERNAL_API_TOKEN_TYPE} ${EXTERNAL_API_TOKEN}`;
};

type AdministradorOption = {
  id: string;
  label: string;
  value: string;
};

// Normaliza respuestas distintas (array puro, { data: [...] }, items string/objeto).
const normalizeAdministradores = (payload: unknown): AdministradorOption[] => {
  const raw =
    payload !== null &&
    payload !== undefined &&
    typeof payload === "object" &&
    "data" in payload
      ? (payload as Record<string, unknown>)["data"]
      : payload;
  if (!raw) return [];

  const values = Array.isArray(raw) ? raw : [];

  const mapped = values
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
          record.ADMIN ||
          record.admin ||
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
    // Type predicate: le dice a TS que tras el filter solo quedan AdministradorOption, no null.
    .filter((item): item is AdministradorOption => Boolean(item));

  const seen = new Set<string>();
  return mapped.filter((item) => {
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
};

// GET: el navegador hace fetch("/api/editar_admins", { headers: { Authorization } })
export async function GET(request: NextRequest) {
  if (!EDITAR_ADMINS_URL) {
    return NextResponse.json(
      { error: "Falta configurar EXTERNAL_EDITAR_ADMINS_URL" },
      { status: 500 },
    );
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const authorization = buildAuthHeader(request);
    if (authorization) headers.Authorization = authorization;

    const response = await fetch(EDITAR_ADMINS_URL, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Error al obtener administradores",
          status: response.status,
          statusText: response.statusText,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    const administradores = normalizeAdministradores(data);
    // Formato unificado para el cliente: siempre { data: [...] }
    return NextResponse.json({ data: administradores }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Error al conectar con la API externa de administradores" },
      { status: 500 },
    );
  }
}
