package com.bgreenNet.bgreenNet.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModuloDTO {
    private String nombre;
    private String ruta;
    private String icono;
    private Boolean expandido = false;
    private List<SubModuloDTO> subModulos;
	public String getNombre() {
		return nombre;
	}
	public void setNombre(String nombre) {
		this.nombre = nombre;
	}
	public String getRuta() {
		return ruta;
	}
	public void setRuta(String ruta) {
		this.ruta = ruta;
	}
	public String getIcono() {
		return icono;
	}
	public void setIcono(String icono) {
		this.icono = icono;
	}
	public Boolean getExpandido() {
		return expandido;
	}
	public void setExpandido(Boolean expandido) {
		this.expandido = expandido;
	}
	public List<SubModuloDTO> getSubModulos() {
		return subModulos;
	}
	public void setSubModulos(List<SubModuloDTO> subModulos) {
		this.subModulos = subModulos;
	}
    
    
}
