"use client";

import * as React from "react";
import { DataTablePriority } from "../components/DataTablePriority";

type GrupoOption = {
  id: string;
  label: string;
  value: string;
};

type RowData = Record<string, unknown>;

const DEFAULT_COLUMNS = [
  { id: "GRUPO", header: "Grupo", priority: 1 },
  { id: "USUARIO", header: "Usuario", priority: 2 },
  { id: "NOMBRE", header: "Nombre", priority: 3 },
  { id: "AP", header: "AP", priority: 4 },
  { id: "AM", header: "AM", priority: 5 },
  { id: "CORREO", header: "Correo", priority: 6 },
  { id: "FECHA_REGISTRO", header: "Fecha registro", priority: 7 },
  { id: "SESION", header: "Sesion", priority: 8 },
  { id: "TEST_190", header: "Test 190", priority: 9 },
  { id: "TEST_FINAL", header: "Test final", priority: 10 },
  { id: "METRICA", header: "Metrica", priority: 11 },
  { id: "estatus_registrado", header: "Estatus registrado", priority: 12 },
];

const buildColumns = (rows: RowData[]) => {
  const fromConfig = DEFAULT_COLUMNS.map((col) => ({
    ...col,
    accessorKey: col.id,
  }));

  const existingIds = new Set(fromConfig.map((col) => col.id));
  const extraKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const extraColumns = extraKeys
    .filter((key) => !existingIds.has(key))
    .map((key) => ({
      id: key,
      header: key,
      accessorKey: key,
      priority: 999,
    }));

  return [...fromConfig, ...extraColumns];
};

export default function Home() {
  const [groups, setGroups] = React.useState<GrupoOption[]>([]);
  const [selectedGroup, setSelectedGroup] = React.useState("");
  const [rows, setRows] = React.useState<RowData[]>([]);
  const [usuario, setUsuario] = React.useState("u1");
  const [pwd, setPwd] = React.useState("p1234");
  const [token, setToken] = React.useState("");
  const [loadingLogin, setLoadingLogin] = React.useState(false);
  const [loadingGroups, setLoadingGroups] = React.useState(false);
  const [loadingRows, setLoadingRows] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const columns = React.useMemo(() => buildColumns(rows), [rows]);
  const isAuthenticated = Boolean(token);

  React.useEffect(() => {
    if (!token) {
      setGroups([]);
      return;
    }
    const loadGroups = async () => {
      try {
        setLoadingGroups(true);
        setError(null);
        const response = await fetch("/api/grupos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("No se pudieron cargar los grupos.");
        }
        const data = await response.json();
        setGroups(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar los grupos."
        );
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroups();
  }, [token]);

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
      if (!response.ok) {
        throw new Error("No se pudo iniciar sesion.");
      }
      const data = await response.json();
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
      setToken(String(tokenValue));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al iniciar sesion."
      );
    } finally {
      setLoadingLogin(false);
    }
  };

  const loadRows = async (grupo: string) => {
    if (!grupo) return;
    try {
      setLoadingRows(true);
      setError(null);
      const response = await fetch("/api/alumnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ grupo }),
      });
      if (!response.ok) {
        throw new Error("No se pudieron cargar los alumnos.");
      }
      const data = await response.json();
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar los alumnos."
      );
    } finally {
      setLoadingRows(false);
    }
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
          <section className="w-full rounded-2xl bg-white px-10 py-12 shadow-sm">
            <div className="flex flex-col items-center gap-6 text-center">
              <img
                src="/logo_nuevo.jpeg"
                alt="Mistalentos"
                className="h-12 w-auto"
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
              <input
                className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
                placeholder="Usuario"
                value={usuario}
                onChange={(event) => setUsuario(event.target.value)}
              />

              <label className="block text-sm font-medium text-zinc-700">
                Contrasena
              </label>
              <input
                className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/15"
                placeholder="Contrasena"
                type="password"
                value={pwd}
                onChange={(event) => setPwd(event.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loadingLogin}
              className="mt-8 h-11 w-full rounded-full bg-sky-600 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingLogin ? "Ingresando..." : "Entrar"}
            </button>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
              <label className="text-sm font-medium text-zinc-700">Grupo</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
                  value={selectedGroup}
                  onChange={(event) => setSelectedGroup(event.target.value)}
                  disabled={loadingGroups}
                >
                  <option value="">Seleccionar grupo</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => loadRows(selectedGroup)}
                  disabled={!selectedGroup || loadingRows}
                  className="h-10 rounded-md border border-zinc-200 bg-zinc-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingRows ? "Cargando..." : "Buscar"}
                </button>
              </div>
              {loadingGroups && (
                <p className="text-xs text-zinc-500">Cargando grupos...</p>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </section>

            <section className="rounded-lg border border-zinc-200 bg-white p-4">
              <DataTablePriority columns={columns} data={rows} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
