"use client";
// Directiva de Next.js: este módulo es un Client Component (React en el navegador).
// Sin "use client" no podrías usar useState, useEffect ni eventos de usuario aquí.

import * as React from "react";
import { GrupoSelector, type GrupoOption } from "../components/GrupoSelector";
import { LoginForm } from "../components/LoginForm";
import { TablaAlumnos } from "../components/TablaAlumnos";
import type { ColumnDef } from "../components/DataTablePriority";

// Record<string, unknown> = objeto con claves string y valores de cualquier tipo (desconocido).
type RowData = Record<string, unknown>;

function renderNombreCompleto(row: RowData) {
  const nombre = row["NOMBRE"] ?? row["Nombre"];
  const ap = row["AP"] ?? "";
  const am = row["AM"] ?? "";
  return [nombre, ap, am].filter(Boolean).join(" ").trim();
}

const RESUMEN_PDF_URL = "https://mistalentos.mx/FORMATOS/Talentos_";

function handleDescargarResumen(row: RowData) {
  const idUser = row["id_usuario"] ?? row["ID_USUARIO"];
  if (idUser === undefined || idUser === null || String(idUser).trim() === "") {
    console.warn("[Descargar resumen] Falta id_usuario en la fila.");
    return;
  }
  const url = `${RESUMEN_PDF_URL}${encodeURIComponent(String(idUser).trim())}.pdf`;
  window.open(url, "_blank", "noopener,noreferrer");
}

