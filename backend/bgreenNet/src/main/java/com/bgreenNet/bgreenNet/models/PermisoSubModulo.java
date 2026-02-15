package com.bgreenNet.bgreenNet.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.ForeignKey;

@Entity
@Table(name = "PermisoSubModulo", uniqueConstraints = {
    @UniqueConstraint(name = "UQ_PermisoSubModulo", columnNames = {"id_perfil_fk", "id_submodulo_fk"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermisoSubModulo {

	
	  @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    @Column(name = "id_permiso_submodulo")
	    private Integer idPermisoSubmodulo;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "id_perfil_fk", nullable = false, foreignKey = @ForeignKey(name = "FK_PermisoSubModulo_Perfil"))
	    private Perfil perfil;
	    
	    @ManyToOne(fetch = FetchType.LAZY)
	    @JoinColumn(name = "id_submodulo_fk", nullable = false, foreignKey = @ForeignKey(name = "FK_PermisoSubModulo_SubModulo"))
	    private SubModulo subModulo;
	    
	    @Column(name = "activo", nullable = false)
	    private Boolean activo = true;
	    
	    @Column(name = "fecha_asignacion")
	    private LocalDateTime fechaAsignacion = LocalDateTime.now();

		public Integer getIdPermisoSubmodulo() {
			return idPermisoSubmodulo;
		}

		public void setIdPermisoSubmodulo(Integer idPermisoSubmodulo) {
			this.idPermisoSubmodulo = idPermisoSubmodulo;
		}

		public Perfil getPerfil() {
			return perfil;
		}

		public void setPerfil(Perfil perfil) {
			this.perfil = perfil;
		}

		public SubModulo getSubModulo() {
			return subModulo;
		}

		public void setSubModulo(SubModulo subModulo) {
			this.subModulo = subModulo;
		}

		public Boolean getActivo() {
			return activo;
		}

		public void setActivo(Boolean activo) {
			this.activo = activo;
		}

		public LocalDateTime getFechaAsignacion() {
			return fechaAsignacion;
		}

		public void setFechaAsignacion(LocalDateTime fechaAsignacion) {
			this.fechaAsignacion = fechaAsignacion;
		}
	    
	    
	    
	    
}
