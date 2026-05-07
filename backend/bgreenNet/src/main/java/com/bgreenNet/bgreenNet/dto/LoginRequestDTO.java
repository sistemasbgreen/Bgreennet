package com.bgreenNet.bgreenNet.dto;

import lombok.Data;

@Data
public class LoginRequestDTO {
	
	
    private String usuario;
    private String contrasena;
    
	public String getUsuario() {
		return usuario;
	}
	public void setUsuario(String usuario) {
		this.usuario = usuario;
	}
	public String getContrasena() {
		return contrasena;
	}
	public void setContrasena(String contrasena) {
		this.contrasena = contrasena;
	}

    
    
	
	

}
