package com.bgreenNet.bgreenNet.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsignarPermisoModulosDTO {

	@NotNull(message = "El ID del perfil es obligatorio")
	private Integer idPerfil;

	@NotNull(message = "El ID del submódulo es obligatorio")
	private Integer idSubModulo;

	@NotNull(message = "El estado activo es obligatorio")
	private Boolean activo;

	public Integer getIdPerfil() {
		return idPerfil;
	}

	public void setIdPerfil(Integer idPerfil) {
		this.idPerfil = idPerfil;
	}

	public Integer getIdSubModulo() {
		return idSubModulo;
	}

	public void setIdSubModulo(Integer idSubModulo) {
		this.idSubModulo = idSubModulo;
	}

	public Boolean getActivo() {
		return activo;
	}

	public void setActivo(Boolean activo) {
		this.activo = activo;
	}
	
	
	

}
