/***************************
Project      : BgreenNet
Created By   : Jose Angulo
Created Date : 27/10/2025
Description  : procedimeinto 
History      : -Login / 
---------------------------------------------------------------------------------
VERSION  AUTHOR         DATE            Description
1.0      Jose Angulo    27/10/2025      Creacion Procedimiento sp_login_usuario

***************************/


ALTER PROCEDURE [dbo].[sp_login_usuario]
    @usuario NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

   SELECT 
        u.id_usuario,
        u.usuario,
		du.id_detalle_usuario,
		du.nombre,
        du.apellido,
        u.id_perfil_fk,
        u.id_empresa_fk,
        u.id_area_fk,
        u.id_cargo_fk,
        p.descripcionPerfil AS perfil_descripcion,
        e.descripcionEmpresa AS empresa_descripcion,
        a.descripcionArea AS area_descripcion,
        c.descripcionCargo AS cargo_descripcion,

        du.correo
    FROM Usuario u
    INNER JOIN Perfil p ON u.id_perfil_fk = p.id_perfil
    INNER JOIN Empresa e ON u.id_empresa_fk = e.id_empresa
    INNER JOIN Area a ON u.id_area_fk = a.id_area
    INNER JOIN Cargo c ON u.id_cargo_fk = c.id_cargo
    LEFT JOIN DetalleUsuario du ON du.id_usuario_fk = u.id_usuario
    WHERE 
        u.usuario = @usuario
        AND u.activo = 1;
END;
