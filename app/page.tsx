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
  const [loadingGroups, setLoadingGroups] = React.useState(false);
  const [loadingRows, setLoadingRows] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const columns = React.useMemo(() => buildColumns(rows), [rows]);

  React.useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoadingGroups(true);
        setError(null);
        const response = await fetch("/api/grupos");
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
  }, []);

  const loadRows = async (grupo: string) => {
    if (!grupo) return;
    try {
      setLoadingRows(true);
      setError(null);
      const response = await fetch("/api/alumnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Consulta de alumnos</h1>
          <p className="text-sm text-zinc-600">
            Selecciona un grupo y carga los alumnos desde la API externa.
          </p>
        </header>

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
      </div>
    </main>
  );
}
