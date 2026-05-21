package com.bgreenNet.bgreenNet.dto;

public class UsuarioCompletoDTO {
	 private Integer idUsuario;
	    private String usuario;
	    private String contrasena; // Solo para crear (¡no devolver en GET!)
	    private Boolean estado; 
    private Boolean bloqueado;
	    private String ultima_conexion;
	    private String descripcionArea;
	    private String descripcionPerfil;
	    private int Id_detalle_usuario;
	    private String identificacion;
	    private String nombre;
	    private String apellido;
	    private String razon_social;
	    private String correo;
	    private String celular;
	    private String fechaNacimiento;
	    private String descripcionCargo;
	    private String  descripcionEmpresa;
	    private int Id_tipoidentificacion_fk;
	    private int Id_empresa_fk;
	    private int Id_perfil_fk;
	    private int Id_area_fk;
	    private int Id_cargo_fk;
		public Integer getIdUsuario() {
			return idUsuario;
		}
		public void setIdUsuario(Integer idUsuario) {
			this.idUsuario = idUsuario;
		}
		public String getUsuario() {
			return usuario;
		}
		public void setUsuario(String usuario) {
			this.usuario = usuario;
		}
		public String getContrasena() {
			return contrasena;
		}
		public void setContrasena(String contrasena) {
			this.contrasena = contrasena;
		}
		public Boolean getEstado() {
			return estado;
		}
		public void setEstado(Boolean estado) {
			this.estado = estado;
		}
		public String getUltima_conexion() {
			return ultima_conexion;
		}
		public void setUltima_conexion(String ultima_conexion) {
			this.ultima_conexion = ultima_conexion;
		}
		public String getDescripcionArea() {
			return descripcionArea;
		}
		public void setDescripcionArea(String descripcionArea) {
			this.descripcionArea = descripcionArea;
		}
		public String getDescripcionPerfil() {
			return descripcionPerfil;
		}
		public void setDescripcionPerfil(String descripcionPerfil) {
			this.descripcionPerfil = descripcionPerfil;
		}
		public int getId_detalle_usuario() {
			return Id_detalle_usuario;
		}
		public void setId_detalle_usuario(int id_detalle_usuario) {
			Id_detalle_usuario = id_detalle_usuario;
		}
		public String getIdentificacion() {
			return identificacion;
		}
		public void setIdentificacion(String identificacion) {
			this.identificacion = identificacion;
		}
		public String getNombre() {
			return nombre;
		}
		public void setNombre(String nombre) {
			this.nombre = nombre;
		}
		public String getApellido() {
			return apellido;
		}
		public void setApellido(String apellido) {
			this.apellido = apellido;
		}
		public String getRazon_social() {
			return razon_social;
		}
		public void setRazon_social(String razon_social) {
			this.razon_social = razon_social;
		}
		public String getCorreo() {
			return correo;
		}
		public void setCorreo(String correo) {
			this.correo = correo;
		}
		public String getCelular() {
			return celular;
		}
		public void setCelular(String celular) {
			this.celular = celular;
		}
		public String getFechaNacimiento() {
			return fechaNacimiento;
		}
		public void setFechaNacimiento(String fechaNacimiento) {
			this.fechaNacimiento = fechaNacimiento;
		}
		public String getDescripcionCargo() {
			return descripcionCargo;
		}
		public void setDescripcionCargo(String descripcionCargo) {
			this.descripcionCargo = descripcionCargo;
		}
		public String getDescripcionEmpresa() {
			return descripcionEmpresa;
		}
		public void setDescripcionEmpresa(String descripcionEmpresa) {
			this.descripcionEmpresa = descripcionEmpresa;
		}
		public int getId_tipoidentificacion_fk() {
			return Id_tipoidentificacion_fk;
		}
		public void setId_tipoidentificacion_fk(int id_tipoidentificacion_fk) {
			Id_tipoidentificacion_fk = id_tipoidentificacion_fk;
		}
		public int getId_empresa_fk() {
			return Id_empresa_fk;
		}
		public void setId_empresa_fk(int id_empresa_fk) {
			Id_empresa_fk = id_empresa_fk;
		}
		public int getId_perfil_fk() {
			return Id_perfil_fk;
		}
		public void setId_perfil_fk(int id_perfil_fk) {
			Id_perfil_fk = id_perfil_fk;
		}
		public int getId_area_fk() {
			return Id_area_fk;
		}
		public void setId_area_fk(int id_area_fk) {
			Id_area_fk = id_area_fk;
		}
		public int getId_cargo_fk() {
			return Id_cargo_fk;
		}
		public void setId_cargo_fk(int id_cargo_fk) {
			Id_cargo_fk = id_cargo_fk;
		}
	    
		public Boolean getBloqueado() {
			return bloqueado;
		}
		public void setBloqueado(Boolean bloqueado) {
			this.bloqueado = bloqueado;
		}
}
