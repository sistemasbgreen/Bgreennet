package com.bgreenNet.bgreenNet.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.LoginRequestDTO;
import com.bgreenNet.bgreenNet.dto.LoginResponseDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	 private final JdbcTemplate jdbcTemplate;

	    @Autowired
	    public AuthService(JdbcTemplate jdbcTemplate) {
	        this.jdbcTemplate = jdbcTemplate;
	    }
	    

	    
	    @SuppressWarnings("deprecation")
		public LoginResponseDTO login(LoginRequestDTO request) {
	        String sql = "{call sp_login_usuario(?, ?)}";

	        return jdbcTemplate.queryForObject(sql,
	            new Object[]{request.getUsuario(), request.getContrasena()},
	            (rs, rowNum) -> {
	            	 LoginResponseDTO dto = new LoginResponseDTO();
	                    dto.setId_usuario(rs.getInt("Id_usuario"));	                    
	                    dto.setUsuario(rs.getString("usuario"));
	                    dto.setId_detalle_usuario(rs.getInt("id_detalle_usuario"));
	                    dto.setNombre(rs.getString("nombre"));
	                    dto.setApellido(rs.getString("apellido"));         
	                    dto.setId_perfil_fk(rs.getInt("Id_perfil_fk"));
	                    dto.setId_empresa_fk(rs.getInt("Id_empresa_fk"));
	                    dto.setId_area_fk(rs.getInt("id_area_fk"));
	                    dto.setId_cargo_fk(rs.getInt("id_cargo_fk"));	                    
	                    dto.setPerfil_descripcion(rs.getString("perfil_descripcion"));
	                    dto.setEmpresa_descripcion(rs.getString("empresa_descripcion"));
	                    dto.setArea_descripcion(rs.getString("area_descripcion"));
	                    dto.setCargo_descripcion(rs.getString("cargo_descripcion"));
	                    dto.setCorreo(rs.getString("correo"));
	                    return dto;
	            }
	        );
	    }
	    
	    
	    
}
