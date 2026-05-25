// components/ui/passwordStrength/securePasswordInput.tsx
"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import PasswordStrengthIndicator from "@/components/ui/passwordStrength/passwordStrengthIndicator";
import { validatePassword } from "@/lib/passwordUtils";

interface SecurePasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  showStrength?: boolean;
  showConfirmation?: boolean;
  confirmValue?: string;
  onConfirmChange?: (value: string) => void;
  error?: string | null;
  helperText?: string;
}

/**
 * Componente de input seguro para contraseñas
 * Incluye validación en tiempo real e indicador de fortaleza
 */
export default function SecurePasswordInput({
  value,
  onChange,
  onValidationChange,
  placeholder = "Contraseña",
  label,
  disabled = false,
  className = "text-xs h-8",
  showStrength = true,
  showConfirmation = false,
  confirmValue = "",
  onConfirmChange,
  error,
  helperText,
}: SecurePasswordInputProps) {
  const [internalError, setInternalError] = React.useState<string | null>(null);

  const handleChange = (newValue: string) => {
    onChange(newValue);

    if (newValue.length === 0) {
      setInternalError(null);
      onValidationChange?.(false);
      return;
    }

    const validation = validatePassword(newValue);
    setInternalError(validation.error || null);
    onValidationChange?.(validation.isValid, validation.error);

    // Validar coincidencia si hay confirmación
    if (showConfirmation && confirmValue && newValue !== confirmValue) {
      setInternalError("Las contraseñas no coinciden");
      onValidationChange?.(false, "Las contraseñas no coinciden");
    } else if (showConfirmation && confirmValue && newValue === confirmValue) {
      setInternalError(null);
      onValidationChange?.(true);
    }
  };

  const handleConfirmChange = (newConfirm: string) => {
    onConfirmChange?.(newConfirm);

    if (value && newConfirm !== value) {
      setInternalError("Las contraseñas no coinciden");
      onValidationChange?.(false, "Las contraseñas no coinciden");
    } else if (value && newConfirm === value) {
      const validation = validatePassword(value);
      if (validation.isValid) {
        setInternalError(null);
        onValidationChange?.(true);
      }
    }
  };

  const displayError = error || internalError;

  return (
    <div className="space-y-2">
      {/* Campo de contraseña principal */}
      {label && (
        <label className="text-xs font-semibold text-muted-foreground uppercase">
          {label}
        </label>
      )}
      <Input
        type="password"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`${className} ${
          displayError ? "border-red-500 focus:ring-red-500" : ""
        }`}
        autoComplete="new-password"
      />

      {/* Campo de confirmación (opcional) */}
      {showConfirmation && (
        <Input
          type="password"
          value={confirmValue}
          onChange={(e) => handleConfirmChange(e.target.value)}
          placeholder="Confirmar contraseña"
          disabled={disabled}
          className={`${className} ${
            displayError ? "border-red-500 focus:ring-red-500" : ""
          }`}
          autoComplete="new-password"
        />
      )}

      {/* Indicador de fortaleza (opcional) */}
      {showStrength && value && (
        <PasswordStrengthIndicator password={value} />
      )}

      {/* Mensajes de error */}
      {displayError && (
        <p className="text-xs text-red-500 font-medium">{displayError}</p>
      )}

      {/* Texto de ayuda */}
      {helperText && !displayError && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
