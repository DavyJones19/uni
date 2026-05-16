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
  onClear: () => void;
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

// forwardRef permite que el PADRE pase ref y lea/escriba el valor del input si lo necesita.
// Sintaxis: React.forwardRef<TipoDelDOM, Props>(función con (props, ref) => ...)
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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const innerInputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  React.useImperativeHandle(
    ref,
    () => innerInputRef.current as HTMLInputElement,
    [],
  );

  // useMemo: solo recalcula la lista sin duplicados cuando cambia `groups`.
  const uniqueGroups = React.useMemo(() => dedupeByValue(groups), [groups]);

  const normalizedQuery = selectedGroup.trim().toLowerCase();
  const filteredGroups = React.useMemo(() => {
    if (!normalizedQuery) return uniqueGroups;
    return uniqueGroups.filter((group) => {
      const value = group.value.toLowerCase();
      const label = group.label.toLowerCase();
      return value.includes(normalizedQuery) || label.includes(normalizedQuery);
    });
  }, [uniqueGroups, normalizedQuery]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, [isOpen]);

  React.useEffect(() => {
    if (filteredGroups.length === 0) {
      setHighlightedIndex(-1);
      return;
    }
    if (highlightedIndex >= filteredGroups.length) {
      setHighlightedIndex(filteredGroups.length - 1);
    }
  }, [filteredGroups, highlightedIndex]);

  const selectGroup = React.useCallback(
    (value: string) => {
      onSelectedGroupChange(value);
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onSelectedGroupChange],
  );

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <label
        htmlFor="grupo-picker"
        className="text-sm font-medium text-zinc-700"
      >
        Grupo
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full" ref={containerRef}>
          <input
            ref={innerInputRef}
            id="grupo-picker"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="grupo-picker-list"
            aria-autocomplete="list"
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900"
            placeholder="Escribe o selecciona un grupo"
            value={selectedGroup}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              onSelectedGroupChange(event.target.value);
              setIsOpen(true);
              setHighlightedIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setIsOpen(true);
                setHighlightedIndex((prev) =>
                  Math.min(prev + 1, filteredGroups.length - 1),
                );
                return;
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlightedIndex((prev) => Math.max(prev - 1, 0));
                return;
              }
              if (event.key === "Enter") {
                if (!isOpen) return;
                event.preventDefault();
                if (highlightedIndex >= 0 && filteredGroups[highlightedIndex]) {
                  selectGroup(filteredGroups[highlightedIndex].value);
                } else {
                  setIsOpen(false);
                }
                return;
              }
              if (event.key === "Escape") {
                setIsOpen(false);
                setHighlightedIndex(-1);
              }
            }}
            aria-busy={loadingGroups}
          />

          {isOpen && (
            <div
              id="grupo-picker-list"
              role="listbox"
              className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
            >
              {filteredGroups.length === 0 ? (
                <p className="px-3 py-2 text-xs text-zinc-500">
                  No hay coincidencias.
                </p>
              ) : (
                filteredGroups.map((group, index) => (
                  <button
                    key={`${group.value}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === highlightedIndex}
                    className={`block w-full px-3 py-2 text-left text-sm ${
                      index === highlightedIndex
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-800 hover:bg-zinc-100"
                    }`}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => selectGroup(group.value)}
                  >
                    <span className="font-medium">{group.label}</span>
                    {group.label !== group.value && (
                      <span className="ml-2 text-xs opacity-70">
                        ({group.value})
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onSearch}
          disabled={!selectedGroup.trim() || loadingRows}
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
