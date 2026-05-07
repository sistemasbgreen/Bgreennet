package com.bgreenNet.bgreenNet.models;

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
@Table(name = "Tipoidentificacion")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoIdentificacion {
	
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id_tipoidentificacion")
    private Integer idTipoIdentificacion;

    @Column(name = "descripcion", nullable = false)
    private String descripcion;

    @Column(name = "activo", nullable = false)
    private Integer activo= 1;

	public Integer getIdTipoIdentificacion() {
		return idTipoIdentificacion;
	}

	public void setIdTipoIdentificacion(Integer idTipoIdentificacion) {
		this.idTipoIdentificacion = idTipoIdentificacion;
	}

	public String getDescripcion() {
		return descripcion;
	}

	public void setDescripcion(String descripcion) {
		this.descripcion = descripcion;
	}

	public Integer getActivo() {
		return activo;
	}

	public void setEstado(Integer activo) {
		this.activo = activo;
	}

}
