USE BgreenNet_Dev;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('metas_servicios_industriales') AND type in ('U'))
BEGIN
    CREATE TABLE metas_servicios_industriales (
        id INT IDENTITY PRIMARY KEY,
        servicio_id VARCHAR(20) NOT NULL, -- 'agua', 'energia', 'vapor', 'gas'
        anio INT NOT NULL,
        mes INT NOT NULL, -- 1 a 12
        valor DECIMAL(18,4) NOT NULL,

        creado_en DATETIME DEFAULT GETDATE(),
        creado_por VARCHAR(100),

        CONSTRAINT UQ_meta_servicio_ind UNIQUE (servicio_id, anio, mes)
    );
END
GO
