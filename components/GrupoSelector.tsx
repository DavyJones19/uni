"use client";

import * as React from "react";

// Opción del <select>: value es lo que se envía; label es lo que ve el usuario.
export type GrupoOption = {
  id: string;
  label: string;
  value: string;
};

type GrupoSelectorProps = {
  groups: GrupoOption[];
  selectedGroup: string;
  onSelectedGroupChange: (value: string) => void;
  onSearch: () => void;
  loadingGroups: boolean;
  loadingRows: boolean;
  error: string | null;
};

// Quita duplicados por `value` usando un Set (conjunto de strings únicos).
function dedupeByValue(groups: GrupoOption[]): GrupoOption[] {
  const seen = new Set<string>();
  // .filter con callback: solo deja pasar el primer grupo con cada value.
  return groups.filter((g) => {
    if (seen.has(g.value)) return false;
    seen.add(g.value);
    return true;
  });
}

// forwardRef permite que el PADRE pase ref={selectRef} y lea el <select> desde fuera.
// Sintaxis: React.forwardRef<TipoDelDOM, Props>(función con (props, ref) => ...)
export const GrupoSelector = React.forwardRef<
  HTMLSelectElement,
  GrupoSelectorProps
>(function GrupoSelector(
  {
    groups,
    selectedGroup,
    onSelectedGroupChange,
    onSearch,
    loadingGroups,
    loadingRows,
    error,
  },
  ref
) {
  // useMemo: solo recalcula la lista sin duplicados cuando cambia `groups`.
  const uniqueGroups = React.useMemo(
    () => dedupeByValue(groups),
    [groups]
  );

  // Set de valores permitidos: si selectedGroup no está en la lista (API cambió), mostramos "".
  const validValues = React.useMemo(() => {
    return new Set(uniqueGroups.map((g) => g.value));
  }, [uniqueGroups]);

  const selectValue =
    selectedGroup === "" || validValues.has(selectedGroup)
      ? selectedGroup
      : "";

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <label
        htmlFor="grupo-select"
        className="text-sm font-medium text-zinc-700"
      >
        Grupo
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          ref={ref}
          id="grupo-select"
          className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
          value={selectValue}
          onChange={(event) => onSelectedGroupChange(event.target.value)}
          aria-busy={loadingGroups}
        >
          <option value="">Seleccionar grupo</option>
          {/* key estable en listas React: ayuda a reconciliar el DOM al reordenar. */}
          {uniqueGroups.map((group, index) => (
            <option key={`${group.value}-${index}`} value={group.value}>
              {group.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onSearch}
          disabled={!selectValue || loadingRows}
          className="h-10 rounded-md border border-zinc-200 bg-zinc-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingRows ? "Cargando..." : "Buscar"}
        </button>
      </div>
      {!loadingGroups && !error && uniqueGroups.length === 0 && (
        <p className="text-xs text-zinc-500">No hay grupos disponibles.</p>
      )}
      {loadingGroups && (
        <p className="text-xs text-zinc-500">Cargando grupos...</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
});

// Nombre para React DevTools (sin esto aparecería "ForwardRef").
GrupoSelector.displayName = "GrupoSelector";
