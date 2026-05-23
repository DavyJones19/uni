"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ComboboxOption = {
  id: string;
  label: string;
  value: string;
};

type SearchComboboxProps<TOption extends ComboboxOption = ComboboxOption> = {
  id?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  value: string;
  options: TOption[];
  onValueChange: (value: string) => void;
  onSelect?: (option: TOption) => void;
  loadOptions?: (query: string) => Promise<TOption[]>;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  loadingText?: React.ReactNode;
  emptyText?: React.ReactNode;
  noResultsText?: React.ReactNode;
  renderOptionMeta?: (option: TOption) => React.ReactNode;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  listClassName?: string;
  messageClassName?: string;
};

function dedupeByValue<TOption extends ComboboxOption>(options: TOption[]) {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.value)) return false;
    seen.add(option.value);
    return true;
  });
}

export const SearchCombobox = React.forwardRef<
  HTMLInputElement,
  SearchComboboxProps
>(function SearchCombobox(
  {
    id,
    label,
    description,
    value,
    options,
    onValueChange,
    onSelect,
    loadOptions,
    placeholder = "Escribe para buscar",
    disabled = false,
    loading = false,
    error = null,
    loadingText = "Cargando...",
    emptyText = "No hay opciones disponibles.",
    noResultsText = "No hay coincidencias.",
    renderOptionMeta,
    className,
    inputClassName,
    labelClassName,
    listClassName,
    messageClassName,
  },
  ref,
) {
  const fallbackId = React.useId();
  const inputId = id ?? `search-combobox-${fallbackId}`;
  const listId = `${inputId}-list`;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const innerInputRef = React.useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const [searchQuery, setSearchQuery] = React.useState(value);
  const [remoteOptions, setRemoteOptions] = React.useState<TOption[] | null>(
    null,
  );
  const [remoteLoading, setRemoteLoading] = React.useState(false);
  const [remoteError, setRemoteError] = React.useState<string | null>(null);

  React.useImperativeHandle(
    ref,
    () => innerInputRef.current as HTMLInputElement,
    [],
  );

  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery(value);
    }
  }, [isOpen, value]);

  React.useEffect(() => {
    if (!loadOptions || !isOpen || disabled) return;

    let active = true;
    setRemoteLoading(true);
    setRemoteError(null);

    void loadOptions(searchQuery.trim())
      .then((nextOptions) => {
        if (!active) return;
        setRemoteOptions(Array.isArray(nextOptions) ? nextOptions : []);
      })
      .catch((fetchError) => {
        if (!active) return;
        setRemoteOptions([]);
        setRemoteError(
          fetchError instanceof Error
            ? fetchError.message
            : "Error al cargar opciones.",
        );
      })
      .finally(() => {
        if (!active) return;
        setRemoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadOptions, isOpen, disabled, searchQuery]);

  const sourceOptions =
    loadOptions && remoteOptions !== null ? remoteOptions : options;
  const uniqueOptions = React.useMemo(
    () => dedupeByValue(sourceOptions),
    [sourceOptions],
  );

  const normalizedQuery = (loadOptions ? searchQuery : value)
    .trim()
    .toLowerCase();
  const filteredOptions = React.useMemo(() => {
    if (!normalizedQuery) return uniqueOptions;
    return uniqueOptions.filter((option) => {
      const optionValue = option.value.toLowerCase();
      const optionLabel = option.label.toLowerCase();
      return (
        optionValue.includes(normalizedQuery) ||
        optionLabel.includes(normalizedQuery)
      );
    });
  }, [uniqueOptions, normalizedQuery]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onDocumentMouseDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (filteredOptions.length === 0) {
      setHighlightedIndex(-1);
      return;
    }

    if (highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(filteredOptions.length - 1);
    }
  }, [filteredOptions, highlightedIndex]);

  const selectOption = React.useCallback(
    (option: TOption) => {
      onSelect?.(option);
      if (!onSelect) {
        onValueChange(option.label);
      }
      setIsOpen(false);
      setHighlightedIndex(-1);
    },
    [onSelect, onValueChange],
  );

  const showDropdown = isOpen && !disabled;
  const effectiveLoading = loading || remoteLoading;
  const effectiveError = error ?? remoteError;
  const showNoResultsMessage =
    !effectiveLoading &&
    !effectiveError &&
    uniqueOptions.length > 0 &&
    filteredOptions.length === 0;
  const showEmptyMessage =
    !effectiveLoading && !effectiveError && uniqueOptions.length === 0;

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label ? (
        <label
          htmlFor={inputId}
          className={cn("mb-1 block text-sm font-medium", labelClassName)}
        >
          {label}
        </label>
      ) : null}

      {description ? (
        <p className={cn("mb-1 text-xs text-zinc-500", messageClassName)}>
          {description}
        </p>
      ) : null}

      <input
        ref={innerInputRef}
        id={inputId}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        className={cn(
          "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900",
          inputClassName,
        )}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onFocus={() => {
          if (loadOptions) setSearchQuery("");
          setIsOpen(true);
        }}
        onChange={(event) => {
          setSearchQuery(event.target.value);
          onValueChange(event.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
            setHighlightedIndex((prev) =>
              Math.min(prev + 1, filteredOptions.length - 1),
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
            if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
              selectOption(filteredOptions[highlightedIndex]);
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
        aria-busy={effectiveLoading}
      />

      {showDropdown && (
        <div
          id={listId}
          role="listbox"
          className={cn(
            "absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg",
            listClassName,
          )}
        >
          {showNoResultsMessage ? (
            <p className="px-3 py-2 text-xs text-zinc-500">{noResultsText}</p>
          ) : showEmptyMessage ? (
            <p className="px-3 py-2 text-xs text-zinc-500">{emptyText}</p>
          ) : filteredOptions.length === 0 ? null : (
            filteredOptions.map((option, index) => {
              const meta = renderOptionMeta?.(option);
              return (
                <button
                  key={`${option.value}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={cn(
                    "block w-full px-3 py-2 text-left text-sm",
                    index === highlightedIndex
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-800 hover:bg-zinc-100",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  <span className="font-medium">{option.label}</span>
                  {meta ? (
                    <span className="ml-2 text-xs opacity-70">{meta}</span>
                  ) : option.label !== option.value ? (
                    <span className="ml-2 text-xs opacity-70">
                      ({option.value})
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      )}

      {effectiveError ? (
        <p className={cn("mt-1 text-sm text-red-600", messageClassName)}>
          {effectiveError}
        </p>
      ) : effectiveLoading ? (
        <p className={cn("mt-1 text-xs text-zinc-500", messageClassName)}>
          {loadingText}
        </p>
      ) : null}
    </div>
  );
});

SearchCombobox.displayName = "SearchCombobox";
