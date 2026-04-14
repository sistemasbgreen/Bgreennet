/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 11/04/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    11/04/2025      tipos_documento

***************************/

use BgreenNet_Dev;

CREATE TABLE tipos_documento (
    id INT IDENTITY PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE, -- TEP, EI, EDP, AI
    descripcion VARCHAR(100)
);

INSERT INTO tipos_documento (codigo, descripcion)
VALUES 
('TEP', 'Tipo TEP'),
('EI', 'Entrada Inventario'),
('EDP', 'Entrada Producción'),
('AI', 'Ajuste Inventario');