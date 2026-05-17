"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  GrupoSelector,
  type GrupoOption,
} from "@/app/(dashboard)/GrupoSelector";
import { TablaAlumnos } from "@/app/(dashboard)/TablaAlumnos";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

// --- TIPOS Y FUNCIONES AUXILIARES ---
type RowData = Record<string, unknown>;

type ColumnDef<T> = {
  id: string;
  header: string;
  accessorKey?: string;
  priority?: number;
  render?: (row: T) => React.ReactNode;
};

const HIDDEN_COLUMN_IDS = new Set<string>([
  "estatus_metrica",
  "AP",
  "AM",
  "NOMBRE",
  "SESION",
  "id_usuario",
  "ind_terminado",
  "estatus_190",
  "estatus_registrado",
]);

const RESUMEN_PDF_URL = "https://mistalentos.mx/FORMATOS/Talentos_";

function handleDescargarResumen(row: RowData) {
  const idUser = row["id_usuario"] ?? row["ID_USUARIO"];
  if (idUser === undefined || idUser === null || String(idUser).trim() === "")
    return;
  const url = `${RESUMEN_PDF_URL}${encodeURIComponent(String(idUser).trim())}.pdf`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function renderNombreCompleto(row: RowData) {
  const nombre = row["NOMBRE"] ?? row["Nombre"];
  const ap = row["AP"] ?? "";
  const am = row["AM"] ?? "";
  return [nombre, ap, am].filter(Boolean).join(" ").trim();
}

function buildColumns(
  rows: RowData[],
  defaults: ColumnDef<RowData>[],
  hidden: Set<string>,
): ColumnDef<RowData>[] {
  const fromConfig: ColumnDef<RowData>[] = defaults
    .map((col) => ({ ...col, accessorKey: col.id }))
    .filter((col) => !hidden.has(col.id));

  const existingIds = new Set(fromConfig.map((col) => col.id));
  const extraKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const extraColumns: ColumnDef<RowData>[] = extraKeys
    .filter((key) => !existingIds.has(key) && !hidden.has(key))
    .map((key) => ({
      id: key,
      header: key,
      accessorKey: key,
      priority: 999,
    }));

  return [...fromConfig, ...extraColumns];
}

// --- PROCESO DE EXPORTACIÓN A EXCEL ---
// Filtra las columnas exportables para el Excel:
// - Excluye la columna de descarga de resumen PDF
// - Excluye la columna de acciones
// - Excluye cualquier columna que tenga una función render personalizada
// Esto asegura que solo se exporten columnas con datos planos y legibles.
const EXPORTABLE_COLUMNS = new Set<string>([
  "GRUPO",
  "NOMBRE_COMPLETO",
  "USUARIO",
  "PWD",
  "CORREO",
  "FECHA_REGISTRO",
  "METRICA",
  "TEST_190",
  "TEST_FINAL",
]);

export default function UsuariosPage() {
  // 1. Estados para los datos (Extraídos de tu app/page.tsx)
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [groups, setGroups] = useState<GrupoOption[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [rows, setRows] = useState<RowData[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Recuperar el token (Si lo guardaste en localStorage o similar al loguear)
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR check
    const savedToken = localStorage.getItem("auth_token"); // Usa la misma clave que en app/(auth)/page.tsx
    if (savedToken) {
      setToken(savedToken);
    }
    setIsMounted(true);
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

  // 4. Carga de filas (Alumnos)
  const loadRows = useCallback(
    async (grupo?: string) => {
      if (!token) return;
      try {
        setLoadingRows(true);
        setError(null);
        const grupoNormalizado = String(grupo ?? "").trim();
        const response = await fetch("/api/alumnos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            grupoNormalizado ? { grupo: grupoNormalizado } : {},
          ),
        });
        const data = await response.json();
        setRows(data?.data || []);
      } catch (err) {
        setError("Error al cargar alumnos");
      } finally {
        setLoadingRows(false);
      }
    },
    [token],
  );

  // 5. Manejadores de eventos
  const handleGroupChange = (value: string) => {
    setSelectedGroup(value);
  };

  const handleSearchClick = () => {
    void loadRows(selectedGroup.trim());
  };

  const handleClearClick = () => {
    setSelectedGroup("");
    setError(null);
    void loadRows();
  };

  useEffect(() => {
    if (!token) return;
    void loadRows();
  }, [token, loadRows]);

  const baseColumns = useMemo<ColumnDef<RowData>[]>(
    () => [
      { id: "GRUPO", header: "Grupo", priority: 1 },
      {
        id: "NOMBRE_COMPLETO",
        header: "Nombre completo",
        priority: 2,
        render: renderNombreCompleto,
      },
      { id: "USUARIO", header: "Usuario", priority: 3 },
      { id: "PWD", header: "Contraseña", priority: 4 },
      { id: "CORREO", header: "Correo", priority: 5 },
      { id: "FECHA_REGISTRO", header: "Fecha registro", priority: 6 },
      { id: "METRICA", header: "Métrica", priority: 7 },
      { id: "TEST_190", header: "Test 190", priority: 8 },
      { id: "TEST_FINAL", header: "Test final", priority: 9 },
      {
        id: "DESCARGAR_RESUMEN",
        header: "Descargar resumen",
        priority: 10,
        render: (row: RowData) => {
          const raw = row["ind_terminado"];
          const terminado = raw === 1 || raw === "1" || raw === true;
          if (!terminado) return null;
          return (
            <button
              type="button"
              className="rounded-md border border-sky-600 bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-500"
              onClick={() => handleDescargarResumen(row)}
            >
              Descargar
            </button>
          );
        },
      },
    ],
    [],
  );

  const columns: ColumnDef<RowData>[] = useMemo(
    () => buildColumns(rows, baseColumns, HIDDEN_COLUMN_IDS),
    [rows, baseColumns],
  );

  const exportableColumns = useMemo(
    () =>
      columns.filter(
        (column) =>
          column.id !== "DESCARGAR_RESUMEN" &&
          column.id !== "Acciones" &&
          !("render" in column && typeof column.render === "function"),
      ),
    [columns],
  );

  const handleExportExcel = useCallback(() => {
    if (rows.length === 0) {
      setError("No hay datos para exportar."); // Validación: No exportar si no hay datos.
      return;
    }

    // Transformamos las filas en un formato adecuado para el archivo Excel.
    const exportRows = rows.map((row) => {
      const record: Record<string, unknown> = {};
      for (const column of exportableColumns) {
        record[column.header] = row[column.id] ?? ""; // Asignamos valores por columna.
      }
      return record;
    });

    // Creamos una hoja de cálculo y un libro de trabajo.
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");

    // Generamos un nombre de archivo seguro basado en el grupo seleccionado.
    const normalizedGroup = selectedGroup.trim();
    const safeGroup = normalizedGroup
      ? normalizedGroup.replace(/[^a-zA-Z0-9_-]+/g, "_")
      : "todos";
    const fileName = `usuarios_${safeGroup}.xlsx`;

    // Escribimos el archivo Excel y lo descargamos.
    XLSX.writeFile(workbook, fileName);
  }, [rows, exportableColumns, selectedGroup]);

  if (!isMounted) return <div className="p-8">Cargando...</div>;
  if (!token)
    return <div className="p-8">No autorizado. Por favor, inicia sesión.</div>;

  return (
    <div className="mx-auto w-full max-w-[96rem] px-4 py-8 flex flex-col gap-6 bg-white min-h-screen">
      <header className="space-y-2 border-b pb-4">
        <h1 className="text-2xl font-bold text-zinc-800">
          Consulta de Usuarios
        </h1>
        <p className="text-sm text-zinc-500">
          Módulo de administración de talentos
        </p>
      </header>

      <GrupoSelector
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectedGroupChange={handleGroupChange}
        onSearch={handleSearchClick}
        onClear={handleClearClick}
        loadingGroups={loadingGroups}
        loadingRows={loadingRows}
        error={error}
      />

      <section className="space-y-4">
        <div className="bg-zinc-50 p-4 rounded-lg border">
          <div className="mb-4 flex items-center gap-2">
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
