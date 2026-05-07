CREATE TABLE tareas (
    id_tarea INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_usuario_creador INT NULL,
    id_estado INT NOT NULL,
    id_prioridad INT NOT NULL,

    titulo NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(MAX) NULL,

    fecha_creacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    fecha_inicio DATETIME2 NULL,
    fecha_completado DATETIME2 NULL,
    fecha_limite DATETIME2 NULL,
    ultima_notificacion DATETIME2 NULL,
    nota_cierre NVARCHAR(MAX) NULL,

    CONSTRAINT fk_tareas_usuario 
        FOREIGN KEY (id_usuario) 
        REFERENCES usuario(id_usuario),

    CONSTRAINT fk_tareas_usuario_creador
        FOREIGN KEY (id_usuario_creador) 
        REFERENCES usuario(id_usuario),

    CONSTRAINT fk_tareas_estado 
        FOREIGN KEY (id_estado) 
        REFERENCES estadosTarea(id_estado),

    CONSTRAINT fk_tareas_prioridad 
        FOREIGN KEY (id_prioridad) 
        REFERENCES prioridadesTarea(id_prioridad)
);

