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
@Table(name = "Cargo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cargo {	
	
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cargo")
    private Integer idCargo;

    @Column(name = "descripcionCargo", nullable = false)
    private String descripcionCargo;

    @Column(name = "date_create")
    private LocalDateTime dateCreate;

    @Column(name = "date_Modify")
    private LocalDateTime dateModify;

    @Column(name = "activo")
    private Integer activo = 1;

	public Integer getIdCargo() {
		return idCargo;
	}

	public void setIdCargo(Integer idCargo) {
		this.idCargo = idCargo;
	}

	public String getDescripcionCargo() {
		return descripcionCargo;
	}

	public void setDescripcionCargo(String descripcionCargo) {
		this.descripcionCargo = descripcionCargo;
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
