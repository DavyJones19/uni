// app/api/auth/set-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { bankPasswordSchema } from "@/lib/passwordValidation";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, userId } = body;

    // ✅ Validación server-side obligatoria
    const result = bankPasswordSchema.safeParse(password);
    if (!result.success) {
      return NextResponse.json(
        { error: "Contraseña no cumple requisitos de seguridad", details: result.error.issues },
        { status: 400 }
      );
    }

    // ✅ Verificar que no esté en lista de contraseñas comprometidas (Have I Been Pwned)
    const isCompromised = await checkPwnedPassword(password);
    if (isCompromised) {
      return NextResponse.json(
        { error: "Esta contraseña aparece en filtraciones de datos. Usa otra." },
        { status: 400 }
      );
    }

    // ✅ Hashear con bcrypt (cost factor 12 para banca)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Guardar en base de datos...
    // await db.user.update({ where: { id: userId }, data: { password: hashedPassword } });

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Verificar contra Have I Been Pwned API
async function checkPwnedPassword(password: string): Promise<boolean> {
  const crypto = require("crypto");
  const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const data = await response.text();
  
  return data.includes(suffix);
}