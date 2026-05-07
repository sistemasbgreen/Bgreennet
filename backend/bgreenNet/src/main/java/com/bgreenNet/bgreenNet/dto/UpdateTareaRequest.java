package com.bgreenNet.bgreenNet.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTareaRequest {
    private String titulo;
    private String descripcion;
    private Integer idEstado;
    private Integer idPrioridad;
    private String notaCierre;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaLimite;
    private Boolean clearFechaLimite = false;

	public String getTitulo() {
		return titulo;
	}
	public void setTitulo(String titulo) {
		this.titulo = titulo;
	}
	public String getDescripcion() {
		return descripcion;
	}
	public void setDescripcion(String descripcion) {
		this.descripcion = descripcion;
	}
	public Integer getIdEstado() {
		return idEstado;
	}
	public void setIdEstado(Integer idEstado) {
		this.idEstado = idEstado;
	}
	public Integer getIdPrioridad() {
		return idPrioridad;
	}
	public void setIdPrioridad(Integer idPrioridad) {
		this.idPrioridad = idPrioridad;
	}
	public String getNotaCierre() {
		return notaCierre;
	}
	public void setNotaCierre(String notaCierre) {
		this.notaCierre = notaCierre;
	}
	public LocalDateTime getFechaLimite() {
		return fechaLimite;
	}
	public void setFechaLimite(LocalDateTime fechaLimite) {
		this.fechaLimite = fechaLimite;
	}
	public Boolean getClearFechaLimite() {
		return clearFechaLimite;
	}
	public void setClearFechaLimite(Boolean clearFechaLimite) {
		this.clearFechaLimite = clearFechaLimite;
	}
}
