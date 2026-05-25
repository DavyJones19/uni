-- Script de corrección para el problema de login
-- Ejecutar en SQL Server Management Studio contra la BD TALENTOS_JUVENIL

-- 1. Aumentar el tamaño de la columna PWD (si no está ya en 200+)
ALTER TABLE dhl_users 
ALTER COLUMN PWD NVARCHAR(200);

-- 2. Actualizar la contraseña con el hash correcto para el usuario mu345
UPDATE DHL_USERS 
SET PWD = '$2a$12$R9u2.zQJbXnkWfN8A2KFeOnv7Z8p3D96gR9v1.Y2r6h7vJ2nF5mS.'
WHERE USUARIO = 'mu345';

-- 3. Verificar que se actualizó correctamente
SELECT ID, USUARIO, PWD, LEN(PWD) as [Longitud_Hash]
FROM DHL_USERS 
WHERE USUARIO = 'mu345';

-- Esperado: El hash debe tener exactamente 60 caracteres (requisito de bcrypt)
