"use client";

import * as React from "react";

type ColumnDef<TData> = {
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
};

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
  return `row-${index}`;
};

const getCellValue = <TData,>(
  row: TData,
  column: ColumnDef<TData>
): React.ReactNode => {
  if (column.render) return column.render(row);
  const key = column.accessorKey ?? column.id;
  const value = (row as Record<string, unknown>)[String(key)];
  return value === null || value === undefined ? "" : String(value);
};

export function DataTablePriority<TData extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "Sin resultados.",
}: DataTablePriorityProps<TData>) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = React.useState(false);
  const [maxVisible, setMaxVisible] = React.useState(6);

  React.useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setIsMobile(true);
        setMaxVisible(3);
        return;
      }
      setIsMobile(false);
      if (width < 1024) {
        setMaxVisible(5);
        return;
      }
      setMaxVisible(8);
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  const orderedColumns = React.useMemo(() => {
    return [...columns]
      .map((col, index) => ({
        col,
        priority: typeof col.priority === "number" ? col.priority : 999,
        index,
      }))
      .sort((a, b) =>
        a.priority === b.priority ? a.index - b.index : a.priority - b.priority
      )
      .map(({ col }) => col);
  }, [columns]);

  const visibleColumns = React.useMemo(
    () => orderedColumns.slice(0, maxVisible),
    [orderedColumns, maxVisible]
  );

  const hiddenColumns = React.useMemo(
    () => orderedColumns.slice(maxVisible),
    [orderedColumns, maxVisible]
  );

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

  return (
    <div className="w-full overflow-hidden rounded-lg border border-zinc-200 bg-white">
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
            data.map((row, index) => {
              const rowId = getRowId(row, index);
              const hasHidden = hiddenColumns.length > 0;
              const isExpanded = expanded.has(rowId);

              return (
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
                      <td colSpan={visibleColumns.length + 1} className="px-3 py-3">
                        <div
                          className={
                            isMobile
                              ? "grid grid-cols-1 gap-2"
                              : "grid grid-cols-2 gap-3"
                          }
                        >
                          {hiddenColumns.map((col) => (
                            <div key={col.id} className="flex flex-col">
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
    </div>
  );
}
