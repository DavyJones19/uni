# Mejoras al Campo de Contraseña (pwd) para Usuarios

## Resumen de Cambios

Se han implementado mejoras significativas de seguridad y UX en el manejo de contraseñas de usuarios, integrando validación robusta, indicadores visuales y endpoints seguros.

## Archivos Modificados

### 1. **UsersFormModal.tsx** 
`app/(dashboard)/gestionar/users/UsersFormModal.tsx`

**Cambios:**
- ✅ Integración del esquema de validación `bankPasswordSchema`
- ✅ Indicador visual de fortaleza de contraseña (`PasswordStrengthIndicator`)
- ✅ Validación en tiempo real con feedback inmediato
- ✅ Mejora en `handleSubmit()` para separar cambios de contraseña
- ✅ Limpieza automática del estado de contraseña por seguridad

**Características nuevas:**
- Campo de contraseña mejorado con indicador de fortaleza
- Validación client-side que sigue las mismas reglas del servidor
- En modo edición: se valida solo si el usuario intenta cambiar la contraseña
- En modo inserción: contraseña es obligatoria y debe ser válida

---

### 2. **Middleware mejorado**
`app/middleware.ts`

**Cambios:**
- ✅ Rate limiting más estricto para endpoints de cambio de contraseña (máx 3 intentos)
- ✅ Headers de seguridad adicionales: `Cache-Control: no-store`
- ✅ Cobertura para nuevos endpoints de seguridad

---

### 3. **Nuevo endpoint de cambio de contraseña**
`app/api/change-password/route.ts`

**Características:**
- ✅ Validación server-side con `bankPasswordSchema`
- ✅ Verificación contra Have I Been Pwned (sin enviar la contraseña completa - k-anonymity)
- ✅ Hashing seguro con bcrypt (cost factor 12)
- ✅ Auditoría de cambios de contraseña
- ✅ Headers de seguridad: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`

**Uso:**
```typescript
POST /api/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "123",
  "password": "Contraseña$Fuerte1"
}

Response:
{
  "success": true,
  "message": "Contraseña actualizada correctamente"
}
```

---

### 4. **Utilidades de contraseña**
`lib/passwordUtils.ts` (NUEVO)

**Funciones proporcionadas:**
- `validatePassword()`: Validar contraseña localmente
- `changeUserPassword()`: Cambiar contraseña de usuario (client-side wrapper)
- `calculatePasswordStrength()`: Calcular puntuación de fortaleza
- `getPasswordStrengthLabel()`: Obtener etiqueta y color

**Ejemplo de uso:**
```typescript
import { validatePassword, changeUserPassword } from "@/lib/passwordUtils";

// Validar
const { isValid, error } = validatePassword(userPassword);

// Cambiar
const result = await changeUserPassword(userId, newPassword, token);
if (result.success) {
  console.log("✅", result.message);
}
```

---

### 5. **Componente SecurePasswordInput reutilizable**
`components/ui/passwordStrength/securePasswordInput.tsx` (NUEVO)

**Características:**
- Validación en tiempo real
- Indicador de fortaleza integrado
- Campo de confirmación de contraseña (opcional)
- Manejo de errores
- Texto de ayuda personalizable

**Ejemplo de uso:**
```tsx
import SecurePasswordInput from "@/components/ui/passwordStrength/securePasswordInput";

<SecurePasswordInput
  value={password}
  onChange={setPassword}
  label="Nueva Contraseña"
  showStrength={true}
  showConfirmation={true}
  confirmValue={confirmPassword}
  onConfirmChange={setConfirmPassword}
  onValidationChange={(isValid, error) => {
    setIsPasswordValid(isValid);
    if (error) console.log("Error:", error);
  }}
/>
```

---

## Requisitos de Contraseña (Esquema Zod)

El campo `bankPasswordSchema` valida:

| Criterio | Requisito |
|----------|-----------|
| **Longitud** | 8-16 caracteres |
| **Mayúsculas** | Al menos 1 |
| **Minúsculas** | Al menos 1 |
| **Números** | Al menos 1 |
| **Caracteres especiales** | Al menos 1 (`!@#$%^&*()_+-=[]{}`;:,.<>?`) |
| **Sin espacios** | No permitidos |
| **Sin repeticiones** | Máx 2 caracteres iguales seguidos |
| **Secuencias comunes** | Evita "123456", "password", "qwerty", "abcdef" |

**Ejemplo válido:** `Segura$2024pwd`

---

## Flujo de Cambio de Contraseña (Edit Mode)

```
1. Usuario abre modal de edición
2. Completa otros campos (nombre, perfil, usuario)
3. Si ingresa contraseña:
   ├─ Se valida en tiempo real (client-side)
   ├─ Se muestra indicador de fortaleza
   └─ Se valida contra el esquema
4. Al submit:
   ├─ Actualiza datos del usuario (sin pwd)
   ├─ Si hay pwd válida:
   │  ├─ Llama a /api/change-password
   │  ├─ Valida server-side
   │  ├─ Verifica Have I Been Pwned
   │  ├─ Hashea con bcrypt
   │  └─ Guarda en BD
   └─ Limpia estado de contraseña
```

