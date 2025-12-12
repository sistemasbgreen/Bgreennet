package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "PermisoSistema")
public class PermisoSistema {

	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_permiso_sistema")
    private Long idPermisoSistema;

    @Column(name = "id_perfil_fk")
    private Integer idPerfilFk;

    @Column(name = "id_sistema_fk")
    private Integer idSistemaFk;

    @Column(name = "activo")
    private Boolean activo;

	public Long getIdPermisoSistema() {
		return idPermisoSistema;
	}

	public void setIdPermisoSistema(Long idPermisoSistema) {
		this.idPermisoSistema = idPermisoSistema;
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
    
}
