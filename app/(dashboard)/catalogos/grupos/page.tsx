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
  onSuccess: (previousGroupName: string, nextGroupName: string) => void;
}

interface BotonInsertarProps {
  token: string;
  disabled?: boolean;
  onSuccess: (nuevoGrupo: string) => void;
}

function BotonEditar({ row, token, onSuccess }: BotonEditarProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getGroupName = useCallback(
    () =>
      String(row.nombre_g ?? row.GRUPO ?? row.grupo ?? row.nombreGrupo ?? ""),
    [row],
  );
  const [valorEditado, setValorEditado] = useState(getGroupName());

  useEffect(() => {
    if (open) return;
    setValorEditado(getGroupName());
  }, [open, getGroupName]);

  const handleUpdate = async () => {
    if (!valorEditado) {
      setError("El campo es obligatorio.");
      return;
    }

    const previousGroupName = getGroupName().trim();
    const nextGroupName = valorEditado.trim();

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
      // Notificamos al padre para recargar la tabla completa.
      onSuccess(previousGroupName, nextGroupName);
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
          setValorEditado(getGroupName());
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

function BotonInserta({ token, disabled, onSuccess }: BotonInsertarProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorNuevo, setValorNuevo] = useState("");

  const handleInsert = async () => {
    const grupo = valorNuevo.trim();
    if (!grupo) {
      setError("El nombre del grupo es obligatorio.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const datos = {
        tl: "nv_grupos",
        nombre_g: grupo,
      };

      const response = await fetch("/api/insertar", {
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
        throw new Error(apiMsg || "Error en la inserción.");
      }

      setOpen(false);
      setValorNuevo("");
      onSuccess(grupo);
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
        disabled={disabled}
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
      >
        + Agregar
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar Grupo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Input
                value={valorNuevo}
                onChange={(e) => setValorNuevo(e.target.value)}
                placeholder="Nombre del grupo"
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
              onClick={handleInsert}
              disabled={loading}
              className="bg-sky-600"
            >
              {loading ? "Guardando..." : "Agregar"}
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
    setError(null); // Limpia posibles errores previos
    void loadRows();
  };
  useEffect(() => {
    setIsMounted(true);
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) setToken(savedToken);
  }, []);

  const loadGroups = useCallback(async () => {
    if (!token) return;
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
  }, [token]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const loadRows = useCallback(
    async (grupo?: string) => {
      if (!token) return;
      try {
        setLoadingRows(true);
        setError(null);
        const grupoNormalizado = String(grupo ?? "").trim();
        const response = await fetch("/api/tabla_grupos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            grupoNormalizado ? { grupo: grupoNormalizado } : {},
          ),
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

  const handleEditSuccess = useCallback(
    (previousGroupName: string, nextGroupName: string) => {
      const currentFilter = selectedGroup.trim();
      const previousName = String(previousGroupName || "").trim();
      const nextName = String(nextGroupName || "").trim();
      const nextFilter =
        previousName && currentFilter === previousName
          ? nextName
          : currentFilter;

      if (previousName && currentFilter === previousName) {
        setSelectedGroup(nextName);
      }

      void loadGroups();
      void loadRows(nextFilter);
    },
    [selectedGroup, loadGroups, loadRows],
  );

  const handleInsertSuccess = useCallback(
    (nuevoGrupo: string) => {
      setSelectedGroup(nuevoGrupo);
      void loadGroups();
      void loadRows(nuevoGrupo);
    },
    [loadGroups, loadRows],
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
            onSuccess={handleEditSuccess}
          />
        ),
      },
    ],
    [token, handleEditSuccess],
  ); // Se recalcula si cambian las filas

  useEffect(() => {
    if (!token) return;
    void loadRows();
  }, [token, loadRows]);

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
          void loadRows(selectedGroup.trim());
        }}
        onClear={handleLimpiarFiltros}
        loadingGroups={loadingGroups}
        loadingRows={loadingRows}
        error={error}
      />
      <section className="bg-zinc-50 p-4 rounded-lg border">
        <div className="mb-4">
          <BotonInserta
            token={token || ""}
            disabled={loadingRows}
            onSuccess={handleInsertSuccess}
          />
        </div>
        <TablaGrupos columns={columns} data={rows} />
      </section>
    </div>
  );
}
