package com.bgreenNet.bgreenNet.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "Empresa")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Empresa {
	
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_empresa")
    private Integer idEmpresa;

    @Column(name = "descripcionEmpresa", nullable = false)
    private String descripcionEmpresa;

    @Column(name = "date_create")
    private LocalDateTime dateCreate;

    @Column(name = "date_Modify")
    private LocalDateTime dateModify;

    @Column(name = "activo")
    private Integer activo = 1;

	public Integer getIdEmpresa() {
		return idEmpresa;
	}

	public void setIdEmpresa(Integer idEmpresa) {
		this.idEmpresa = idEmpresa;
	}

	public String getDescripcionEmpresa() {
		return descripcionEmpresa;
	}

	public void setDescripcionEmpresa(String descripcionEmpresa) {
		this.descripcionEmpresa = descripcionEmpresa;
	}

	public LocalDateTime getDateCreate() {
		return dateCreate;
	}

	public void setDateCreate(LocalDateTime dateCreate) {
		this.dateCreate = dateCreate;
	}

	public LocalDateTime getDateModify() {
		return dateModify;
	}

	public void setDateModify(LocalDateTime dateModify) {
		this.dateModify = dateModify;
	}

	public Integer getActivo() {
		return activo;
	}

	public void setActivo(Integer activo) {
		this.activo = activo;
	}
    
    

}
