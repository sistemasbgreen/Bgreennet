package com.bgreenNet.bgreenNet.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubModuloDTO {

	
	private Integer idSubModulo; // ✅ Agregar ID
    private String nombre;
    private String ruta;
    private String icono;
    private List<String> roles;
	public Integer getIdSubModulo() {
		return idSubModulo;
	}
	public void setIdSubModulo(Integer idSubModulo) {
		this.idSubModulo = idSubModulo;
	}
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
	public List<String> getRoles() {
		return roles;
	}
	public void setRoles(List<String> roles) {
		this.roles = roles;
	}
    
    
    
    
}
