"use client";

import * as React from "react";

import {
  SearchCombobox,
  type ComboboxOption,
} from "@/components/ui/search-combobox";

export type GrupoOption = ComboboxOption;

type GrupoSelectorProps = {
  groups: GrupoOption[];
  selectedGroup: string;
  onSelectedGroupChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  loadingGroups: boolean;
  loadingRows: boolean;
  error: string | null;
};

export const GrupoSelector = React.forwardRef<
  HTMLInputElement,
  GrupoSelectorProps
>(function GrupoSelector(
  {
    groups,
    selectedGroup,
    onSelectedGroupChange,
    onSearch,
    onClear,
    loadingGroups,
    loadingRows,
    error,
  },
  ref,
) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <SearchCombobox
        ref={ref}
        label="Grupo"
        value={selectedGroup}
        options={groups}
        onValueChange={onSelectedGroupChange}
        placeholder="Escribe o selecciona un grupo"
        loading={loadingGroups}
        error={error}
        loadingText="Cargando grupos..."
        emptyText="No hay grupos disponibles."
        noResultsText="No hay coincidencias."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onSearch}
          disabled={loadingRows}
          className="h-10 rounded-md border border-zinc-200 bg-zinc-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingRows ? "Cargando..." : "Buscar"}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="h-10 rounded-md border border-zinc-200 bg-zinc-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          Limpiar filtros
        </button>
      </div>
    </section>
  );
});

GrupoSelector.displayName = "GrupoSelector";
