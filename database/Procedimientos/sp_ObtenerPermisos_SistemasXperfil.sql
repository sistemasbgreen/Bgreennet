/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 4/12/2025
Description  : procedimeinto 
History      : -Perfil / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    4/12/2025      Creacion de procedimiento sp_ObtenerPermisos_SistemasXperfil

***************************/
CREATE PROCEDURE [dbo].[sp_ObtenerPermisos_SistemasXperfil]
    @id_perfil INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        si.id_sistema,
        si.nombre AS nombreSistema,
        ps.*,
 --       p.descripcionPerfil,
        habilitado = CASE 
            WHEN ps.id_perfil_fk IS NOT NULL THEN 1 
            ELSE 0 
        END
    FROM SistemaInformacion si
    LEFT JOIN PermisoSistema ps 
        ON ps.id_sistema_fk = si.id_sistema 
        AND ps.id_perfil_fk = @id_perfil
    LEFT JOIN Perfil p 
        ON p.id_perfil = @id_perfil
    WHERE si.activo = 1
    ORDER BY si.nombre;
END;