---

## Flujo de Creación de Usuario (Insert Mode)

```
1. Usuario abre modal de nuevo usuario
2. Completa todos los campos (incluida contraseña)
3. Contraseña:
   ├─ Se valida en tiempo real
   ├─ Indicador de fortaleza visible
   └─ Debe cumplir todas las reglas
4. Al submit:
   ├─ Valida todos los campos
   ├─ Envía datos incluyendo pwd al /api/insertar
   ├─ El backend debe:
   │  ├─ Validar con bankPasswordSchema
   │  ├─ Verificar Have I Been Pwned
   │  └─ Hashear antes de guardar
   └─ Limpia formulario
```

---

## Seguridad Implementada

### Client-side
- ✅ Validación en tiempo real (feedback instantáneo)
- ✅ Indicador visual de fortaleza
- ✅ Campo `autoComplete="new-password"` para prevenir auto-relleno inseguro
- ✅ Limpieza automática del estado después del envío

### Server-side
- ✅ **Rate limiting**: Máx 3 intentos por endpoint de cambio de contraseña
- ✅ **Validación Zod**: Schema estricto en el servidor
- ✅ **Have I Been Pwned**: Verifica contra base de datos de contraseñas comprometidas
- ✅ **Hashing bcrypt**: Cost factor 12 (estándar para banca)
- ✅ **Headers de seguridad**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000`
  - `Cache-Control: no-store, no-cache`
- ✅ **Auditoría**: Log de cambios de contraseña (sin guardar la contraseña)
- ✅ **CORS y HTTPS** (en producción)

---

## Próximas Mejoras (Opcionales)

1. **Rate Limiting con Redis**
   ```typescript
   // Usar Upstash o Redis para rate limiting distribuido
   import { Ratelimit } from "@upstash/ratelimit";
   ```

2. **Autenticación Multi-Factor**
   - Requerir confirmación por email
   - Código TOTP

3. **Historial de Contraseñas**
   - Prevenir reutilización de últimas N contraseñas

4. **Alertas de Cambio**
   - Notificar al usuario por email

5. **Integración con Gestión de Secretos**
   - Usar HashiCorp Vault o similares

---

## Testing Recomendado

```typescript
// Validar contraseña local
import { validatePassword } from "@/lib/passwordUtils";

describe("Password Validation", () => {
  it("accepts strong passwords", () => {
    const result = validatePassword("Segura$2024pwd");
    expect(result.isValid).toBe(true);
  });

  it("rejects weak passwords", () => {
    const result = validatePassword("123456");
    expect(result.isValid).toBe(false);
  });

  it("rejects common sequences", () => {
    const result = validatePassword("Password123!");
    expect(result.isValid).toBe(false);
  });
});
```

---

## Documentación API

### POST /api/change-password
Cambia la contraseña de un usuario específico.

**Headers requeridos:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "user-id-123",
  "password": "NewPassword123!"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada correctamente"
}
```

**Error (400):**
```json
{
  "error": "Contraseña no cumple requisitos de seguridad",
  "details": [
    {
      "path": "password",
      "message": "Al menos un carácter especial"
    }
  ]
}
```

**Error (401):**
```json
{
  "error": "No autorizado"
}
```

**Error (429):**
```json
{
  "error": "Demasiados intentos. Intente más tarde."
}
```

---

## Configuración Necesaria (Backend)

Asegúrate de que tus endpoints `/api/editar` e `/api/insertar`:

1. **Validen la contraseña** con `bankPasswordSchema`
2. **Hasheen antes de guardar** (usar bcrypt cost factor 12)
3. **Verifiquen Have I Been Pwned** (opcional pero recomendado)
4. **Logueen cambios** para auditoría

Ejemplo:
```typescript
// En tus endpoints de editar/insertar
import bcrypt from "bcrypt";
import { bankPasswordSchema } from "@/lib/passwordValidation";

if (body.pwd) {
  // Validar
  const validation = bankPasswordSchema.safeParse(body.pwd);
  if (!validation.success) {
    return NextResponse.json({ error: "Contraseña inválida" }, { status: 400 });
  }
  
  // Hashear
  body.pwd = await bcrypt.hash(body.pwd, 12);
}
```

---

## Notas Importantes

⚠️ **IMPORTANTE**: 
- Nunca transmitas contraseñas en texto plano
- Siempre usa HTTPS en producción
- Implementa HTTPS y cookies seguras (SameSite, Secure, HttpOnly)
- Mantén bcrypt cost factor ≥ 12
- Realiza auditorías de seguridad periódicamente

---

## Referencias

- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Have I Been Pwned API](https://haveibeenpwned.com/API/v3)
- [bcrypt.js Documentation](https://github.com/dcodeIO/bcrypt.js)
- [Zod Schema Validation](https://zod.dev/)

