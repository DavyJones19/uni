"use client";

import * as React from "react";

// Definición de columna genérica: TData es el tipo de cada fila (objeto).
// accessorKey: nombre de la propiedad en la fila; render opcional para formatear a mano.
export type ColumnDef<TData> = {
  id: string;
  header: string;
  accessorKey?: keyof TData | string;
  priority?: number;
  render?: (row: TData) => React.ReactNode;
};

type DataTablePriorityProps<TData> = {
  columns: Array<ColumnDef<TData>>;
  data: TData[];
  emptyMessage?: string;
  /** Si es true (por defecto), solo se muestra un subconjunto de filas y la barra de paginación. */
  pagination?: boolean;
  /** Tamaño inicial de página; el usuario puede cambiarlo con el selector si hay opciones. */
  defaultPageSize?: number;
  /** Valores del desplegable "por página" (por defecto 5, 10, 25, 50). */
  pageSizeOptions?: number[];
};

// Obtiene un id estable para React (key) y para el botón expandir.
// Prueba varias convenciones de API (id, ID_USUARIO...); si no hay, usa el índice.
const getRowId = (row: Record<string, unknown>, index: number) => {
  const directId =
    row.id ||
    row.ID ||
    row.Id ||
    row["id"] ||
    row["ID_USUARIO"] ||
    row["id_usuario"];
  if (directId !== undefined && directId !== null) {
    return String(directId);
  }
  // index debe ser el índice global en `data` (no solo en la página) para evitar colisiones entre páginas.
  return `row-${index}`;
};

// Función genérica con <TData,>: el compilador relaciona fila + columna.
// Si la columna trae render(), la usa; si no, lee row[accessorKey] como texto.
const getCellValue = <TData,>(
  row: TData,
  column: ColumnDef<TData>,
): React.ReactNode => {
  if (column.render) return column.render(row);
  const key = column.accessorKey ?? column.id;
  const value = (row as Record<string, unknown>)[String(key)];
  return value === null || value === undefined ? "" : String(value);
};

const DEFAULT_PAGE_OPTIONS = [5, 10, 25, 50] as const;

