package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set; // ✅ Cambiar de List a Set

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "Sub_Modulo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class SubModulo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sub_modulo")
    private Integer idSubModulo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_modulo_fk", nullable = false)
    @JsonIgnoreProperties("subModulos")  // 👈 IMPORTANTE
    private Modulo modulo;
    
    @Column(name = "submodulo", nullable = false, length = 50)
    private String submodulo;
    
    @Column(name = "ruta", nullable = true, length = 50)
    private String ruta;
    
    @Column(name = "iconos", nullable = false, length = 10)
    private String iconos;
    
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion = LocalDateTime.now();
    
    @OneToMany(mappedBy = "subModulo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("subModulo")
    private Set<PermisoSubModulo> permisos = new HashSet<>();

	public Integer getIdSubModulo() {
		return idSubModulo;
	}

	public void setIdSubModulo(Integer idSubModulo) {
		this.idSubModulo = idSubModulo;
	}

	public Modulo getModulo() {
		return modulo;
	}

	public void setModulo(Modulo modulo) {
		this.modulo = modulo;
	}

	public String getSubmodulo() {
		return submodulo;
	}

	public void setSubmodulo(String submodulo) {
		this.submodulo = submodulo;
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

	public Set<PermisoSubModulo> getPermisos() {
		return permisos;
	}

	public void setPermisos(Set<PermisoSubModulo> permisos) {
		this.permisos = permisos;
	}
    
    
    
}