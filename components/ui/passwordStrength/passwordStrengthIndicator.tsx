// components/PasswordStrengthIndicator.tsx
"use client";

interface Props {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: Props) {
  const checks = {
    length: password?.length >= 8 && password?.length <= 16,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    noSpaces: /^\S*$/.test(password),
    noRepeats: !/(.)\1{2,}/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const strength = score <= 3 ? "Débil" : score <= 5 ? "Media" : "Fuerte";
  const color = score <= 3 ? "bg-red-500" : score <= 5 ? "bg-yellow-500" : "bg-green-500";

  const rules = [
    {
      key: "length",
      label: "Longitud mínima",
      description: "Entre 8 y 12 caracteres",
      valid: checks.length,
    },
    {
      key: "uppercase",
      label: "Mayúsculas",
      description: "Al menos 1 letra mayúscula",
      valid: checks.uppercase,
    },
    {
      key: "lowercase",
      label: "Minúsculas",
      description: "Al menos 1 letra minúscula",
      valid: checks.lowercase,
    },
    {
      key: "number",
      label: "Números",
      description: "Al menos 1 dígito numérico",
      valid: checks.number,
    },
    {
      key: "special",
      label: "Caracteres especiales",
      description: "Al menos 1 símbolo (!@#$%^&*()_+-=[]{}...)",
      valid: checks.special,
    },
    {
      key: "noSpaces",
      label: "Sin espacios",
      description: "No se permiten espacios en blanco",
      valid: checks.noSpaces,
    },
    {
      key: "noRepeats",
      label: "No secuencias obvias",
      description: "Máximo 2 caracteres iguales seguidos",
      valid: checks.noRepeats,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Barra de fortaleza */}
      <div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full transition-all ${color}`} 
            style={{ width: `${(score / 7) * 100}%` }}
          />
        </div>
        <p className="text-xs font-semibold mt-1">
          Fortaleza: <span className={color === "bg-red-500" ? "text-red-600" : color === "bg-yellow-500" ? "text-yellow-600" : "text-green-600"}>
            {strength}
          </span> ({score}/7)
        </p>
      </div>

      {/* Grid de reglas responsiva */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rules.map((rule) => (
          <div
            key={rule.key}
            className={`flex items-start p-2 rounded border transition-colors ${
              rule.valid
                ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700"
                : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            }`}
          >
            <span className="mr-2 flex-shrink-0 text-lg">
              {rule.valid ? "✅" : "⭕"}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${
                rule.valid
                  ? "text-green-700 dark:text-green-300"
                  : "text-gray-600 dark:text-gray-400"
              }`}>
                {rule.label}
              </p>
              <p className={`text-xs ${
                rule.valid
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500 dark:text-gray-500"
              }`}>
                {rule.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}