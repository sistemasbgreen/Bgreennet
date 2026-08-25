-- =========================================================================
-- Script de Migración: Agregar columnas de NOVO Connector a ConfiguracionSeguridad
-- Ejecutar en la base de datos de BgreenNet (Dev, Preprod, Prod)
-- =========================================================================

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[ConfiguracionSeguridad]') 
    AND name = N'novo_url'
)
BEGIN
    ALTER TABLE [dbo].[ConfiguracionSeguridad] ADD [novo_url] VARCHAR(255) NULL;
    PRINT 'Columna [novo_url] agregada.';
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[ConfiguracionSeguridad]') 
    AND name = N'novo_api_key'
)
BEGIN
    ALTER TABLE [dbo].[ConfiguracionSeguridad] ADD [novo_api_key] VARCHAR(255) NULL;
    PRINT 'Columna [novo_api_key] agregada.';
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[ConfiguracionSeguridad]') 
    AND name = N'novo_connection_timeout'
)
BEGIN
    ALTER TABLE [dbo].[ConfiguracionSeguridad] ADD [novo_connection_timeout] INT NULL;
    PRINT 'Columna [novo_connection_timeout] agregada.';
END

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'[dbo].[ConfiguracionSeguridad]') 
    AND name = N'novo_read_timeout'
)
BEGIN
    ALTER TABLE [dbo].[ConfiguracionSeguridad] ADD [novo_read_timeout] INT NULL;
    PRINT 'Columna [novo_read_timeout] agregada.';
END
GO
