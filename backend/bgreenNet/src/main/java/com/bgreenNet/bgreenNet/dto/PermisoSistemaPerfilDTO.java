package com.bgreenNet.bgreenNet.dto;

public class PermisoSistemaPerfilDTO {
	
	
	private Integer idSistema;
    private String nombreSistema;
    private Integer idPermiso;
    private Integer idPerfilFk;
    private Integer idSistemaFk;
    private Boolean activo;
    private Boolean tienePermiso;


    public PermisoSistemaPerfilDTO(
        Integer idSistema,
        String nombreSistema,
        Integer idPermiso,
        Integer idPerfilFk,
        Integer idSistemaFk,
        Boolean activo,
        Boolean habilitado
    ) {
        this.idSistema = idSistema;
        this.nombreSistema = nombreSistema;
        this.idPermiso = idPermiso;
        this.idPerfilFk = idPerfilFk;
        this.idSistemaFk = idSistemaFk;
        this.activo = activo;
        this.tienePermiso = habilitado;
    }


	public Integer getIdSistema() {
		return idSistema;
	}


	public void setIdSistema(Integer idSistema) {
		this.idSistema = idSistema;
	}


	public String getNombreSistema() {
		return nombreSistema;
	}


	public void setNombreSistema(String nombreSistema) {
		this.nombreSistema = nombreSistema;
	}


	public Integer getIdPermiso() {
		return idPermiso;
	}


	public void setIdPermiso(Integer idPermiso) {
		this.idPermiso = idPermiso;
	}


	public Integer getIdPerfilFk() {
		return idPerfilFk;
	}


	public void setIdPerfilFk(Integer idPerfilFk) {
		this.idPerfilFk = idPerfilFk;
	}


	public Integer getIdSistemaFk() {
		return idSistemaFk;
	}


	public void setIdSistemaFk(Integer idSistemaFk) {
		this.idSistemaFk = idSistemaFk;
	}


	public Boolean getActivo() {
		return activo;
	}


	public void setActivo(Boolean activo) {
		this.activo = activo;
	}


	public Boolean getTienePermiso() {
		return tienePermiso;
	}


	public void setTienePermiso(Boolean tienePermiso) {
		this.tienePermiso = tienePermiso;
	}



	
	

}
