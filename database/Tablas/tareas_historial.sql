CREATE TABLE tareas_historial (
    id_historial INT IDENTITY(1,1) PRIMARY KEY,
    id_tarea INT NOT NULL,
    id_estado_anterior INT,
    id_estado_nuevo INT,
    fecha_cambio DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT fk_historial_tarea
        FOREIGN KEY (id_tarea) REFERENCES tareas(id_tarea),

    CONSTRAINT fk_historial_estado_ant
        FOREIGN KEY (id_estado_anterior) REFERENCES estadosTarea(id_estado),

    CONSTRAINT fk_historial_estado_nuevo
        FOREIGN KEY (id_estado_nuevo) REFERENCES estadosTarea(id_estado)
);
