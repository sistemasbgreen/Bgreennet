package com.bgreenNet.bgreenNet.dto;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class PulsoUpdateDTO {

private Long id;
private String titulo;
private String descripcion;
private String imagenUrl;
private String imagenNombreOriginal;
private String imagenTipoMime;
private Integer imagenTamanoBytes;
private LocalDateTime fechaFinal;
private Boolean activo;
private LocalDateTime fechaActivacion;
public Long getId() {
	return id;
}
public void setId(Long id) {
	this.id = id;
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
public Boolean getActivo() {
	return activo;
}
public void setActivo(Boolean activo) {
	this.activo = activo;
}
public LocalDateTime getFechaActivacion() {
	return fechaActivacion;
}
public void setFechaActivacion(LocalDateTime fechaActivacion) {
	this.fechaActivacion = fechaActivacion;
}


	    
}
