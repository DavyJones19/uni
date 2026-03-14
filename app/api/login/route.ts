import { NextRequest, NextResponse } from "next/server";

const LOGIN_URL = process.env.EXTERNAL_LOGIN_URL || "";

export async function POST(request: NextRequest) {
  if (!LOGIN_URL) {
    return NextResponse.json(
      { error: "Falta configurar EXTERNAL_LOGIN_URL" },
      { status: 500 }
    );
  }

  let payload: unknown = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  try {
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
      return NextResponse.json({ data: text }, { status: 200 });
    }
  } catch {
    return NextResponse.json(
      { error: "Error al conectar con la API externa de login" },
      { status: 500 }
    );
  }
}
