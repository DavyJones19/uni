// components/PasswordForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bankPasswordSchema } from "@/lib/passwordValidation";

export default function PasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(bankPasswordSchema),
    mode: "onChange", // Validación en tiempo real
  });

  const password = watch("password");

  const onSubmit = async (data: any) => {
    // Enviar al servidor
    const response = await fetch("/api/auth/set-password", {
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
          {...register("password")}
          className="border p-2 rounded w-full"
          autoComplete="new-password"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
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