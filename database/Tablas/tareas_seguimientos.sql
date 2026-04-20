CREATE TABLE tareas_seguimientos (
    id_seguimiento BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_tarea INT NOT NULL,
    id_usuario INT NOT NULL,
    mensaje NVARCHAR(1000) NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    
    CONSTRAINT fk_seguimiento_tarea 
        FOREIGN KEY (id_tarea) 
        REFERENCES tareas(id_tarea),
        
    CONSTRAINT fk_seguimiento_usuario 
        FOREIGN KEY (id_usuario) 
        REFERENCES usuario(id_usuario)
);
