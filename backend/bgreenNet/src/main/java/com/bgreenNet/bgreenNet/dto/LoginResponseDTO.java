package com.bgreenNet.bgreenNet.dto;

import lombok.Data;

@Data
public class LoginResponseDTO {
	
	
    private Integer id_usuario;
    private String usuario;
    private Integer id_detalle_usuario;
    private String nombre;
    private String apellido;
    private Integer id_perfil_fk;
    private Integer id_empresa_fk;
    private Integer id_area_fk;
    private Integer id_cargo_fk;    
    private String perfil_descripcion;
    private String empresa_descripcion;
    private String area_descripcion;
    private String cargo_descripcion;
    private String correo;
    
    
	public Integer getId_usuario() {
		return id_usuario;
	}
	public void setId_usuario(Integer id_usuario) {
		this.id_usuario = id_usuario;
	}
	public String getUsuario() {
		return usuario;
	}
	public void setUsuario(String usuario) {
		this.usuario = usuario;
	}
	public Integer getId_detalle_usuario() {
		return id_detalle_usuario;
	}
	public void setId_detalle_usuario(Integer id_detalle_usuario) {
		this.id_detalle_usuario = id_detalle_usuario;
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
	public Integer getId_perfil_fk() {
		return id_perfil_fk;
	}
	public void setId_perfil_fk(Integer id_perfil_fk) {
		this.id_perfil_fk = id_perfil_fk;
	}
	public Integer getId_empresa_fk() {
		return id_empresa_fk;
	}
	public void setId_empresa_fk(Integer id_empresa_fk) {
		this.id_empresa_fk = id_empresa_fk;
	}
	public Integer getId_area_fk() {
		return id_area_fk;
	}
	public void setId_area_fk(Integer id_area_fk) {
		this.id_area_fk = id_area_fk;
	}
	public Integer getId_cargo_fk() {
		return id_cargo_fk;
	}
	public void setId_cargo_fk(Integer id_cargo_fk) {
		this.id_cargo_fk = id_cargo_fk;
	}
	public String getPerfil_descripcion() {
		return perfil_descripcion;
	}
	public void setPerfil_descripcion(String perfil_descripcion) {
		this.perfil_descripcion = perfil_descripcion;
	}
	public String getEmpresa_descripcion() {
		return empresa_descripcion;
	}
	public void setEmpresa_descripcion(String empresa_descripcion) {
		this.empresa_descripcion = empresa_descripcion;
	}
	public String getArea_descripcion() {
		return area_descripcion;
	}
	public void setArea_descripcion(String area_descripcion) {
		this.area_descripcion = area_descripcion;
	}
	public String getCargo_descripcion() {
		return cargo_descripcion;
	}
	public void setCargo_descripcion(String cargo_descripcion) {
		this.cargo_descripcion = cargo_descripcion;
	}
	public String getCorreo() {
		return correo;
	}
	public void setCorreo(String correo) {
		this.correo = correo;
	}
    
    
    
    
 
    

}
