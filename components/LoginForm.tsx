"use client";
// Componente de presentación ("tonto"): no hace fetch ni useState.
// Recibe datos y callbacks por props — el padre (page.tsx) controla la lógica.

import * as React from "react";
import Image from "next/image";
import { useState } from "react";

// Tipo de las props: describe qué debe recibir el componente.
// (value: string) => void = tipo de función que acepta un string y no devuelve nada útil (void).
type LoginFormProps = {
  usuario: string;
  pwd: string;
  onUsuarioChange: (value: string) => void;
  onPwdChange: (value: string) => void;
  onSubmit: () => void;
  loadingLogin: boolean;
  error: string | null;
};

// Función nombrada exportada: import { LoginForm } from "..."
export function LoginForm({
  usuario,

  pwd,
  onUsuarioChange,
  onPwdChange,
  onSubmit,
  loadingLogin,
  error,
}: LoginFormProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };
  return (
    <section className="w-full rounded-2xl bg-white px-10 py-12 shadow-sm">
      <div className="flex flex-col items-center gap-6 text-center">
        {/* next/image: width/height intrínsecos; className mantiene altura h-12 y ancho proporcional */}
        <Image
          src="/logo_nuevo.jpeg"
          alt="Mistalentos"
          width={240}
          height={48}
          className="h-12 w-auto"
          priority
        />
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Favor de ingresar el usuario y contrasena que te fueron asignados
          </p>
          <div className="h-px w-40 bg-zinc-200" />
        </div>
      </div>

      <div className="mt-8 space-y-5 text-left">
        <label className="block text-sm font-medium text-zinc-700">
          Usuario
        </label>
        {/* Input controlado: value viene del padre; onChange sube el nuevo texto al padre. */}
        <input
          className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
          placeholder="Usuario"
          value={usuario}
          // Arrow function: (event) => ... es una función corta pasada como callback.
          // event.target.value = lo que escribió el usuario en este input.
          onChange={(event) => onUsuarioChange(event.target.value)}
        />

        <label className="block text-sm font-medium text-zinc-700">
          Contrasena
        </label>
        <input
          className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
          placeholder="Contrasena"
          type="password"
          value={pwd}
          onChange={(event) => onPwdChange(event.target.value)}
          onKeyDown={handleKeyPress}
        />
      </div>

      {/* type="button" evita enviar un <form> por defecto (aquí no hay <form>). */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={loadingLogin}
        className="mt-8 h-11 w-full rounded-full bg-sky-600 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {/* Expresión ternaria: condición ? siVerdad : siFalso */}
        {loadingLogin ? "Ingresando..." : "Entrar"}
      </button>

      {/* Render condicional corto: solo muestra el <p> si error es truthy. */}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </section>
  );
}
