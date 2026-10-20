-- Tabla de subtareas vinculadas a una tarea principal
-- Permite dividir una tarea en varias subtareas y asignarlas a múltiples usuarios
IF OBJECT_ID('subtareas', 'U') IS NULL
BEGIN
    CREATE TABLE subtareas (
        id_subtarea BIGINT IDENTITY(1,1) PRIMARY KEY,
        id_tarea INT NOT NULL,
        id_usuario INT NULL,
        titulo NVARCHAR(255) NOT NULL,
        completada BIT NOT NULL DEFAULT 0,
        fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        fecha_completado DATETIME2 NULL,

        CONSTRAINT fk_subtareas_tarea 
            FOREIGN KEY (id_tarea) 
            REFERENCES tareas(id_tarea) 
            ON DELETE CASCADE,

        CONSTRAINT fk_subtareas_usuario 
            FOREIGN KEY (id_usuario) 
            REFERENCES usuario(id_usuario)
    );

    CREATE INDEX idx_subtareas_tarea ON subtareas(id_tarea);
    CREATE INDEX idx_subtareas_usuario ON subtareas(id_usuario);
END;
