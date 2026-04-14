/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 11/04/2025
Description  : Tabla 
History      : - / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    11/04/2025      tipo_movimiento

***************************/

use BgreenNet_Dev;

CREATE TABLE tipo_movimiento (
    id INT IDENTITY PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE, -- CONSUMO / PRODUCCION
    descripcion VARCHAR(100)
);

INSERT INTO tipo_movimiento (codigo, descripcion)
VALUES 
('CONSUMO'),
('PRODUCCION');