"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  SearchCombobox,
  type ComboboxOption,
} from "@/components/ui/search-combobox";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { bankPasswordSchema } from "@/lib/passwordValidation";
import PasswordStrengthIndicator from "@/components/ui/passwordStrength/passwordStrengthIndicator";

type RowData = Record<string, any>;

type UsersFormMode = "edit" | "insert";



type UsersFormModalProps = {
  mode: UsersFormMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  loadRoles: (query: string) => Promise<ComboboxOption[]>;
  row?: RowData;
  onSuccess: (id: string | number) => void;
};




export function UsersFormModal({
  mode,
  open,
  onOpenChange,
  token,
  loadRoles,
  row,
  onSuccess,
}: UsersFormModalProps) {
  const isEditMode = mode === "edit";
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estados del formulario
  const [nombreCompleto, setNombreCompleto] = React.useState("");
  const [perfil, setPerfil] = React.useState("");
  const [perfilId, setPerfilId] = React.useState("");
  const [usuario, setUsuario] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [pwdConfirm, setPwdConfirm] = React.useState("");
  const [pwdError, setPwdError] = React.useState<string | null>(null);
  const [showPwdStrength, setShowPwdStrength] = React.useState(false);

  // Cargar datos en modo edición
  React.useEffect(() => {
    if (!open) return;

    if (isEditMode && row) {
      setNombreCompleto(String(row.NOMBRECOMPLETO ?? row.nombre_completo ?? ""));
      setPerfil(String(row.PERFIL ?? row.perfil ?? ""));
      setPerfilId(String(row.ID_PERFIL ?? row.id_perfil ?? row.idPerfil ?? ""));
      setUsuario(String(row.USUARIO ?? row.usuario ?? ""));
      setPwd(""); // No mostrar pwd en edición
      setPwdConfirm("");
      setPwdError(null);
      setShowPwdStrength(false);
    } else {
      setNombreCompleto("");
      setPerfil("");
      setPerfilId("");
      setUsuario("");
      setPwd("");
      setPwdConfirm("");
      setPwdError(null);
      setShowPwdStrength(false);
    }
  }, [open, isEditMode, row]);

  // Validar contraseña en tiempo real
  const handlePwdChange = React.useCallback((newPwd: string) => {
    console.log("handlePwdChange called:", newPwd); // DEBUG
    setPwd(newPwd);
    setShowPwdStrength(newPwd.length > 0);
    
    if (newPwd.length === 0) {
      setPwdError(null);
      return;
    }

    const validation = bankPasswordSchema.safeParse(newPwd);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      setPwdError(firstError?.message || "Contraseña inválida");
    } else {
      setPwdError(null);
    }
  }, []);

  // Renderizado del campo de contraseña
  const renderPwdField = () => (
    <div className="space-y-2">
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase">
          Contraseña
        </label>
        <Input
          type="password"
          value={pwd}
          onChange={(e) => {
            console.log("Input onChange:", e.target.value); // DEBUG
            handlePwdChange(e.target.value);
          }}
          placeholder={isEditMode ? "Dejar vacío para no cambiar" : "Contraseña"}
          disabled={loading}
          className="text-xs h-8 mt-1"
          autoComplete="new-password"
        />
      </div>
      {pwd && <PasswordStrengthIndicator password={pwd} />}
      {pwdError && (
        <p className="text-xs text-red-500 font-medium">{pwdError}</p>
      )}
    </div>
  );
  const perfilCombo = (label: string) => (
    <SearchCombobox
      label={label}
      value={perfil}
      options={[]}
      loadOptions={loadRoles}
      onValueChange={(text) => {
        setPerfil(text);
        setPerfilId("");
      }}
      onSelect={(option) => {
        setPerfil(option.label);
        setPerfilId(option.id);
      }}
      placeholder="Escribe o selecciona un perfil"
      disabled={loading}
      inputClassName="h-8 text-xs"
      loading={loading}
      loadingText="Cargando perfiles..."
      emptyText="No hay perfiles disponibles."
      noResultsText="No hay coincidencias."
    />
  );

  // Configuración por modo
  const modeConfig = isEditMode
    ? {
        title: "Editar Usuario",
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
            key: "nombreCompleto",
            render: () => (
              <Input
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Nombre completo"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
          {
            key: "perfil",
            render: () => perfilCombo("Perfil"),
          },
          {
            key: "usuario",
            render: () => (
              <Input
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Usuario"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
          {
            key: "pwd",
            render: () => renderPwdField(),
          },
        ],
        validationRules: [
          {
            key: "nombreCompleto",
            isInvalid: () => !nombreCompleto.trim(),
            message: "El nombre completo es obligatorio.",
          },
          {
            key: "perfil",
            isInvalid: () => !perfilId,
            message: "Selecciona un perfil de la lista.",
          },
          {
            key: "usuario",
            isInvalid: () => !usuario.trim(),
            message: "El usuario es obligatorio.",
          },
          {
            key: "pwd",
            isInvalid: () => {
              // En edición: pwd es opcional, solo validar si hay cambio
              if (!pwd.trim()) return false; // Permitir campo vacío
              const validation = bankPasswordSchema.safeParse(pwd);
              return !validation.success;
            },
            message: pwdError || "La contraseña no cumple los requisitos de seguridad.",
          },
        ],
        submit: {
          endpoint: "/api/editar",
          buildBody: () => ({
            tl: "DHL_USERS",
            id: row?.id,
            nombre_completo: nombreCompleto,
            id_perfil: Number(perfilId),
            usuario: usuario,
            pwd: pwd,
          }),
          successId: (responseData: any) => responseData?.id ?? row?.id ?? null,
          resetAfterSuccess: false,
        },
      }
    : {
        title: "Agregar Usuario",
        submitLabel: "Agregar",
        fields: [
          {
            key: "nombreCompleto",
            render: () => (
              <Input
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Nombre completo"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
          {
            key: "perfil",
            render: () => perfilCombo("Perfil"),
          },
          {
            key: "usuario",
            render: () => (
              <Input
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Usuario"
                disabled={loading}
                className="text-xs h-8"
              />
            ),
          },
          {
            key: "pwd",
            render: () => renderPwdField(),
          },
        ],
        validationRules: [
          {
            key: "nombreCompleto",
            isInvalid: () => !nombreCompleto.trim(),
            message: "El nombre completo es obligatorio.",
          },
          {
            key: "perfil",
            isInvalid: () => !perfilId,
            message: "Selecciona un perfil de la lista.",
          },
          {
            key: "usuario",
            isInvalid: () => !usuario.trim(),
            message: "El usuario es obligatorio.",
          },
          {
            key: "pwd",
            isInvalid: () => {
              // En inserción: pwd es obligatorio y debe ser válido
              if (!pwd.trim()) return true;
              const validation = bankPasswordSchema.safeParse(pwd);
              return !validation.success;
            },
            message: pwdError || "La contraseña no cumple los requisitos de seguridad.",
          },
        ],
        submit: {
          endpoint: "/api/insertar",
          buildBody: () => ({
            tl: "DHL_USERS",
            nombre_completo: nombreCompleto,
            perfil: Number(perfilId),
            usuario: usuario,
            pwd: pwd,
          }),
          successId: (responseData: any) => responseData?.id ?? null,
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
    if (!validateFields()) return;

    try {
      setLoading(true);
      setError(null);

      // Paso 1: Actualizar datos del usuario (sin contraseña)
      const userDataBody = {
        ...submit.buildBody(),
        // No incluir pwd aquí, se manejará por separado
      };
      
      // En modo insert, incluir la contraseña en el cuerpo inicial
      // En modo edit, solo enviar si hay cambio de contraseña
      if (isEditMode && pwd) {
        delete userDataBody.pwd;
      }

      const response = await fetch(submit.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userDataBody),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const apiMsg =
          typeof resData?.error === "string" ? resData.error : null;
        throw new Error(apiMsg || "Error al guardar los datos del usuario.");
      }

      const resultId = submit.successId(resData);
      if (!resultId) {
        throw new Error("No se recibió el ID del registro.");
      }

      // Paso 2: Si hay contraseña nueva y estamos en modo edit, cambiarla por el endpoint seguro
      if (isEditMode && pwd && pwd.trim()) {
        const pwdValidation = bankPasswordSchema.safeParse(pwd);
        if (pwdValidation.success) {
          const pwdResponse = await fetch("/api/change-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              userId: resultId,
              password: pwd,
            }),
          });

          const pwdData = await pwdResponse.json().catch(() => ({}));
          
          if (!pwdResponse.ok) {
            console.error("[WARN] Error cambio de contraseña:", pwdData.error);
            // No fallar la operación completa, pero notificar al usuario
            setError(`Usuario guardado, pero error al cambiar contraseña: ${pwdData.error}`);
          }
        }
      }

      // Paso 3: Limpiar y cerrar
      if (submit.resetAfterSuccess) {
        setNombreCompleto("");
        setPerfil("");
        setPerfilId("");
        setUsuario("");
        setPwd("");
        setPwdConfirm("");
      }

      // Limpiar contraseña siempre por seguridad
      setPwd("");
      setPwdConfirm("");
      setPwdError(null);

      onOpenChange(false);
      onSuccess(resultId);
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