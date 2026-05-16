"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  GrupoSelector,
  type GrupoOption,
} from "@/app/(dashboard)/GrupoSelector";
import { TablaGrupos } from "@/app/(dashboard)/TablaGrupos";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// --- TIPOS ---
type RowData = Record<string, any>; // Usamos any para facilitar el acceso a .id

type ColumnDef<T> = {
  id: string;
  header: string;
  accessorKey?: string;
  priority?: number;
  render?: (row: T) => React.ReactNode;
};

// --- COMPONENTE BOTÓN EDITAR ---
// Agregamos 'onSuccess' a las propiedades para que la tabla se entere del cambio
interface BotonEditarProps {
  row: RowData;
  token: string;
  onSuccess: (row: RowData, nuevoValor: string) => void;
}

function BotonEditar({ row, token, onSuccess }: BotonEditarProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorEditado, setValorEditado] = useState(String(row.nombre_g || ""));

  const handleUpdate = async () => {
    if (!valorEditado) {
      setError("El campo es obligatorio.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let datos = {
        tl: "nv_grupos",
        id: row.id,
        nombre_g: valorEditado,
      };

      const response = await fetch("/api/editar", {
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
        throw new Error(apiMsg || "Error en la actualización.");
      }

      setOpen(false);
      // Notificamos al padre para que actualice la fila localmente
      onSuccess(row, valorEditado);
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
        className="rounded-md border border-sky-600 bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-500"
        onClick={() => {
          setOpen(true);
          setError(null);
          setValorEditado(String(row.nombre_g || ""));
        }}
      >
        Editar
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                ID Registro: {row.id}
              </label>
              <Input
                value={valorEditado}
                onChange={(e) => setValorEditado(e.target.value)}
                placeholder="Ingrese el valor..."
                disabled={loading}
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-sky-600"
            >
              {loading ? "Guardando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function GruposPage() {
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [groups, setGroups] = useState<GrupoOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [rows, setRows] = useState<RowData[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleLimpiarFiltros = () => {
    setSelectedGroup(""); // Resetea el valor del selector
    setRows([]); // Vacía la tabla de resultados
    setError(null); // Limpia posibles errores previos
    // Si tuvieras paginación o filtros de texto adicionales, los reseteas aquí
  };
  useEffect(() => {
    setIsMounted(true);
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) setToken(savedToken);
  }, []);

  useEffect(() => {
    if (!token) return;
    const loadGroups = async () => {
      try {
        setLoadingGroups(true);
        setError(null);
        const response = await fetch("/api/grupos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const apiMsg =
            typeof data?.error === "string"
              ? data.error
              : "Error al cargar grupos";
          throw new Error(apiMsg);
        }
        setGroups(data?.data || []);
      } catch (err: any) {
        setGroups([]);
        setError(err?.message || "Error al cargar grupos");
      } finally {
        setLoadingGroups(false);
      }
    };

    void loadGroups();
  }, [token]);

  // Actualiza solo la fila editada y sincroniza el combo sin recargar toda la tabla.
  const applyEditLocally = useCallback(
    (editedRow: RowData, nuevoValor: string) => {
      const safeNewValue = String(nuevoValor || "").trim();
      if (!safeNewValue) return;

      const rowId = String(
        editedRow?.id ??
          editedRow?.ID ??
          editedRow?.Id ??
          editedRow?.id_grupo ??
          "",
      );
      const previousName = String(
        editedRow?.nombre_g ?? editedRow?.GRUPO ?? editedRow?.grupo ?? "",
      ).trim();

      setRows((prev) =>
        prev.map((r) => {
          const currentId = String(
            r?.id ?? r?.ID ?? r?.Id ?? r?.id_grupo ?? "",
          );
          if (rowId && currentId === rowId) {
            return {
              ...r,
              nombre_g: safeNewValue,
              GRUPO: safeNewValue,
              grupo: safeNewValue,
            };
          }
          if (!rowId && previousName) {
            const currentName = String(
              r?.nombre_g ?? r?.GRUPO ?? r?.grupo ?? "",
            ).trim();
            if (currentName === previousName) {
              return {
                ...r,
                nombre_g: safeNewValue,
                GRUPO: safeNewValue,
                grupo: safeNewValue,
              };
            }
          }
          return r;
        }),
      );

      setGroups((prev) =>
        prev.map((g) => {
          const matchById = rowId && String(g.id) === rowId;
          const matchByName =
            previousName &&
            (g.value === previousName || g.label === previousName);
          if (!matchById && !matchByName) return g;
          return {
            ...g,
            label: safeNewValue,
            value: safeNewValue,
          };
        }),
      );

      setSelectedGroup((prev) => (prev === previousName ? safeNewValue : prev));
    },
    [],
  );

  const loadRows = useCallback(
    async (grupo: string) => {
      if (!token) return;
      try {
        setLoadingRows(true);
        setError(null);
        const response = await fetch("/api/tabla_grupos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ grupo: grupo.trim() }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const apiMsg =
            typeof data?.error === "string"
              ? data.error
              : "Error al cargar filas";
          throw new Error(apiMsg);
        }
        setRows(data?.data || []);
      } catch (err: any) {
        setRows([]);
        setError(err?.message || "Error al cargar filas");
      } finally {
        setLoadingRows(false);
      }
    },
    [token],
  );

  // Definición de columnas dentro del componente para acceder a 'updateLocalRow'
  const columns = useMemo(
    () => [
      { id: "GRUPO", header: "Grupo", priority: 1 },
      { id: "TOTAL", header: "Licencias totales", priority: 2 },
      { id: "TERMINADOS", header: "Licencias terminadas", priority: 5 },
      {
        id: "Editar",
        header: "Acción",
        priority: 10,
        render: (row: RowData) => (
          <BotonEditar
            row={row}
            token={token || ""}
            onSuccess={applyEditLocally}
          />
        ),
      },
    ],
    [rows, token, applyEditLocally],
  ); // Se recalcula si cambian las filas

  if (!isMounted) return <div className="p-8">Cargando...</div>;
  if (!token) return <div className="p-8">No autorizado.</div>;

  return (
    <div className="mx-auto w-full max-w-[96rem] px-4 py-8 flex flex-col gap-6 bg-white min-h-screen">
      <header className="space-y-2 border-b pb-4">
        <h1 className="text-2xl font-bold text-zinc-800">Consulta de grupos</h1>
      </header>

      <GrupoSelector
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectedGroupChange={(v) => setSelectedGroup(v)}
        onSearch={() => {
          const grupo = selectedGroup.trim();
          if (grupo) void loadRows(grupo);
        }}
        onClear={handleLimpiarFiltros}
        loadingGroups={loadingGroups}
        loadingRows={loadingRows}
        error={error}
      />
      <section className="bg-zinc-50 p-4 rounded-lg border">
        <TablaGrupos columns={columns} data={rows} />
      </section>
    </div>
  );
}
