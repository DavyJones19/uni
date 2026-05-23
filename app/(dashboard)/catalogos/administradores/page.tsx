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
import {
  GrupoSelector,
  type GrupoOption,
} from "@/app/(dashboard)/GrupoSelector";
import { SearchCombobox } from "@/components/ui/search-combobox";
import { TablaAlumnos } from "@/app/(dashboard)/TablaAlumnos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

type RowData = Record<string, any>;

const extractInsertedId = (payload: any): string | number | null => {
  if (payload === null || payload === undefined) return null;

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const nested = extractInsertedId(item);
      if (nested !== null && nested !== undefined && nested !== "")
        return nested;
    }
    return null;
  }

  if (typeof payload === "object") {
    const directId = payload.id ?? payload.ID;
    if (directId !== null && directId !== undefined && directId !== "") {
      return directId;
    }

    const nestedSources = [
      payload.data,
      payload.result,
      payload.resultado,
      payload.rows,
      payload.JsonData,
    ];

    for (const source of nestedSources) {
      const nested = extractInsertedId(source);
      if (nested !== null && nested !== undefined && nested !== "")
        return nested;
    }
  }

  return null;
};

type ColumnDef<T> = {
  id: string;
  header: string;
  accessorKey?: string;
  priority?: number;
  render?: (row: T) => React.ReactNode;
};

interface BotonEditarProps {
  row: RowData;
  token: string;
  groups: GrupoOption[];
  onSuccess: (row: RowData, idModificado: string | number) => void;
}
interface BotonEliminarProps {
  row: RowData;
  token: string;
  onSuccess: (row: RowData, idModificado: string | number) => void;
}
interface BotonInsertarProps {
  token: string;
  groups: GrupoOption[];
  disabled?: boolean;
  onSuccess: (idInsertado: string | number) => void;
}
// --- COMPONENTE BOTÓN EDITAR ---
// Agregamos 'onSuccess' a las propiedades para que la tabla se entere del cambio

