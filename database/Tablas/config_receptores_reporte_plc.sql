USE BgreenNet_Dev;
GO
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[config_receptores_reporte_plc]') AND type in (N'U'))
BEGIN
    CREATE TABLE config_receptores_reporte_plc (
        id INT PRIMARY KEY,
        destinatarios VARCHAR(MAX) NOT NULL
    );
    -- Inserta el correo por defecto la primera vez
    INSERT INTO config_receptores_reporte_plc (id, destinatarios) VALUES (1, 'notificaciones@bgreen.com.co');
END
GO