export function DataTablePriority<TData extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "Sin resultados.",
  pagination = true,
  defaultPageSize = 10,
  pageSizeOptions,
}: DataTablePriorityProps<TData>) {
  const resolvedPageSizes =
    pageSizeOptions && pageSizeOptions.length > 0
      ? pageSizeOptions
      : [...DEFAULT_PAGE_OPTIONS];

  const [pageSize, setPageSize] = React.useState(() =>
    resolvedPageSizes.includes(defaultPageSize)
      ? defaultPageSize
      : (resolvedPageSizes[0] ?? 10),
  );
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const total = data.length;
  const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize;
  const end = total === 0 ? 0 : Math.min(start + pageSize, total);

  React.useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const paginatedData = React.useMemo(() => {
    if (!pagination) return data;
    return data.slice(start, end);
  }, [data, pagination, start, end]);

  // Set<string> guarda qué rowId tienen la fila "expandida" (columnas ocultas visibles).
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const tableContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = React.useState(1024);
  const [isMobile, setIsMobile] = React.useState(false);

  // Usa el ancho real del contenedor para decidir cuántas columnas caben sin scroll horizontal.
  React.useEffect(() => {
    const node = tableContainerRef.current;
    if (!node) return;

    const updateLayout = (width: number) => {
      setContainerWidth(width);
      setIsMobile(width < 640);
    };

    updateLayout(node.clientWidth);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      updateLayout(entry.contentRect.width);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Ordena columnas por priority (menor = más a la izquierda); empate → orden original.
  const orderedColumns = React.useMemo(() => {
    return [...columns]
      .map((col, index) => ({
        col,
        priority: typeof col.priority === "number" ? col.priority : 999,
        index,
      }))
      .sort((a, b) =>
        a.priority === b.priority ? a.index - b.index : a.priority - b.priority,
      )
      .map(({ col }) => col);
  }, [columns]);

  const maxVisible = React.useMemo(() => {
    if (orderedColumns.length === 0) return 0;

    const expandCellWidth = 56;
    const horizontalPadding = 24;
    const availableWidth = Math.max(
      0,
      containerWidth - expandCellWidth - horizontalPadding,
    );

    let used = 0;
    let count = 0;

    for (const col of orderedColumns) {
      const headerSize = String(col.header ?? col.id).length;
      const estimatedWidth = Math.min(
        260,
        Math.max(col.render ? 140 : 110, headerSize * 8 + 40),
      );

      if (count === 0 || used + estimatedWidth <= availableWidth) {
        used += estimatedWidth;
        count += 1;
      } else {
        break;
      }
    }

    return Math.min(Math.max(count, 1), orderedColumns.length);
  }, [orderedColumns, containerWidth]);

  const visibleColumns = React.useMemo(
    () => orderedColumns.slice(0, maxVisible),
    [orderedColumns, maxVisible],
  );

  const hiddenColumns = React.useMemo(
    () => orderedColumns.slice(maxVisible),
    [orderedColumns, maxVisible],
  );

  // Actualización funcional de estado: recibe el estado anterior (prev) y devuelve el nuevo Set.
  const toggleExpanded = (rowId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const showPagination = pagination;
  const displayPage = safePage;

  return (
    <div
      ref={tableContainerRef}
      className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white"
    >
      <table className="w-full border-collapse text-sm">
        <thead className="bg-zinc-50 text-left text-zinc-600">
          <tr>
            <th className="w-10 px-3 py-2" aria-label="Expandir" />
            {visibleColumns.map((col) => (
              <th key={col.id} className="px-3 py-2 font-medium">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={visibleColumns.length + 1}
                className="px-3 py-6 text-center text-zinc-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            (pagination ? paginatedData : data).map((row, index) => {
              const globalIndex = pagination ? start + index : index;
              const rowId = getRowId(row, globalIndex);
              const hasHidden = hiddenColumns.length > 0;
              const isExpanded = expanded.has(rowId);

              return (
                // Fragment evita un nodo extra en el DOM; key va en el Fragment en React 16+.
                <React.Fragment key={rowId}>
                  <tr className="border-t border-zinc-200">
                    <td className="px-3 py-2 align-top">
                      {hasHidden ? (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(rowId)}
                          className="h-7 w-7 rounded border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-50"
                          aria-label={isExpanded ? "Contraer" : "Expandir"}
                        >
                          {isExpanded ? "-" : "+"}
                        </button>
                      ) : null}
                    </td>
                    {visibleColumns.map((col) => (
                      <td key={col.id} className="px-3 py-2 align-top">
                        {getCellValue(row, col)}
                      </td>
                    ))}
                  </tr>
                  {hasHidden && isExpanded && (
                    <tr className="border-t border-zinc-200 bg-zinc-50">
                      <td
                        colSpan={visibleColumns.length + 1}
                        className="px-3 py-3"
                      >
                        <div
                          className={
                            isMobile
                              ? "flex flex-col gap-2"
                              : "flex flex-wrap gap-x-4 gap-y-2"
                          }
                        >
                          {hiddenColumns.map((col) => (
                            <div key={col.id} className="flex min-w-0 flex-col">
                              <span className="text-xs font-semibold text-zinc-500">
                                {col.header}
                              </span>
                              <span className="text-sm text-zinc-800">
                                {getCellValue(row, col)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
      {showPagination && (
        <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50/80 px-3 py-3 text-sm text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular-nums">
            Mostrando{" "}
            <span className="font-medium text-zinc-900">
              {total === 0 ? 0 : start + 1}–{end}
            </span>{" "}
            de <span className="font-medium text-zinc-900">{total}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-zinc-600">
              <span className="whitespace-nowrap">Filas por página</span>
              <select
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-900"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {resolvedPageSizes.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <p className="tabular-nums">
              Página{" "}
              <span className="font-semibold text-zinc-900">{displayPage}</span>{" "}
              de{" "}
              <span className="font-semibold text-zinc-900">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={displayPage <= 1}
                onClick={() => setCurrentPage(1)}
                title="Ir a la primera página"
              >
                Primero
              </button>
              <button
                type="button"
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={displayPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <button
                type="button"
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={displayPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
              >
                Siguiente
              </button>
              <button
                type="button"
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={displayPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Ir a la última página"
              >
                Último
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
