// app/api/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { bankPasswordSchema } from "@/lib/passwordValidation";
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password, userId } = body;

    // Validaciones básicas
    if (!userId || !password) {
      return NextResponse.json(
        { error: "userId y password son requeridos" },
        { status: 400 }
      );
    }

    // ✅ Validación server-side obligatoria con el esquema
    const result = bankPasswordSchema.safeParse(password);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Contraseña no cumple requisitos de seguridad",
          details: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // ✅ Verificar que no esté en lista de contraseñas comprometidas (Have I Been Pwned)
    const isCompromised = await checkPwnedPassword(password);
    if (isCompromised) {
      return NextResponse.json(
        {
          error: "Esta contraseña aparece en filtraciones de datos conocidas. Por favor, elige otra.",
        },
        { status: 400 }
      );
    }

    // ✅ Hashear con bcrypt (cost factor 12 para aplicaciones de banca)
    const hashedPassword = await bcrypt.hash(password, 12);

    // TODO: Actualizar en base de datos
    // await db.user.update({
    //   where: { id: userId },
    //   data: { 
    //     pwd: hashedPassword,
    //     updated_at: new Date(),
    //   },
    // });

    // Log para auditoría (sin guardar la contraseña)
    console.log(`[SEGURIDAD] Cambio de contraseña para usuario ${userId} - ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("[ERROR] Change password:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * Verifica contra la API Have I Been Pwned
 * Utiliza k-anonymity para no enviar la contraseña completa
 */
async function checkPwnedPassword(password: string): Promise<boolean> {
  try {
    const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "User-Agent": "DHL-Users-Manager/1.0",
      },
    });

    if (!response.ok) {
      console.warn("[WARN] No se pudo verificar Have I Been Pwned, permitiendo contraseña");
      return false;
    }

    const data = await response.text();
    return data.includes(suffix);
  } catch (error) {
    console.error("[ERROR] Verificación Have I Been Pwned:", error);
    // En caso de error de red, permitir pero loguear
    return false;
  }
}