// Tabla 1 — columnas completas (orden visual = priority).
const DEFAULT_COLUMNS: ColumnDef<RowData>[] = [
  { id: "GRUPO", header: "Grupo", priority: 1 },
  {
    id: "NOMBRE_COMPLETO",
    header: "Nombre completo",
    priority: 2,
    render: renderNombreCompleto,
  },


  { id: "USUARIO", header: "Usuario", priority: 3 },
  { id: "PWD", header: "Constraseña", priority: 4 },
  { id: "CORREO", header: "Correo", priority: 5 },
  { id: "FECHA_REGISTRO", header: "Fecha registro", priority: 6 },
  { id: "METRICA", header: "Metrica", priority: 7 },
  { id: "TEST_190", header: "Test 190", priority: 8 },
  { id: "TEST_FINAL", header: "Test final", priority: 9 },
  {
    id: "DESCARGAR_RESUMEN",
    header: "DESCARGAR RESUMEN",
    priority: 10,
    render: (row: RowData) => {
      const raw = row["ind_terminado"];
      const terminado =
        raw === 1 || raw === "1" || raw === true;
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
];

// Tabla 2 — demo: solo grupo y nombre (mismos `rows`, otra plantilla de columnas).
const DEFAULT_COLUMNS_VISTA_SIMPLE: ColumnDef<RowData>[] = [
  { id: "GRUPO", header: "Grupo", priority: 1 },
  {
    id: "NOMBRE_COMPLETO",
    header: "Nombre completo",
    priority: 2,
    render: renderNombreCompleto,
  },
];

// IDs que la API puede enviar pero no queremos mostrar en la tabla (añade aquí los que falten).
const HIDDEN_COLUMN_IDS = new Set<string>(["estatus_metrica","AP","AM","NOMBRE","SESION","estatus_registrado","id_usuario","ind_terminado","estatus_190"]);

// Plantilla de columnas + filas + ocultos; `incluirExtras` en false = solo columnas definidas (útil para la 2ª tabla).
function buildColumns(
  rows: RowData[],
  defaults: ColumnDef<RowData>[],
  hidden: Set<string>,
  incluirExtras = true
) {
  const fromConfig = defaults
    .map((col) => ({
      ...col,
      accessorKey: col.id,
    }))
    .filter((col) => !hidden.has(col.id));

  if (!incluirExtras) {
    return fromConfig;
  }

  const existingIds = new Set(fromConfig.map((col) => col.id));
  const extraKeys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const extraColumns = extraKeys
    .filter((key) => !existingIds.has(key) && !hidden.has(key))
    .map((key) => ({
      id: key,
      header: key,
      accessorKey: key,
      priority: 999,
    }));

  return [...fromConfig, ...extraColumns];
}

// Normaliza lo que venga del fetch de grupos (strings, números u objetos) al tipo GrupoOption.
function normalizeClientGroups(raw: unknown): GrupoOption[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: GrupoOption[] = [];
  for (const item of raw) {
    if (item === null || item === undefined) continue;
    let value = "";
    let label = "";
    if (typeof item === "string" || typeof item === "number") {
      value = String(item).trim();
      label = value;
    } else if (typeof item === "object") {
      const r = item as Record<string, unknown>;
      const candidate =
        r.value ??
        r.Value ??
        r.GRUPO ??
        r.grupo ??
        r.nombre ??
        r.Nombre ??
        r.label;
      value = candidate != null ? String(candidate).trim() : "";
      const labelRaw =
        r.label ?? r.Label ?? r.nombre ?? r.Nombre ?? r.GRUPO ?? candidate;
      label = labelRaw != null ? String(labelRaw).trim() : value;
    }
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push({ id: value, label: label || value, value });
  }
  return out;
}

// Componente de página por defecto en Next (App Router): se muestra en la ruta "/".
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

  // useMemo: cada tabla tiene su propia lista de columnas a partir del mismo `rows`.
  const columns = React.useMemo(
    () => buildColumns(rows, DEFAULT_COLUMNS, HIDDEN_COLUMN_IDS, true),
    [rows]
  );
  const columnsVistaSimple = React.useMemo(
    () => buildColumns(rows, DEFAULT_COLUMNS_VISTA_SIMPLE, HIDDEN_COLUMN_IDS, false),
    [rows]
  );
  const isAuthenticated = Boolean(token);

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
          err instanceof Error ? err.message : "Error al cargar los grupos."
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
        const apiMsg =
          typeof data?.error === "string" ? data.error : null;
        const detail =
          typeof data?.details === "string" ? ` (${data.details})` : "";
        throw new Error(
          apiMsg
            ? `${apiMsg}${detail}`
            : `No se pudo iniciar sesion (${response.status}).`
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
      setToken(String(tokenValue));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al iniciar sesion."
      );
    } finally {
      setLoadingLogin(false);
    }
  };

  // useCallback: memoriza la función para que no cambie en cada render si `token` no cambia.
  const loadRows = React.useCallback(async (grupo: string) => {
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
        err instanceof Error ? err.message : "Error al cargar los alumnos."
      );
    } finally {
      setLoadingRows(false);
    }
  }, [token]);

  // Al elegir grupo en el <select>, actualiza estado y dispara la carga de alumnos.
  const handleGroupChange = (value: string) => {
    setSelectedGroup(value);
    if (value) {
      void loadRows(value);
    } else {
      setRows([]);
    }
  };

  // useRef: referencia mutable al elemento DOM <select> (para leer el valor al pulsar Buscar).
  const selectRef = React.useRef<HTMLSelectElement>(null);

  // void loadRows: ignora explícitamente la Promise (fire-and-forget); el estado loading lo cubre.
  const handleSearchClick = () => {
    const v = selectRef.current?.value?.trim() ?? "";
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
            <GrupoSelector
              ref={selectRef}
              groups={groups}
              selectedGroup={selectedGroup}
              onSelectedGroupChange={handleGroupChange}
              onSearch={handleSearchClick}
              loadingGroups={loadingGroups}
              loadingRows={loadingRows}
              error={error}
            />

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-zinc-800">
                Tabla completa
              </h2>
              <TablaAlumnos columns={columns} data={rows} />
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-zinc-800">
                Vista simple (solo grupo y nombre)
              </h2>
              <p className="text-xs text-zinc-500">
                Mismos datos que arriba; otra plantilla de columnas y sin columnas
                extra de la API.
              </p>
              <TablaAlumnos
                columns={columnsVistaSimple}
                data={rows}
                pagination={false}
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
