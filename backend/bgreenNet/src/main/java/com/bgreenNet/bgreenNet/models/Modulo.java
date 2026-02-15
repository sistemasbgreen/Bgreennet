package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set; // ✅ Cambiar de List a Set

@Entity
@Table(name = "Modulo")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Modulo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_modulo")
    private Integer idModulo;
    
    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;
    
    @Column(name = "ruta", nullable = true, length = 100)
    private String ruta;
    
    @Column(name = "iconos", nullable = false, length = 10)
    private String iconos;
    
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();
    
    @OneToMany(mappedBy = "modulo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<SubModulo> subModulos = new HashSet<>(); // ✅ Cambiar a Set

	public Integer getIdModulo() {
		return idModulo;
	}

	public void setIdModulo(Integer idModulo) {
		this.idModulo = idModulo;
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

	public String getIconos() {
		return iconos;
	}

	public void setIconos(String iconos) {
		this.iconos = iconos;
	}

	public Boolean getActivo() {
		return activo;
	}

	public void setActivo(Boolean activo) {
		this.activo = activo;
	}

	public LocalDateTime getFechaCreacion() {
		return fechaCreacion;
	}

	public void setFechaCreacion(LocalDateTime fechaCreacion) {
		this.fechaCreacion = fechaCreacion;
	}

	public Set<SubModulo> getSubModulos() {
		return subModulos;
	}

	public void setSubModulos(Set<SubModulo> subModulos) {
		this.subModulos = subModulos;
	}
    
    
    
}