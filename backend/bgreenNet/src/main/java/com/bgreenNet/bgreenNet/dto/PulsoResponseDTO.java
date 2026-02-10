package com.bgreenNet.bgreenNet.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class PulsoResponseDTO {
    private Long idPulso;
    private String titulo;
    private String descripcion;
    private String imagenUrl;
    private String imagenNombreOriginal;
    private String imagenTipoMime;
    private Integer imagenTamanoBytes;
    private LocalDateTime fechaFinal;
    private LocalDateTime dateCreate;
    private LocalDateTime dateModify;
    private Boolean activo;
    private String creadoPor;
	public Long getIdPulso() {
		return idPulso;
	}
	public void setIdPulso(Long idPulso) {
		this.idPulso = idPulso;
	}
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
	public String getImagenUrl() {
		return imagenUrl;
	}
	public void setImagenUrl(String imagenUrl) {
		this.imagenUrl = imagenUrl;
	}
	public String getImagenNombreOriginal() {
		return imagenNombreOriginal;
	}
	public void setImagenNombreOriginal(String imagenNombreOriginal) {
		this.imagenNombreOriginal = imagenNombreOriginal;
	}
	public String getImagenTipoMime() {
		return imagenTipoMime;
	}
	public void setImagenTipoMime(String imagenTipoMime) {
		this.imagenTipoMime = imagenTipoMime;
	}
	public Integer getImagenTamanoBytes() {
		return imagenTamanoBytes;
	}
	public void setImagenTamanoBytes(Integer imagenTamanoBytes) {
		this.imagenTamanoBytes = imagenTamanoBytes;
	}
	public LocalDateTime getFechaFinal() {
		return fechaFinal;
	}
	public void setFechaFinal(LocalDateTime fechaFinal) {
		this.fechaFinal = fechaFinal;
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
	public Boolean getActivo() {
		return activo;
	}
	public void setActivo(Boolean activo) {
		this.activo = activo;
	}
	public String getCreadoPor() {
		return creadoPor;
	}
	public void setCreadoPor(String creadoPor) {
		this.creadoPor = creadoPor;
	}

    
    
}
