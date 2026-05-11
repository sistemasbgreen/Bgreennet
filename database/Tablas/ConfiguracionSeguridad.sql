
/***************************
Project      : BgreenNet
Created By   : Antigravity AI
Created Date : 11/05/2026
Description  : Scripts para configuración de seguridad (Expiración, Intentos, Complejidad)
***************************/

USE BgreenNet_Dev;
GO

-- 1. Crear tabla ConfiguracionSeguridad
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ConfiguracionSeguridad]') AND type in (N'U'))
BEGIN
    CREATE TABLE ConfiguracionSeguridad (
        id_configuracion INT IDENTITY(1,1) PRIMARY KEY,
        expiracion_dias INT NOT NULL DEFAULT 90, -- (90, 60, 30, 0 para nunca)
        intentos_invalidos INT NOT NULL DEFAULT 5, -- (10, 5, 3, 0 para sin limite)
        min_caracteres INT NOT NULL DEFAULT 8,
        requiere_letras BIT NOT NULL DEFAULT 1,
        requiere_numeros BIT NOT NULL DEFAULT 1,
        requiere_especiales BIT NOT NULL DEFAULT 1,
        date_create DATETIME NOT NULL DEFAULT GETDATE(),
        date_modify DATETIME NOT NULL DEFAULT GETDATE()
    );

    -- Insertar configuración inicial por defecto
    INSERT INTO ConfiguracionSeguridad (expiracion_dias, intentos_invalidos, min_caracteres, requiere_letras, requiere_numeros, requiere_especiales)
    VALUES (90, 5, 8, 1, 1, 1);
END
GO

-- 2. Actualizar tabla Usuario para rastrear seguridad
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Usuario]') AND name = 'fecha_actualizacion_contrasena')
BEGIN
    ALTER TABLE Usuario ADD fecha_actualizacion_contrasena DATETIME NOT NULL DEFAULT GETDATE();
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Usuario]') AND name = 'intentos_fallidos')
BEGIN
    ALTER TABLE Usuario ADD intentos_fallidos INT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Usuario]') AND name = 'bloqueado')
BEGIN
    ALTER TABLE Usuario ADD bloqueado BIT NOT NULL DEFAULT 0;
END
GO

