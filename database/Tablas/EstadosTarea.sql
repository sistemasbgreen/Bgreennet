CREATE TABLE estadosTarea (
    id_estado INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO estadosTarea (nombre)
VALUES ('CREADA'), ('INICIADA'), ('FINALIZADA');

