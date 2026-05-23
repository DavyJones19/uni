import { NextRequest, NextResponse } from "next/server";

import type { ComboboxOption } from "@/components/ui/search-combobox";

const COMBOS_URL = process.env.EXTERNAL_COMBOS_URL || "";
const EXTERNAL_API_TOKEN = process.env.EXTERNAL_API_TOKEN || "";
const EXTERNAL_API_TOKEN_TYPE = process.env.EXTERNAL_API_TOKEN_TYPE || "Bearer";

const buildAuthHeader = (request: NextRequest) => {
  const incoming = request.headers.get("authorization");
  if (incoming) return incoming;
  if (!EXTERNAL_API_TOKEN) return "";
  return `${EXTERNAL_API_TOKEN_TYPE} ${EXTERNAL_API_TOKEN}`;
};

type ComboRequestBody = {
  datos?: {
    tl?: string;
    columnas?: string[];
  };
  tl?: string;
  columnas?: string[];
};

const normalizeComboRows = (
  payload: unknown,
  columnas: string[],
): ComboboxOption[] => {
  const raw =
    payload !== null &&
    payload !== undefined &&
    typeof payload === "object" &&
    "data" in payload
      ? (payload as Record<string, unknown>)["data"]
      : payload;

  const values = Array.isArray(raw) ? raw : [];
  const [idKey = "id", labelKey = "tipo"] = columnas;

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
        const idCandidate = record[idKey] ?? record[idKey.toUpperCase()];
        const labelCandidate =
          record[labelKey] ?? record[labelKey.toUpperCase()];
        const value = labelCandidate ? String(labelCandidate).trim() : "";
        if (!value) return null;
        const id =
          idCandidate !== null && idCandidate !== undefined
            ? String(idCandidate).trim()
            : value;
        return { id, label: value, value };
      }
      return null;
    })
    .filter((item): item is ComboboxOption => Boolean(item));

  const seen = new Set<string>();
  return mapped.filter((item) => {
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
};

const fetchComboData = async (
  request: NextRequest,
  datos: { tl: string; columnas: string[] },
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const authorization = buildAuthHeader(request);
  if (authorization) headers.Authorization = authorization;

  const response = await fetch(COMBOS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(datos),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    return {
      error: NextResponse.json(
        {
          error:
            "Error al obtener combos de la API externa de combos genericos",
          status: response.status,
          statusText: response.statusText,
        },
        { status: response.status },
      ),
    };
  }

  const data = await response.json();
  const combos = normalizeComboRows(data, datos.columnas);
  return {
    error: null,
    response: NextResponse.json({ data: combos }, { status: 200 }),
  };
};

export async function GET(request: NextRequest) {
  if (!COMBOS_URL) {
    return NextResponse.json(
      { error: "Falta configurar EXTERNAL_COMBOS_URL" },
      { status: 500 },
    );
  }

  try {
    const url = new URL(request.url);
    const tl = String(url.searchParams.get("tl") ?? "cat_tipo_punto").trim();
    const columnasRaw = String(url.searchParams.get("columnas") ?? "id,tipo");
    const columnas = columnasRaw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const result = await fetchComboData(request, { tl, columnas });
    if (result.error) return result.error;
    return result.response;
  } catch {
    return NextResponse.json(
      { error: "Error al conectar con la API externa de combos genericos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!COMBOS_URL) {
    return NextResponse.json(
      { error: "Falta configurar EXTERNAL_COMBOS_URL" },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as ComboRequestBody;
    const datos = body.datos ?? { tl: body.tl, columnas: body.columnas };
    const tl = String(datos.tl ?? "").trim();
    const columnas = Array.isArray(datos.columnas) ? datos.columnas : [];

    if (!tl) {
      return NextResponse.json(
        { error: "Falta enviar datos.tl" },
        { status: 400 },
      );
    }

    const result = await fetchComboData(request, { tl, columnas });
    if (result.error) return result.error;
    return result.response;
  } catch {
    return NextResponse.json(
      { error: "Error al conectar con la API externa de combos genericos" },
      { status: 500 },
    );
  }
}