function BotonEditar({ row, token, groups, onSuccess }: BotonEditarProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorCorreo, setValorCorreo] = useState(String(row.correo || ""));
  const [valorUsuario, setValorUsuario] = useState(String(row.usuario || ""));
  const [valorPassword, setValorPassword] = useState(
    String(row.password || ""),
  );
  const [valorNombre, setValorNombre] = useState(String(row.nombre || ""));
  const [valorApellidoPaterno, setValorApellidoPaterno] = useState(
    String(row.apellidoPaterno || ""),
  );
  const [valorApellidoMaterno, setValorApellidoMaterno] = useState(
    String(row.apellidoMaterno || ""),
  );
  const [valorGrupo, setValorGrupo] = useState(
    String(row.nombreGrupo || row.grupo || ""),
  );
  const [valorGrupoId, setValorGrupoId] = useState(String(row.id_grupo ?? ""));

  // Actualizar valores cuando el row cambie (después de edición exitosa)
  useEffect(() => {
    if (open) return; // No actualizar mientras está abierto el modal
    setValorCorreo(String(row.correo || ""));
    setValorUsuario(String(row.usuario || ""));
    setValorPassword(String(row.password || ""));
    setValorNombre(String(row.nombre || ""));
    setValorApellidoPaterno(String(row.apellidoPaterno || ""));
    setValorApellidoMaterno(String(row.apellidoMaterno || ""));
    setValorGrupo(String(row.nombreGrupo || row.grupo || ""));
    setValorGrupoId(String(row.id_grupo ?? ""));
  }, [row]);

  const handleUpdate = async () => {
    if (!valorCorreo || !valorCorreo.includes("@")) {
      setError("El correo electrónico es obligatorio y debe ser válido.");
      return;
    }

    if (!valorUsuario) {
      setError("El nombre de usuario es obligatorio.");
      return;
    }

    if (!valorPassword) {
      setError("La contraseña es obligatoria.");
      return;
    }

    if (!valorNombre) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!valorApellidoPaterno) {
      setError("El apellido paterno es obligatorio.");
      return;
    }

    if (!valorGrupoId) {
      setError("Selecciona un grupo de la lista.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let datos = {
        tl: "cat_user",
        indicador_id_user_prov_ase: 1,
        id: row.id,
        id_grupo: Number(valorGrupoId),
        id_perfil: 2,
        correo: valorCorreo,
        usuario: valorUsuario,
        password: valorPassword,
        nombre: valorNombre,
        apellido_Paterno: valorApellidoPaterno,
        apellido_Materno: valorApellidoMaterno,
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

      // El backend devuelve { id: 5023 } (solo el ID del registro modificado)
      const modifiedId = resData?.id;

      setOpen(false);

      // Notificar al padre para que recargue el registro modificado
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
        className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-500"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
      >
        Editar
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base">
              Editar Administrador
            </DialogTitle>
          </DialogHeader>
          <div className="gap-3 py-2">
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  ID: {row.id}
                </label>
              </div>

              <div>
                <SearchCombobox
                  label="Grupo"
                  value={valorGrupo}
                  options={groups}
                  onValueChange={(text) => {
                    setValorGrupo(text);
                    setValorGrupoId("");
                  }}
                  onSelect={(option) => {
                    setValorGrupo(option.label);
                    setValorGrupoId(option.id);
                  }}
                  placeholder="Escribe o selecciona un grupo"
                  disabled={loading}
                  inputClassName="h-8 text-xs"
                  loading={loading}
                />
              </div>

              <div>
                <Input
                  value={valorCorreo}
                  onChange={(e) => setValorCorreo(e.target.value)}
                  placeholder="Correo"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Input
                  value={valorUsuario}
                  onChange={(e) => setValorUsuario(e.target.value)}
                  placeholder="Usuario"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Input
                  type="password"
                  value={valorPassword}
                  onChange={(e) => setValorPassword(e.target.value)}
                  placeholder="Contraseña"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Input
                  value={valorNombre}
                  onChange={(e) => setValorNombre(e.target.value)}
                  placeholder="Nombre"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Input
                  value={valorApellidoPaterno}
                  onChange={(e) => setValorApellidoPaterno(e.target.value)}
                  placeholder="Apellido Paterno"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Input
                  value={valorApellidoMaterno}
                  onChange={(e) => setValorApellidoMaterno(e.target.value)}
                  placeholder="Apellido Materno"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-2">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </div>
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
              className="h-8 px-3 text-xs bg-sky-600 hover:bg-sky-500"
            >
              {loading ? "Guardando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

//COMPONENTE BOTON INSERTAR
function BotonInserta({
  token,
  groups,
  disabled,
  onSuccess,
}: BotonInsertarProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorCorreo, setValorCorreo] = useState("");
  const [valorUsuario, setValorUsuario] = useState("");
  const [valorPassword, setValorPassword] = useState("");
  const [valorNombre, setValorNombre] = useState("");
  const [valorApellidoPaterno, setValorApellidoPaterno] = useState("");
  const [valorApellidoMaterno, setValorApellidoMaterno] = useState("");
  const [valorGrupo, setValorGrupo] = useState("");
  const [valorGrupoId, setValorGrupoId] = useState("");

  const handleInsert = async () => {
    if (!valorCorreo || !valorCorreo.includes("@")) {
      setError("El correo electrónico es obligatorio y debe ser válido.");
      return;
    }

    if (!valorUsuario) {
      setError("El nombre de usuario es obligatorio.");
      return;
    }

    if (!valorPassword) {
      setError("La contraseña es obligatoria.");
      return;
    }

    if (!valorNombre) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!valorApellidoPaterno) {
      setError("El apellido paterno es obligatorio.");
      return;
    }

    if (!valorGrupoId) {
      setError("Selecciona un grupo de la lista.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let datos = {
        tl: "cat_user",
        indicador_id_user_prov_ase: 1,
        id_grupo: Number(valorGrupoId),
        id_perfil: 2,
        correo: valorCorreo,
        usuario: valorUsuario,
        password: valorPassword,
        nombre: valorNombre,
        apellido_Paterno: valorApellidoPaterno,
        apellido_Materno: valorApellidoMaterno,
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

      const insertedId = extractInsertedId(resData);

      if (!insertedId) {
        throw new Error("No se recibió el id del registro insertado.");
      }

      setValorCorreo("");
      setValorUsuario("");
      setValorPassword("");
      setValorNombre("");
      setValorApellidoPaterno("");
      setValorApellidoMaterno("");
      setValorGrupo("");
      setValorGrupoId("");
      id_perfil: "2";
      setOpen(false);

      // Notificar al padre para insertar solo la nueva fila en memoria.
      onSuccess(insertedId);
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
        className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-500"
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
            <DialogTitle className="text-base">
              Agregar Administrador
            </DialogTitle>
          </DialogHeader>
          <div className="gap-3 py-2">
            <div className="flex flex-col gap-2">
              <div>
                <SearchCombobox
                  label="Grupo"
                  value={valorGrupo}
                  options={groups}
                  onValueChange={(text) => {
                    setValorGrupo(text);
                    setValorGrupoId("");
                  }}
                  onSelect={(option) => {
                    setValorGrupo(option.label);
                    setValorGrupoId(option.id);
                  }}
                  placeholder="Escribe o selecciona un grupo"
                  disabled={loading}
                  inputClassName="h-8 text-xs"
                  loading={loading}
                />
              </div>

              <div>
                <Input
                  value={valorCorreo}
                  onChange={(e) => setValorCorreo(e.target.value)}
                  placeholder="Correo"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Input
                  value={valorUsuario}
                  onChange={(e) => setValorUsuario(e.target.value)}
                  placeholder="Usuario"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Input
                  type="password"
                  value={valorPassword}
                  onChange={(e) => setValorPassword(e.target.value)}
                  placeholder="Contraseña"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Input
                  value={valorNombre}
                  onChange={(e) => setValorNombre(e.target.value)}
                  placeholder="Nombre"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Input
                  value={valorApellidoPaterno}
                  onChange={(e) => setValorApellidoPaterno(e.target.value)}
                  placeholder="Apellido Paterno"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              <div>
                <Input
                  value={valorApellidoMaterno}
                  onChange={(e) => setValorApellidoMaterno(e.target.value)}
                  placeholder="Apellido Materno"
                  disabled={loading}
                  className="text-xs h-8"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-2">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </div>
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
              onClick={handleInsert}
              disabled={loading}
              className="h-8 px-3 text-xs bg-sky-600 hover:bg-sky-500"
            >
              {loading ? "Guardando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        tl: "cat_user",
        indicador_id_user_prov_ase: 1,
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
            <DialogTitle className="text-base">
              Eliminar Administrador
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas eliminar al administrador con ID{" "}
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

export default function AdminsPage() {
  // 1. Estados para los datos (Extraídos de tu app/page.tsx)
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [groups, setGroups] = useState<GrupoOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [rows, setRows] = useState<RowData[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLimpiarFiltros = () => {
    setError(null);
    setSelectedGroup("");
    void loadRows();
  };

  // 2. Recuperar el token (Si lo guardaste en localStorage o similar al loguear)
  useEffect(() => {
    setIsMounted(true);
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) setToken(savedToken);
  }, []);

  // 3. Lógica de carga de grupos
  useEffect(() => {
    if (!token) return;
    const loadGroups = async () => {
      try {
        setLoadingGroups(true);
        const response = await fetch("/api/grupos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to load grupos");
        const data = await response.json();
        setGroups(Array.isArray(data?.data) ? data.data : []);
      } catch (err) {
        setError("Error al cargar grupos");
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, [token]);

  // 4. Carga de filas (Administradores)
  const loadRows = useCallback(
    async (grupo?: string) => {
      if (!token) return;
      try {
        setLoadingRows(true);
        setError(null);
        const grupoNormalizado = String(grupo ?? "").trim();
        const response = await fetch("/api/admins", {
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
              : "Error al cargar administradores";
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
        setError(err?.message || "Error al cargar administradores");
      } finally {
        setLoadingRows(false);
      }
    },
    [token],
  );

  const handleMutationSuccess = useCallback(() => {
    void loadRows(selectedGroup.trim());
  }, [loadRows, selectedGroup]);

  const columns = useMemo<ColumnDef<RowData>[]>(
    () => [
      { id: "nombreGrupo", header: "Grupo", priority: 1 },
      { id: "usuario", header: "Usuario", priority: 2 },
      { id: "perfil", header: "Perfil", priority: 3 },
      { id: "nombreUsuario", header: "Nombre y apellidos", priority: 4 },
      { id: "correo", header: "Correo", priority: 5 },
      {
        id: "usuariosRegistrados",
        header: "Cantidad de usuarios registrados",
        priority: 6,
      },
      {
        id: "totales",
        header: "Cantidad de usuarios con test concluidos",
        priority: 7,
      },
      {
        id: "parciales",
        header: "Cantidad de usuarios con test parcial",
        priority: 8,
      },
      {
        id: "Acciones",
        header: "Acciones",
        priority: 9,
        render: (row: RowData) => (
          <div className="flex gap-1 -mx-2">
            <BotonEditar
              row={row}
              token={token || ""}
              groups={groups}
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
    [token, groups, handleMutationSuccess],
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Administradores");

    const normalizedGroup = selectedGroup.trim();
    const safeGroup = normalizedGroup
      ? normalizedGroup.replace(/[^a-zA-Z0-9_-]+/g, "_")
      : "todos";
    const fileName = `administradores_${safeGroup}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  }, [rows, exportableColumns, selectedGroup]);

  useEffect(() => {
    if (!token) return;
    void loadRows();
  }, [token, loadRows]);

  if (!isMounted) return <div className="p-8">Cargando...</div>;
  if (!token)
    return <div className="p-8">No autorizado. Por favor, inicia sesión.</div>;

  //TERMINO

  return (
    <div className="mx-auto w-full max-w-[96rem] px-4 py-8 flex flex-col gap-6 bg-white min-h-screen">
      <header className="space-y-2 border-b pb-4">
        <h1 className="text-2xl font-bold text-zinc-800">
          Consulta de administradores
        </h1>
        <p className="text-sm text-zinc-500">
          Módulo de administración de talentos
        </p>
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

      <section className="space-y-4">
        <div className="bg-zinc-50 p-4 rounded-lg border">
          <div className="mb-4 flex items-center gap-2">
            <BotonInserta
              token={token || ""}
              groups={groups}
              disabled={loadingRows}
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
            Listado de Alumnos
          </h2>
          <TablaAlumnos columns={columns} data={rows} />
        </div>
      </section>
    </div>
  );
}
