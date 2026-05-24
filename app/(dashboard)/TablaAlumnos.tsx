"use client";
// Capa fina: solo envuelve DataTablePriority con un <section> y clases.
// Patrón "wrapper" — si mañana cambias la tabla interna, este archivo puede quedar igual.

import { DataTablePriority, type ColumnDef } from "./DataTablePriority";

// <TData extends Record<string, unknown>> = genérico: TData es "cualquier objeto fila"
// que TypeScript puede comprobar (claves string → valores desconocidos).
type TablaAlumnosProps<TData extends Record<string, unknown>> = {
  columns: Array<ColumnDef<TData>>;
  data: TData[];
  emptyMessage?: string;
  headerVariant?: "default" | "pill";
  pagination?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
};

// Componente genérico TablaAlumnos<TData>: al usarlo, TS infiere TData desde `data`.
export function TablaAlumnos<TData extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage,
  headerVariant,
  pagination,
  defaultPageSize,
  pageSizeOptions,
}: TablaAlumnosProps<TData>) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <DataTablePriority
        columns={columns}
        data={data}
        emptyMessage={emptyMessage}
        headerVariant={headerVariant}
        pagination={pagination}
        defaultPageSize={defaultPageSize}
        pageSizeOptions={pageSizeOptions}
      />
    </section>
  );
}
