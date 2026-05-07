package com.bgreenNet.bgreenNet.dto;

public class CrearPerfilDTO {

	private String descripcionPerfil;
	private Boolean activo = true;
	
	
	
	public String getDescripcionPerfil() {
		return descripcionPerfil;
	}
	public void setDescripcionPerfil(String descripcionPerfil) {
		this.descripcionPerfil = descripcionPerfil;
	}
	public Boolean getActivo() {
		return activo;
	}
	public void setActivo(Boolean activo) {
		this.activo = activo;
	}
	
	
	
}
