USE BgreenNet_Dev;
GO

/***************************
Project      : BgreenNet
Created Date : 2026-10-31
Description  : Tabla para configuración de supervisión y visibilidad de horarios en Control de Asistencia & Presentismo
***************************/

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[configuracion_supervision_asistencia]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[configuracion_supervision_asistencia] (
        id_supervision INT IDENTITY(1,1) PRIMARY KEY,
        id_supervisor INT NOT NULL,
        cedula_supervisor VARCHAR(50) NOT NULL,
        nombre_supervisor VARCHAR(200) NOT NULL,
        tipo_alcance VARCHAR(30) NOT NULL, -- 'GLOBAL', 'AREA', 'COLABORADOR'
        id_area INT NULL,
        nombre_area VARCHAR(150) NULL,
        cedula_colaborador VARCHAR(50) NULL,
        nombre_colaborador VARCHAR(200) NULL,
        puede_aprobar_horas_extra BIT NOT NULL DEFAULT 1,
        activo BIT NOT NULL DEFAULT 1,
        observacion VARCHAR(300) NULL,
        date_create DATETIME NOT NULL DEFAULT GETDATE(),
        date_modify DATETIME NOT NULL DEFAULT GETDATE()
    );

    CREATE NONCLUSTERED INDEX IX_supervision_supervisor ON [dbo].[configuracion_supervision_asistencia] (id_supervisor, activo);
    CREATE NONCLUSTERED INDEX IX_supervision_cedula_sup ON [dbo].[configuracion_supervision_asistencia] (cedula_supervisor, activo);
END
GO
