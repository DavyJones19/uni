"use client";
// Capa fina: solo envuelve DataTablePriority con un <section> y clases.
// Patrón "wrapper" — si mañana cambias la tabla interna, este archivo puede quedar igual.

import {
  DataTablePriority,
  type ColumnDef,
} from "./DataTablePriority";

// <TData extends Record<string, unknown>> = genérico: TData es "cualquier objeto fila"
// que TypeScript puede comprobar (claves string → valores desconocidos).
type TablaGruposProps<TData extends Record<string, unknown>> = {
  columns: Array<ColumnDef<TData>>;
  data: TData[];
  emptyMessage?: string;
  pagination?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
};

// Componente genérico TablaGrupos<TData>: al usarlo, TS infiere TData desde `data`.
export function TablaGrupos<TData extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage,
  pagination,
  defaultPageSize,
  pageSizeOptions,
}: TablaGruposProps<TData>) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <DataTablePriority
        columns={columns}
        data={data}
        emptyMessage={emptyMessage}
        pagination={pagination}
        defaultPageSize={defaultPageSize}
        pageSizeOptions={pageSizeOptions}
      />
    </section>
  );
}
