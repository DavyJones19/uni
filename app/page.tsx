"use client";
// Directiva de Next.js: este módulo es un Client Component (React en el navegador).
// Sin "use client" no podrías usar useState, useEffect ni eventos de usuario aquí.

import * as React from "react";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { GrupoSelector, type GrupoOption } from "@/app/(dashboard)/GrupoSelector";
import { TablaAlumnos } from "@/app/(dashboard)/TablaAlumnos";
import { LoginForm } from "@/components/LoginForm";
import { Navbar } from "@/components/navbar";

// Record<string, unknown> = objeto con claves string y valores de cualquier tipo (desconocido).
type RowData = Record<string, unknown>;



// Normaliza lo que venga del fetch de grupos (strings, números u objetos) al tipo GrupoOption.

// Componente de página por defecto en Next (App Router): se muestra en la ruta "/".
export default function Home() {
  const [token, setToken] = React.useState("");
  const [usuario, setUsuario] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [loadingLogin, setLoadingLogin] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isAuthenticated = Boolean(token);

  const handleLogin = async () => {
    try {
      setLoadingLogin(true);
      setError(null);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Usuario: usuario, Pwd: pwd }),
      });
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) throw new Error(data?.error || "Error al iniciar sesión");

      const tokenValue =
        data?.token ||
        data?.Token ||
        data?.access_token ||
        data?.accessToken ||
        data?.data?.token ||
        "";
      if (!tokenValue) throw new Error("La API no devolvió un token.");

      const tokenStr = String(tokenValue);
      setToken(tokenStr);
      localStorage.setItem("auth_token", tokenStr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setLoadingLogin(false);
    }
  };
 
  return (
    <>
      {isAuthenticated && <Navbar />}
      
      <main className={`min-h-screen bg-white ${!isAuthenticated ? "flex items-center justify-center" : ""}`}>
        
        {!isAuthenticated ? (
          /* PANTALLA DE LOGIN */
          <div className="max-w-md w-full px-4">
            <LoginForm
              usuario={usuario}
              pwd={pwd}
              onUsuarioChange={setUsuario}
              onPwdChange={setPwd}
              onSubmit={handleLogin}
              loadingLogin={loadingLogin}
              error={error}
            />
          </div>
        ) : (
          /* PANTALLA DE BIENVENIDA (Post-Login) */
          <div className="w-full flex flex-col items-center pt-20 animate-in fade-in duration-1000">
            {/* Título Dorado */}
            <h1 className="text-[#FFC400] text-6xl md:text-8xl font-bold mb-12 uppercase tracking-tight">
              BIENVENIDO
            </h1>

            {/* Imagen del Rompecabezas */}
           <div className="relative w-full max-w-xl aspect-square">
  <Image
    src="/logo_talent_mejorada.png"
    alt="Bienvenida Mistalentos"
    fill
    className="object-contain"
    priority
  />
</div>
            
           
          </div>
        )}
      </main>
    </>
  );
}