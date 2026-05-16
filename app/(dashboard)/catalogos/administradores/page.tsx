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
import { TablaAlumnos } from "@/app/(dashboard)/TablaAlumnos";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type RowData = Record<string, any>;

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
  onSuccess: (row: RowData, idModificado: string | number) => void;
}

// --- COMPONENTE BOTÓN EDITAR ---
// Agregamos 'onSuccess' a las propiedades para que la tabla se entere del cambio

function BotonEditar({ row, token, onSuccess }: BotonEditarProps) {
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

  // Actualizar valores cuando el row cambie (después de edición exitosa)
  useEffect(() => {
    if (open) return; // No actualizar mientras está abierto el modal
    setValorCorreo(String(row.correo || ""));
    setValorUsuario(String(row.usuario || ""));
    setValorPassword(String(row.password || ""));
    setValorNombre(String(row.nombre || ""));
    setValorApellidoPaterno(String(row.apellidoPaterno || ""));
    setValorApellidoMaterno(String(row.apellidoMaterno || ""));
    console.log("🔄 BotonEditar: Updated local state from row prop");
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

    try {
      setLoading(true);
      setError(null);

      let datos = {
        tl: "cat_user",
        indicador_id_user_prov_ase: 1,
        id: row.id,
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

      console.log("✅ Edit successful. Response:", resData);

      // El backend devuelve { id: 5023 } (solo el ID del registro modificado)
      const modifiedId = resData?.id;

      console.log(
        "📝 Modified ID extracted:",
        modifiedId,
        "Type:",
        typeof modifiedId,
      );

      if (!modifiedId && modifiedId !== 0) {
        console.warn("⚠️ No ID in response, using original row ID:", row.id);
      }

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
        className="rounded-md border border-sky-600 bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-500"
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
            <DialogTitle>Editar Administrador</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  ID Registro
                </label>
                <p className="text-sm font-medium">{row.id}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Correo
                </label>
                <Input
                  value={valorCorreo}
                  onChange={(e) => setValorCorreo(e.target.value)}
                  placeholder="correo@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Usuario
                </label>
                <Input
                  value={valorUsuario}
                  onChange={(e) => setValorUsuario(e.target.value)}
                  placeholder="usuario"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Contraseña
                </label>
                <Input
                  type="password"
                  value={valorPassword}
                  onChange={(e) => setValorPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Nombre
                </label>
                <Input
                  value={valorNombre}
                  onChange={(e) => setValorNombre(e.target.value)}
                  placeholder="Nombre"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Apellido Paterno
                </label>
                <Input
                  value={valorApellidoPaterno}
                  onChange={(e) => setValorApellidoPaterno(e.target.value)}
                  placeholder="Apellido paterno"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Apellido Materno
                </label>
                <Input
                  value={valorApellidoMaterno}
                  onChange={(e) => setValorApellidoMaterno(e.target.value)}
                  placeholder="Apellido materno"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
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

  // Recarga solo el registro modificado desde el backend
  const reloadModifiedRecord = useCallback(
    async (recordId: string | number) => {
      // Normalizar el ID para comparación
      const normalizedRecordId = String(recordId ?? "").trim();
      console.log(
        "🔄 Reloading record ID:",
        recordId,
        "(normalized:",
        normalizedRecordId,
        ") Group:",
        selectedGroup,
      );

      if (!token || !selectedGroup) {
        console.warn("Missing token or selectedGroup");
        return;
      }

      try {
        const response = await fetch("/api/admins", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ grupo: selectedGroup.trim() }),
        });

        console.log("📡 Response status:", response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Response not ok:", errorText);
          return;
        }

        const data = await response.json();
        console.log("📦 Full response:", data);

        // La estructura de /api/admins es { data: rows }
        let allAdmins = data?.data || [];

        // Si allAdmins es vacío, intenta otras estructuras comunes
        if (!Array.isArray(allAdmins) || allAdmins.length === 0) {
          allAdmins = Array.isArray(data) ? data : [];
          console.log("⚠️ Fallback to direct array:", allAdmins);
        }

        console.log("👥 All admins (", allAdmins.length, "):", allAdmins);

        // Buscar el registro modificado con comparación normalizada
        const updatedRecord = allAdmins.find((r: RowData) => {
          const rId = String(r.id ?? "").trim();
          const matches = rId === normalizedRecordId;
          if (!matches) {
            console.log(`  - ID ${rId} !== ${normalizedRecordId}`);
          }
          return matches;
        });

        console.log("🔍 Updated record found:", updatedRecord);

        if (updatedRecord) {
          console.log(
            "✅ Updating table with new record data. Correo:",
            updatedRecord.correo,
          );
          // Reemplazar solo ese registro en la tabla
          setRows((prevRows) => {
            const updated = prevRows.map((r) => {
              const match = String(r.id ?? "").trim() === normalizedRecordId;
              return match ? updatedRecord : r;
            });
            console.log("📊 New rows state (", updated.length, " records)");
            return updated;
          });
        } else {
          console.warn(
            `❌ Updated record not found. Looking for normalized ID: ${normalizedRecordId}`,
          );
          console.warn(
            "Available IDs:",
            allAdmins.map((r: RowData) => ({
              id: r.id,
              normalized: String(r.id ?? "").trim(),
            })),
          );
        }
      } catch (err) {
        console.error("❌ Error al recargar registro modificado:", err);
      }
    },
    [token, selectedGroup],
  );

  // Actualiza solo la fila editada sin recargar toda la tabla.
  const applyEditLocally = useCallback(
    (editedRow: RowData, idModificado: string | number) => {
      console.log("🎯 applyEditLocally called with ID:", idModificado);
      // El backend devuelve el ID del registro modificado
      reloadModifiedRecord(idModificado);
    },
    [reloadModifiedRecord],
  );

  const columns = useMemo(
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
        id: "Editar",
        header: "Acción",
        priority: 9,
        render: (row: RowData) => (
          <BotonEditar
            row={row}
            token={token || ""}
            onSuccess={applyEditLocally}
          />
        ),
      },
    ],
    [token, applyEditLocally],
  ); // Se recalcula si cambian las filas

  const handleLimpiarFiltros = () => {
    // Resetea el valor del selector
    setRows([]); // Vacía la tabla de resultados
    setError(null); // Limpia posibles errores previos
    setSelectedGroup(""); // limpia el combo/input
  };

  // 2. Recuperar el token (Si lo guardaste en localStorage o similar al loguear)
  useEffect(() => {
    setIsMounted(true);
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) setToken(savedToken);
  }, []);

  // 3. Lógica de carga de grupos (Tu misma función de app/page.tsx)
  useEffect(() => {
    if (!token) return;
    const loadGroups = async () => {
      try {
        setLoadingGroups(true);
        const response = await fetch("/api/grupos", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        // Aquí usas tu función normalizeClientGroups que ya tienes
        setGroups(data?.data || []);
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
    async (grupo: string) => {
      if (!token) return;
      try {
        setLoadingRows(true);
        setError(null);
        const response = await fetch("/api/admins", {
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
          const grupo = selectedGroup.trim();
          if (grupo) void loadRows(grupo);
        }}
        onClear={handleLimpiarFiltros}
        loadingGroups={loadingGroups}
        loadingRows={loadingRows}
        error={error}
      />

      <section className="space-y-4">
        <div className="bg-zinc-50 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">
            Listado de Alumnos
          </h2>
          <TablaAlumnos columns={columns} data={rows} />
        </div>
      </section>
    </div>
  );
}
