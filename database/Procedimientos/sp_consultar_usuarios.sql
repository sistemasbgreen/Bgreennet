use [BgreenNet_Dev]
go
create procedure sp_consultar_usuarios
AS
BEGIN
SELECT 
        de.Id_usuario_fk AS Id_usuario,
		de.Id_detalle_usuario,
        de.nombre,
        de.identificacion,
        de.apellido,
        de.razon_social,
        de.correo,
        de.celular,
        de.fecha_nacimiento,
		de.Id_tipoidentificacion_fk,
        u.activo AS EstadoUsuario,
        u.ultima_conexion,
        per.descripcionPerfil,
        ar.descripcionArea,
        em.descripcionEmpresa,
		ca.descripcionCargo,
		u.usuario,
		u.Id_area_fk,
		u.Id_empresa_fk,
		u.Id_perfil_fk,
		u.Id_cargo_fk
    FROM DetalleUsuario AS de
    INNER JOIN Usuario AS u 
        ON de.Id_usuario_fk = u.Id_usuario
		inner join Area as ar
		on u.id_area_fk = ar.Id_area
		inner join Empresa as em
		on u.Id_empresa_fk =  em.Id_empresa
		inner join Perfil as per
		on u.Id_perfil_fk = per.Id_perfil
		inner join Cargo as ca
		on u.Id_cargo_fk = ca.Id_cargo
		
END


