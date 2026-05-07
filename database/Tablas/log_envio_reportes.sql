
 CREATE TABLE [dbo].[log_envio_reportes](<
        [id] [int] IDENTITY(1,1>) PRIMARY KEY,
        [fecha_inicio] [date] NOT NULL,
        [fecha_fin] [date] NOT NULL,
        [fecha_registro] [datetime] DEFAULT GETDATE()
    );



    /* 
   SCRIPT DE MIGRACIÓN - MÓDULO ÓRDENES DE PRODUCCIÓN
   Base de Datos: BgreenNet (Aplicación)
*/

-- 1. Tabla para el historial de reportes enviados (Log)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[log_envio_reportes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[log_envio_reportes](<
        [id] [int] IDENTITY(1,1>) PRIMARY KEY,
        [fecha_inicio] [date] NOT NULL,
        [fecha_fin] [date] NOT NULL,
        [fecha_registro] [datetime] DEFAULT GETDATE()
    );
    PRINT 'Tabla log_envio_reportes creada.';
END

-- 2. Tabla para la configuración dinámica de destinatarios
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[config_receptores_reporte]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[config_receptores_reporte](<
        [id] [int] PRIMARY KEY,
        [destinatarios] [varchar](MAX>) NOT NULL
    );
    
    -- Insertar el valor inicial (ajusta el correo si es necesario)
    INSERT INTO [dbo].[config_receptores_reporte] (id, destinatarios) 
    VALUES (1, 'asistentetic@bgreen.com.co');
    
    PRINT 'Tabla config_receptores_reporte creada e inicializada.';
END
