"use client";
// Directiva de Next.js: este módulo es un Client Component (React en el navegador).
// Sin "use client" no podrías usar useState, useEffect ni eventos de usuario aquí.

import * as React from "react";
import { useState, useEffect } from "react";
// import { GrupoSelector, type GrupoOption } from "../components/GrupoSelector";
import { LoginForm } from "@/components/LoginForm";

// Record<string, unknown> = objeto con claves string y valores de cualquier tipo (desconocido).
type RowData = Record<string, unknown>;

type ColumnDef<T> = {
  id?: string;
  header?: string;
  accessorKey?: string;
  priority?: number;
  render?: (row: T) => React.ReactNode;
};
type GrupoOption = {
  id: string;
  nombre: string;
};

function normalizeClientGroups(data: unknown): GrupoOption[] {
  if (!Array.isArray(data)) return [];
  return data.map((item: unknown) => {
    if (typeof item === "string") {
      return { id: item, nombre: item };
    }
    if (typeof item === "object" && item !== null) {
      const obj = item as Record<string, unknown>;
      return {
        id: String(obj.id || obj.ID || ""),
        nombre: String(obj.nombre || obj.Nombre || obj.name || ""),
      };
    }
    return { id: "", nombre: "" };
  });
}

function renderNombreCompleto(row: RowData) {
  const nombre = row["NOMBRE"] ?? row["Nombre"];
  const ap = row["AP"] ?? "";
  const am = row["AM"] ?? "";
  return [nombre, ap, am].filter(Boolean).join(" ").trim();
}

const RESUMEN_PDF_URL = "https://mistalentos.mx/FORMATOS/Talentos_";

// Normaliza lo que venga del fetch de grupos (strings, números u objetos) al tipo GrupoOption.

// Componente de página por defecto en Next (App Router): se muestra en la ruta "/".
export default function Home() {
  const [groups, setGroups] = React.useState<GrupoOption[]>([]);
  const [selectedGroup, setSelectedGroup] = React.useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rows, setRows] = React.useState<RowData[]>([]);
  const [usuario, setUsuario] = React.useState("u1");
  const [pwd, setPwd] = React.useState("p1234");
  const [token, setToken] = React.useState("");
  const [loadingLogin, setLoadingLogin] = React.useState(false);
  const [loadingGroups, setLoadingGroups] = React.useState(false);
  const [loadingRows, setLoadingRows] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // useMemo: cada tabla tiene su propia lista de columnas a partir del mismo `rows`.

  const isAuthenticated = Boolean(token);

  // useEffect: al montar, recupera token de localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return; // SSR check
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []); // Solo se ejecuta una vez al montar

  // useEffect: efecto secundario tras pintar; aquí carga grupos cuando hay token.
  React.useEffect(() => {
    if (!token) {
      setGroups([]);
      setSelectedGroup("");
      return;
    }
    // Función async = devuelve una Promise; await pausa hasta que termine el fetch.
    const loadGroups = async () => {
      try {
        setLoadingGroups(true);
        setError(null);
        const response = await fetch("/api/grupos", {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los grupos.");
        }
        const data = await response.json();
        setGroups(normalizeClientGroups(data?.data));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar los grupos.",
        );
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroups();
  }, [token]);

  // Manejador del botón Entrar: POST a /api/login (tu backend) que reenvía al login externo.
  const handleLogin = async () => {
    if (!usuario || !pwd) {
      setError("Usuario y password son obligatorios.");
      return;
    }
    try {
      setLoadingLogin(true);
      setError(null);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Usuario: usuario, Pwd: pwd }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const apiMsg = typeof data?.error === "string" ? data.error : null;
        const detail =
          typeof data?.details === "string" ? ` (${data.details})` : "";
        throw new Error(
          apiMsg
            ? `${apiMsg}${detail}`
            : `No se pudo iniciar sesion (${response.status}).`,
        );
      }
      const tokenValue =
        data?.token ||
        data?.Token ||
        data?.access_token ||
        data?.accessToken ||
        data?.data?.token ||
        "";
      if (!tokenValue) {
        throw new Error("La API no devolvio un token.");
      }
      const tokenStr = String(tokenValue);
      setToken(tokenStr);
      localStorage.setItem("auth_token", tokenStr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesion.");
    } finally {
      setLoadingLogin(false);
    }
  };

  // useCallback: memoriza la función para que no cambie en cada render si `token` no cambia.
  const loadRows = React.useCallback(
    async (grupo: string) => {
      const g = grupo.trim();
      if (!g) return;
      try {
        setLoadingRows(true);
        setError(null);
        const response = await fetch("/api/alumnos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ grupo: g }),
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los alumnos.");
        }
        const data = await response.json();
        setRows(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar los alumnos.",
        );
      } finally {
        setLoadingRows(false);
      }
    },
    [token],
  );

  // Al elegir grupo en el <select>, actualiza estado y dispara la carga de alumnos.
  const handleGroupChange = (value: string) => {
    setSelectedGroup(value);
    if (!value.trim()) {
      setRows([]);
    }
  };

  // void loadRows: ignora explícitamente la Promise (fire-and-forget); el estado loading lo cubre.
  const handleSearchClick = () => {
    const v = selectedGroup.trim();
    if (v) void loadRows(v);
  };

  return (
    <main
      className={`min-h-screen bg-zinc-50 text-zinc-900 ${
        isAuthenticated
          ? "px-4 py-8"
          : "flex items-center justify-center px-4 py-10"
      }`}
    >
      <div
        className={`flex w-full flex-col gap-6 ${
          isAuthenticated ? "mx-auto max-w-6xl" : "max-w-md"
        }`}
      >
        {isAuthenticated && (
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold">Consulta de alumnos</h1>
            <p className="text-sm text-zinc-600">
              Selecciona un grupo y carga los alumnos desde la API externa.
            </p>
          </header>
        )}

        {!isAuthenticated ? (
          <LoginForm
            usuario={usuario}
            pwd={pwd}
            onUsuarioChange={setUsuario}
            onPwdChange={setPwd}
            onSubmit={handleLogin}
            loadingLogin={loadingLogin}
            error={error}
          />
        ) : (
          <>
            {modalAbierto && (
              <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
                  <h2 className="text-base font-semibold text-zinc-800">
                    hola
                  </h2>
                  <button
                    type="button"
                    className="mt-4 w-full rounded bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
                    onClick={() => setModalAbierto(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
