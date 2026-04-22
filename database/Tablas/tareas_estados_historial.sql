CREATE TABLE tareas_estados_historial (
    id_historial BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_tarea INT NOT NULL,
    id_estado INT NOT NULL,
    fecha_inicio DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_fin DATETIME2 NULL,
    duracion_segundos BIGINT NULL,
    
    CONSTRAINT fk_historial_tarea 
        FOREIGN KEY (id_tarea) 
        REFERENCES tareas(id_tarea),
        
    CONSTRAINT fk_historial_estado 
        FOREIGN KEY (id_estado) 
        REFERENCES estadosTarea(id_estado)
);
