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
@Table(name = "Area")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Area {

	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_area")
    private Integer idArea;

    @Column(name = "descripcionArea", nullable = false)
    private String descripcionArea;

    @Column(name = "id_direccion_fk") // Si no lo usas, puedes omitirlo o dejarlo como Long
    private Long idDireccionFk; // o Integer, según tu BD

    @Column(name = "activo")
    private Integer activo = 1;

    @Column(name = "date_create")
    private LocalDateTime dateCreate;

    @Column(name = "date_Modify")
    private LocalDateTime dateModify;

	public Integer getIdArea() {
		return idArea;
	}

	public void setIdArea(Integer idArea) {
		this.idArea = idArea;
	}

	public String getDescripcionArea() {
		return descripcionArea;
	}

	public void setDescripcionArea(String descripcionArea) {
		this.descripcionArea = descripcionArea;
	}

	public Long getIdDireccionFk() {
		return idDireccionFk;
	}

	public void setIdDireccionFk(Long idDireccionFk) {
		this.idDireccionFk = idDireccionFk;
	}

	public Integer getActivo() {
		return activo;
	}

	public void setActivo(Integer activo) {
		this.activo = activo;
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
    
    
    
    
}
