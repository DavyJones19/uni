"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  SearchCombobox,
  type ComboboxOption,
} from "@/components/ui/search-combobox";
import { FormModalShell } from "@/components/ui/form-modal-shell";

type RowData = Record<string, any>;

type FacilityFormMode = "edit" | "insert";

type FormFieldConfig = {
  key: string;
  render: () => React.ReactNode;
};

type ValidationRule = {
  key: string;
  isInvalid: () => boolean;
  message: string;
};

type SubmitConfig = {
  endpoint: string;
  buildBody: () => Record<string, unknown>;
  successId: (responseData: any) => string | number | null;
  resetAfterSuccess: boolean;
};

type ModeConfig = {
  title: string;
  submitLabel: string;
  fields: FormFieldConfig[];
  validationRules: ValidationRule[];
  submit: SubmitConfig;
};

type FacilityFormModalProps = {
  mode: FacilityFormMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  loadTipoPuntos: (query: string) => Promise<ComboboxOption[]>;
  row?: RowData;
  onSuccess: (id: string | number) => void;
};

export function FacilityFormModal({
  mode,
  open,
  onOpenChange,
  token,
  loadTipoPuntos,
  row,
  onSuccess,
}: FacilityFormModalProps) {
  const isEditMode = mode === "edit";
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [valorNOMBRE, setValorNOMBRE] = React.useState("");
  const [valorTipo, setValorTipo] = React.useState("");
  const [valorTipoId, setValorTipoId] = React.useState("");
  const [valorLATTITUDE, setValorLATTITUDE] = React.useState("");
  const [valorLONGITUDE, setValorLONGITUDE] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    if (isEditMode) {
      setValorNOMBRE(String(row?.NOMBRE || ""));
      setValorTipo(String(row?.TIPO || ""));
      setValorTipoId(
        String(
          row?.id_tipo_punto || row?.ID_TIPO_PUNTO || row?.idTipoPunto || "",
        ),
      );
      setValorLATTITUDE(String(row?.LATTITUDE || ""));
      setValorLONGITUDE(String(row?.LONGITUDE || ""));
      return;
    }

    setValorNOMBRE("");
    setValorTipo("");
    setValorTipoId("");
    setValorLATTITUDE("");
    setValorLONGITUDE("");
  }, [open, isEditMode, row]);

  const tipoPuntoField = (label: string) => (
    <SearchCombobox
      label={label}
      value={valorTipo}
      options={[]}
      loadOptions={loadTipoPuntos}
      onValueChange={(text) => {
        setValorTipo(text);
        setValorTipoId("");
      }}
      onSelect={(option) => {
        setValorTipo(option.label);
        setValorTipoId(option.id);
      }}
      placeholder="Escribe o selecciona un tipo"
      disabled={loading}
      inputClassName="h-8 text-xs"
      loading={loading}
      loadingText="Cargando tipos..."
      emptyText="No hay tipos disponibles."
      noResultsText="No hay coincidencias."
    />
  );

  const modeConfig: ModeConfig = isEditMode
    ? {
        title: "Editar Punto",
        submitLabel: "Confirmar",
        fields: [
          {
            key: "id",
            render: () => (
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  ID: {row?.id}
                </label>
              </div>
            ),
          },
          {
            key: "nombre",
            render: () => (
              <Input
                value={valorNOMBRE}
                onChange={(e) => setValorNOMBRE(e.target.value)}
                placeholder="Nombre"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
          {
            key: "tipo",
            render: () => tipoPuntoField("Tipo de punto"),
          },
          {
            key: "latitud",
            render: () => (
              <Input
                value={valorLATTITUDE}
                onChange={(e) => setValorLATTITUDE(e.target.value)}
                placeholder="Latitud"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
          {
            key: "longitud",
            render: () => (
              <Input
                value={valorLONGITUDE}
                onChange={(e) => setValorLONGITUDE(e.target.value)}
                placeholder="Longitud"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
        ],
        validationRules: [
          {
            key: "nombre",
            isInvalid: () => !valorNOMBRE,
            message: "El nombre del punto es obligatorio.",
          },
          {
            key: "tipo",
            isInvalid: () => !valorTipoId,
            message: "Selecciona un tipo de punto de la lista.",
          },
          {
            key: "latitud",
            isInvalid: () => !valorLATTITUDE || isNaN(Number(valorLATTITUDE)),
            message: "La latitud es obligatoria y debe ser un número válido.",
          },
          {
            key: "longitud",
            isInvalid: () => !valorLONGITUDE || isNaN(Number(valorLONGITUDE)),
            message: "La longitud es obligatoria y debe ser un número válido.",
          },
        ],
        submit: {
          endpoint: "/api/editar",
          buildBody: () => ({
            tl: "cat_puntos",
            lattitude: Number(valorLATTITUDE),
            id: row?.id,
            name: valorNOMBRE,
            tipo: valorTipo,
            id_tipo_punto: Number(valorTipoId),
            longitud: Number(valorLONGITUDE),
          }),
          successId: (responseData) => responseData?.id ?? row?.id ?? null,
          resetAfterSuccess: false,
        },
      }
    : {
        title: "Agregar Punto",
        submitLabel: "Agregar",
        fields: [
          {
            key: "tipo",
            render: () => tipoPuntoField("Tipo de punto"),
          },
          {
            key: "nombre",
            render: () => (
              <Input
                value={valorNOMBRE}
                onChange={(e) => setValorNOMBRE(e.target.value)}
                placeholder="Nombre"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
          {
            key: "latitud",
            render: () => (
              <Input
                value={valorLATTITUDE}
                onChange={(e) => setValorLATTITUDE(e.target.value)}
                placeholder="Latitud"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
          {
            key: "longitud",
            render: () => (
              <Input
                value={valorLONGITUDE}
                onChange={(e) => setValorLONGITUDE(e.target.value)}
                placeholder="Longitud"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
        ],
        validationRules: [
          {
            key: "nombre",
            isInvalid: () => !valorNOMBRE,
            message: "El nombre del punto es obligatorio.",
          },
          {
            key: "tipo",
            isInvalid: () => !valorTipoId,
            message: "Selecciona un tipo de punto de la lista.",
          },
          {
            key: "latitud",
            isInvalid: () => !valorLATTITUDE || isNaN(Number(valorLATTITUDE)),
            message: "La latitud es obligatoria y debe ser un número válido.",
          },
          {
            key: "longitud",
            isInvalid: () => !valorLONGITUDE || isNaN(Number(valorLONGITUDE)),
            message: "La longitud es obligatoria y debe ser un número válido.",
          },
        ],
        submit: {
          endpoint: "/api/insertar",
          buildBody: () => ({
            tl: "cat_puntos",
            name: valorNOMBRE,
            tipo: valorTipo,
            id_tipo_punto: Number(valorTipoId),
            lattitude: Number(valorLATTITUDE),
            longitud: Number(valorLONGITUDE),
          }),
          successId: (responseData) => responseData?.id ?? null,
          resetAfterSuccess: true,
        },
      };

  const { fields, validationRules, submit, title, submitLabel } = modeConfig;

  const validateFields = () => {
    const invalidRule = validationRules.find((rule) => rule.isInvalid());
    if (invalidRule) {
      setError(invalidRule.message);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(submit.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submit.buildBody()),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const apiMsg =
          typeof resData?.error === "string" ? resData.error : null;
        throw new Error(apiMsg || "Error en la inserción.");
      }

      if (!submit.resetAfterSuccess) {
        const modifiedId = submit.successId(resData);
        onOpenChange(false);
        onSuccess(modifiedId ?? "");
        return;
      }

      const insertedId = submit.successId(resData);
      if (!insertedId) {
        throw new Error("No se recibió el id del registro insertado.");
      }

      setValorNOMBRE("");
      setValorLATTITUDE("");
      setValorLONGITUDE("");
      setValorTipo("");
      setValorTipoId("");
      onOpenChange(false);
      onSuccess(insertedId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      submitLabel={submitLabel}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
    >
      {fields.map((field) => (
        <React.Fragment key={field.key}>{field.render()}</React.Fragment>
      ))}
    </FormModalShell>
  );
}
