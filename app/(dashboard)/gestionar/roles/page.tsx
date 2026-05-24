"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RolesFormModal } from "../roles/RolesFormModal";
import { TablaAlumnos } from "@/app/(dashboard)/TablaAlumnos";
import { type ComboboxOption } from "@/components/ui/search-combobox";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "../../DataTablePriority";
import * as XLSX from "xlsx";

type RowData = Record<string, any>;

type BotonEditarProps = {
  row: RowData;
  token: string;
  loadTipoPuntos: (query: string) => Promise<ComboboxOption[]>;
  onSuccess: (row: RowData, id: string | number) => void;
};

type BotonEliminarProps = {
  row: RowData;
  token: string;
  onSuccess: (row: RowData, id: string | number) => void;
};

interface BotonInsertarProps {
  token: string;
  disabled?: boolean;
  loadTipoPuntos: (query: string) => Promise<ComboboxOption[]>;
  onSuccess: (idInsertado: string | number) => void;
}

const loadComboGenerico = async (
  token: string,
  tl: string,
  columnas: string[],
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch("/api/comboGenerico", {
    method: "POST",
    headers,
    body: JSON.stringify({ tl, columnas }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMsg =
      typeof data?.error === "string" ? data.error : "Error al cargar combos";
    throw new Error(apiMsg);
  }

  return Array.isArray(data?.data) ? data.data : [];
};

const createTipoPuntoLoader = (token: string) => {
  return async (query: string) => {
    const options = (await loadComboGenerico(token, "cat_tipo_punto", [
      "id",
      "tipo",
    ])) as ComboboxOption[];

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) => {
      return [option.label, option.value, option.id].some((candidate) =>
        String(candidate).toLowerCase().includes(normalizedQuery),
      );
    });
  };
};

// --- COMPONENTE BOTÓN EDITAR ---
// Agregamos 'onSuccess' a las propiedades para que la tabla se entere del cambio

function BotonEditar({
  row,
  token,
  loadTipoPuntos,
  onSuccess,
}: BotonEditarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-500"
        onClick={() => setOpen(true)}
      >
        Editar
      </button>

      <RolesFormModal
        mode="edit"
        open={open}
        onOpenChange={setOpen}
        token={token}
        loadTipoPuntos={loadTipoPuntos}
        row={row}
        onSuccess={(id) => onSuccess(row, id)}
      />
    </>
  );
}

//COMPONENTE BOTON INSERTAR
function BotonInserta({
  token,
  disabled,
  loadTipoPuntos,
  onSuccess,
}: BotonInsertarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-500"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        + Agregar
      </button>

      <RolesFormModal
        mode="insert"
        open={open}
        onOpenChange={setOpen}
        token={token}
        loadTipoPuntos={loadTipoPuntos}
        onSuccess={(id) => onSuccess(id)}
      />
    </>
  );
}

//FIN BOTON INSERTAR

// --- COMPONENTE BOTÓN EDITAR ---
// Agregamos 'onSuccess' a las propiedades para que la tabla se entere del cambio

