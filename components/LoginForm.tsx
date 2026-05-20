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
 <section className="w-full rounded-2xl bg-[#FFC400] px-10 py-8 shadow-sm">

  {/* Logo */}
 <div className="mb-2 flex justify-center">
  <Image
    src="/logo_tracksphere.png"
    alt="TrackSphere logo"
    width={931}
    height={114}
    className="w-full max-w-xl object-contain"
    priority
  />
</div>

  <div className="space-y-4 text-left">
    <div>
      <label
        htmlFor="usuario"
        className="mb-2 block text-sm font-medium text-zinc-700"
      >
        Usuario
      </label>

      <input
        id="usuario"
        className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
        placeholder="Usuario"
        value={usuario}
        onChange={(e) => onUsuarioChange(e.target.value)}
        autoComplete="username"
      />
    </div>

    <div>
      <label
        htmlFor="pwd"
        className="mb-2 block text-sm font-medium text-zinc-700"
      >
        Contraseña
      </label>

      <input
        id="pwd"
        className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
        placeholder="Contraseña"
        type="password"
        value={pwd}
        onChange={(e) => onPwdChange(e.target.value)}
        onKeyDown={handleKeyPress}
        autoComplete="current-password"
      />
    </div>
  </div>

  <button
    type="button"
    onClick={onSubmit}
    disabled={loadingLogin}
    className="mt-8 h-11 w-full rounded-full bg-sky-600 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {loadingLogin ? 'Ingresando…' : 'Entrar'}
  </button>

  {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
</section>
  );
}
