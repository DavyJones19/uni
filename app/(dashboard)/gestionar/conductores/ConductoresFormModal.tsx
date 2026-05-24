"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  SearchCombobox,
  type ComboboxOption,
} from "@/components/ui/search-combobox";
import { FormModalShell } from "@/components/ui/form-modal-shell";

type RowData = Record<string, any>;

type ConductoresFormMode = "edit" | "insert";

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

type ConductoresFormModalProps = {
  mode: ConductoresFormMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  loadTipoPuntos: (query: string) => Promise<ComboboxOption[]>;
  row?: RowData;
  onSuccess: (id: string | number) => void;
};

export function ConductoresFormModal({
  mode,
  open,
  onOpenChange,
  token,
  loadTipoPuntos,
  row,
  onSuccess,
}: ConductoresFormModalProps) {
  const isEditMode = mode === "edit";
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [valorConductor, setValorConductor] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    if (isEditMode) {
      setValorConductor(String(row?.CONDUCTOR || ""));

      return;
    }

    setValorConductor("");
  }, [open, isEditMode, row]);

  const modeConfig: ModeConfig = isEditMode
    ? {
        title: "Editar Conductor",
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
            key: "conductor",
            render: () => (
              <Input
                value={valorConductor}
                onChange={(e) => setValorConductor(e.target.value)}
                placeholder="Nombre"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
        ],
        validationRules: [
          {
            key: "conductor",
            isInvalid: () => !valorConductor,
            message: "El nombre del conductor es obligatorio.",
          },
        ],
        submit: {
          endpoint: "/api/editar",
          buildBody: () => ({
            tl: "dhl_conductores",

            id: row?.id,
            conductor: valorConductor,
          }),
          successId: (responseData) => responseData?.id ?? row?.id ?? null,
          resetAfterSuccess: false,
        },
      }
    : {
        title: "Agregar Conductor",
        submitLabel: "Agregar",
        fields: [
          {
            key: "conductor",
            render: () => (
              <Input
                value={valorConductor}
                onChange={(e) => setValorConductor(e.target.value)}
                placeholder="Nombre"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
        ],
        validationRules: [
          {
            key: "conductor",
            isInvalid: () => !valorConductor,
            message: "El nombre del conductor es obligatorio.",
          },
        ],
        submit: {
          endpoint: "/api/insertar",
          buildBody: () => ({
            tl: "dhl_conductores",
            conductor: valorConductor,
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

      setValorConductor("");

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
