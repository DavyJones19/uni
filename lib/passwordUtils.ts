// lib/passwordUtils.ts
import { bankPasswordSchema } from "@/lib/passwordValidation";

/**
 * Validar contraseña localmente según el esquema de banco
 * @param password - Contraseña a validar
 * @returns { isValid: boolean, error?: string }
 */
export function validatePassword(password: string): {
  isValid: boolean;
  error?: string;
} {
  const result = bankPasswordSchema.safeParse(password);
  
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      isValid: false,
      error: firstError?.message || "Contraseña inválida",
    };
  }

  return { isValid: true };
}

/**
 * Cambiar contraseña de un usuario
 * Realiza validación server-side adicional
 */
export async function changeUserPassword(
  userId: string | number,
  newPassword: string,
  token: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  details?: Array<{ path: string; message: string }>;
}> {
  try {
    // Validación local primero
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Llamar al endpoint del servidor
    const response = await fetch("/api/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        password: newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error,
        details: data.details,
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("[ERROR] changeUserPassword:", error);
    return {
      success: false,
      error: "Error al procesar la solicitud",
    };
  }
}

/**
 * Calcular puntuación de fortaleza de contraseña (0-7)
 * Basado en los mismos criterios del esquema de validación
 */
export function calculatePasswordStrength(password: string): number {
  const checks = {
    length: password?.length >= 8 && password?.length <= 16,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    noSpaces: /^\S*$/.test(password),
    noRepeats: !/(.)\1{2,}/.test(password),
  };

  return Object.values(checks).filter(Boolean).length;
}

/**
 * Obtener descripción de fortaleza
 */
export function getPasswordStrengthLabel(strength: number): {
  label: string;
  color: string;
  percentage: number;
} {
  if (strength <= 3) {
    return { label: "Débil", color: "bg-red-500", percentage: 33 };
  } else if (strength <= 5) {
    return { label: "Media", color: "bg-yellow-500", percentage: 66 };
  } else {
    return { label: "Fuerte", color: "bg-green-500", percentage: 100 };
  }
}
