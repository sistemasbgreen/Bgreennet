/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 14/11/2025
Description  : procedimiento 
History      : -Login / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    27/10/2025      Creacion Procedimiento Sp_Home_Contacto

***************************/
CREATE PROCEDURE Sp_Home_Contacto
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        CONCAT(detausu.nombre, ' ', detausu.apellido) AS Nombre,
        CONCAT(c.descripcionCargo, ' ', a.descripcionArea) AS Cargo,
        detausu.correo,
        detausu.celular AS Ext
    FROM DetalleUsuario AS detausu
    INNER JOIN Usuario AS usu
        ON detausu.id_usuario_fk = usu.id_usuario
    INNER JOIN Cargo AS c
        ON usu.id_cargo_fk = c.id_cargo
    INNER JOIN Area AS a
        ON usu.id_area_fk = a.id_area;
END;