// Route Handler de Next.js (App Router): este archivo define el endpoint HTTP.
// NO lleva "use client" — corre solo en el servidor (Node). Aquí sí puedes usar secretos .env.

import { NextRequest, NextResponse } from "next/server";

// process.env solo en servidor; EXTERNAL_LOGIN_URL no se expone al navegador.
const LOGIN_URL = process.env.EXTERNAL_LOGIN_URL || "";
const isDev = process.env.NODE_ENV === "development";

// export async function POST = maneja peticiones POST a /api/login
// NextRequest incluye body, headers, etc.
export async function POST(request: NextRequest) {
  if (!LOGIN_URL) {
    // 503 = servicio no disponible (falta configuración).
    return NextResponse.json(
      {
        error:
          "Falta EXTERNAL_LOGIN_URL en .env.local (copia .env.example y reinicia el servidor).",
      },
      { status: 503 }
    );
  }

  let payload: unknown = {};
  try {
    payload = await request.json();
  } catch {
    // Body vacío o no JSON: seguimos con objeto vacío para no romper el proxy.
    payload = {};
  }

  try {
    // fetch en el servidor hacia la API externa — el cliente nunca ve LOGIN_URL directamente.
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    const text = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Error al iniciar sesion",
          status: response.status,
          statusText: response.statusText,
          body: text,
        },
        { status: response.status }
      );
    }

    try {
      const json = text ? JSON.parse(text) : {};
      return NextResponse.json(json, { status: 200 });
    } catch {
      // La API devolvió texto plano en vez de JSON: lo envolvemos para el cliente.
      return NextResponse.json({ data: text }, { status: 200 });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido de red";
    console.error("[api/login] fetch falló:", error);
    // 502 Bad Gateway = tu servidor actuó de proxy y el origen falló.
    return NextResponse.json(
      {
        error: "Error al conectar con la API externa de login",
        // Spread condicional: en producción no filtramos detalles al cliente.
        ...(isDev && { details: message }),
      },
      { status: 502 }
    );
  }
}
