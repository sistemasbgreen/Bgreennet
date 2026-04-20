CREATE TABLE notificaciones (
    id_notificacion BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    mensaje NVARCHAR(500) NOT NULL,
    tipo NVARCHAR(50) NOT NULL, -- 'NUEVA_TAREA', 'NUEVO_MENSAJE'
    referencia_id BIGINT NOT NULL,
    leido BIT NOT NULL DEFAULT 0,
    fecha DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    
    CONSTRAINT fk_notif_usuario 
        FOREIGN KEY (id_usuario) 
        REFERENCES usuario(id_usuario)
);