function BotonEliminar({ row, token, onSuccess }: BotonEliminarProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actualizar valores cuando el row cambie (después de edición exitosa)
  useEffect(() => {
    if (open) return; // No actualizar mientras está abierto el modal
  }, [row]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError(null);

      let datos = {
        tl: "dhl_roles",

        id: row.id,
      };

      const response = await fetch("/api/eliminar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const apiMsg =
          typeof resData?.error === "string" ? resData.error : null;
        throw new Error(apiMsg || "Error en la eliminación.");
      }

      // El backend devuelve { id: 5023 } (solo el ID del registro eliminado)
      const modifiedId = resData?.id;

      setOpen(false);

      // Notificar al padre para que recargue el registro eliminado
      onSuccess(row, modifiedId ?? row.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-500"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
      >
        Eliminar
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle className="text-base">Eliminar Rol</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar el rol con ID{" "}
              <strong>{row.id}</strong>?
            </p>
            {error && (
              <div className="rounded-md bg-red-50 p-2 mt-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="h-8 px-3 text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loading}
              className="h-8 px-3 text-xs bg-red-600 hover:bg-red-500"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function RolesPage() {
  // 1. Estados para los datos (Extraídos de tu app/page.tsx)
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [rows, setRows] = useState<RowData[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Recuperar el token (Si lo guardaste en localStorage o similar al loguear)
  useEffect(() => {
    setIsMounted(true);
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) setToken(savedToken);
  }, []);

  // 4. Carga de filas (Puntos)
  const loadRows = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingRows(true);
      setError(null);
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const apiMsg =
          typeof data?.error === "string"
            ? data.error
            : "Error al cargar roles";
        throw new Error(apiMsg);
      }

      const nextRows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.rows)
          ? data.rows
          : [];

      setRows(nextRows);
    } catch (err: any) {
      setRows([]);
      setError(err?.message || "Error al cargar roles");
    } finally {
      setLoadingRows(false);
    }
  }, [token]);

  const handleMutationSuccess = useCallback(() => {
    void loadRows();
  }, [loadRows]);

  const loadTipoPuntos = useMemo(
    () => createTipoPuntoLoader(token || ""),
    [token],
  );

  const columns = useMemo<ColumnDef<RowData>[]>(
    () => [
      { id: "ROL", header: "Rol", priority: 1 },

      {
        id: "Acciones",
        header: "Acciones",
        priority: 2,
        render: (row: RowData) => (
          <div className="flex justify-center gap-1">
            <BotonEditar
              row={row}
              token={token || ""}
              loadTipoPuntos={loadTipoPuntos}
              onSuccess={handleMutationSuccess}
            />
            <BotonEliminar
              row={row}
              token={token || ""}
              onSuccess={handleMutationSuccess}
            />
          </div>
        ),
      },
    ],
    [token, loadTipoPuntos, handleMutationSuccess],
  ); // Se recalcula si cambian las filas

  const exportableColumns = useMemo(
    () =>
      columns.filter(
        (column) =>
          column.id !== "Acciones" && typeof column.render !== "function",
      ),
    [columns],
  );

  const handleExportExcel = useCallback(() => {
    if (rows.length === 0) {
      setError("No hay datos para exportar.");
      return;
    }

    const exportRows = rows.map((row) => {
      const record: Record<string, unknown> = {};
      for (const column of exportableColumns) {
        record[column.header] = row[column.id] ?? "";
      }
      return record;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Puntos");

    const fileName = "roles.xlsx";

    XLSX.writeFile(workbook, fileName);
  }, [rows, exportableColumns]);

  useEffect(() => {
    if (!token) return;
    void loadRows();
  }, [token, loadRows]);

  if (!isMounted) return <div className="p-8">Cargando...</div>;
  if (!token)
    return <div className="p-8">No autorizado. Por favor, inicia sesión.</div>;

  //TERMINO

  return (
    <main className="min-h-screen bg-[#f5f2e8] px-3 py-4 text-zinc-900 md:px-6">
      <section className="mx-auto flex w-full max-w-[1560px] flex-col gap-4">
        <header className="space-y-1 px-2">
          <h1 className="text-[28px] font-semibold leading-none tracking-tight text-zinc-700">
            Consulta de roles
          </h1>
          <p className="text-sm text-zinc-500">
            Módulo de administración de roles
          </p>
        </header>

        <div className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-2">
            <BotonInserta
              token={token || ""}
              disabled={loadingRows}
              loadTipoPuntos={loadTipoPuntos}
              onSuccess={handleMutationSuccess}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleExportExcel}
              disabled={loadingRows}
              className="h-8 px-3 text-xs"
            >
              Exportar Excel
            </Button>
          </div>
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">
            Listado de Roles
          </h2>
          <TablaAlumnos columns={columns} data={rows} headerVariant="pill" />
        </div>
      </section>
    </main>
  );
}
