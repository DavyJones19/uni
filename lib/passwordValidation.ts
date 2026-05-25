// lib/passwordValidation.ts
import { z } from 'zod';

export const bankPasswordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(16, "Máximo 16 caracteres")
  .regex(/[A-Z]/, "Al menos una mayúscula")
  .regex(/[a-z]/, "Al menos una minúscula")
  .regex(/[0-9]/, "Al menos un número")
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, "Al menos un carácter especial")
  .regex(/^\S*$/, "No se permiten espacios")
  .refine((val) => !/(.)\1{2,}/.test(val), {
    message: "No más de 2 caracteres iguales seguidos",
  })
  .refine(
    (val) => !["123456", "password", "qwerty", "abcdef"].some(seq => 
      val.toLowerCase().includes(seq)
    ),
    { message: "No uses secuencias comunes" }
  );

export type BankPassword = z.infer<typeof bankPasswordSchema>;