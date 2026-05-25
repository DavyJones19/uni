// components/PasswordForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { bankPasswordSchema } from "@/lib/passwordValidation";
import PasswordStrengthIndicator from "@/components/ui/passwordStrength/passwordStrengthIndicator";

type PasswordFormValues = {
  password: string;
};

export default function PasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordFormValues>({
    mode: "onChange", // Validación en tiempo real
    defaultValues: {
      password: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (data: PasswordFormValues) => {
    // Enviar al servidor
    await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Nueva Contraseña</label>
        <input
          type="password"
          {...register("password", {
            validate: (value) => {
              const result = bankPasswordSchema.safeParse(value);
              if (result.success) return true;
              return result.error.issues[0]?.message || "Contraseña inválida";
            },
          })}
          className="border p-2 rounded w-full"
          autoComplete="new-password"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{String(errors.password.message)}</p>
        )}
      </div>

      {/* Indicador de fortaleza visual */}
      <PasswordStrengthIndicator password={password} />
      
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Guardar Contraseña
      </button>
    </form>
  );
}