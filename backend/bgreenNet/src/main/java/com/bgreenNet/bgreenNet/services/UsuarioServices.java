package com.bgreenNet.bgreenNet.services;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.UsuarioCompletoDTO;

import jakarta.transaction.Transactional;


@Service
@Transactional
public class UsuarioServices {

	
	private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UsuarioServices(JdbcTemplate jdbcTemplate, 
                          PasswordEncoder passwordEncoder, 
                          LogsService logsService) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder; // ← Asigna
    }
    
   
 // CREAR
    @Transactional
    public void crearUsuario(UsuarioCompletoDTO dto) {
        // ✅ Encriptar la contraseña
        String contrasenaEncriptada = passwordEncoder.encode(dto.getContrasena());

        String sql = "{call sp_crear_usuario(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";
        
        jdbcTemplate.update(sql,
            dto.getUsuario(),          
            contrasenaEncriptada, 
            dto.getId_area_fk(),    
            dto.getId_perfil_fk(),
            dto.getId_cargo_fk(),
            dto.getIdentificacion(),   
            dto.getNombre(),  
            dto.getApellido(),           
            dto.getRazon_social(),      
            dto.getCorreo(),            
            dto.getCelular(),              
            dto.getFechaNacimiento(),               
            dto.getId_empresa_fk(),         
            dto.getId_tipoidentificacion_fk(), 
            null,                          
            dto.getEstado() 
        );
    }
    
    
    
    public List<UsuarioCompletoDTO> listarUsuarios() {
        String sql = "EXEC sp_consultar_usuarios";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            UsuarioCompletoDTO dto = new UsuarioCompletoDTO();             
            dto.setIdUsuario(rs.getInt("Id_usuario"));
            dto.setUsuario(rs.getString("usuario"));
            dto.setNombre(rs.getString("nombre"));
            dto.setIdentificacion(rs.getString("identificacion"));
            dto.setApellido(rs.getString("apellido"));
            dto.setRazon_social(rs.getString("razon_social"));
            dto.setCorreo(rs.getString("correo"));
            dto.setCelular(rs.getString("celular"));
            dto.setEstado(rs.getBoolean("EstadoUsuario"));
            dto.setDescripcionArea(rs.getString("descripcionArea"));
            dto.setDescripcionEmpresa(rs.getString("descripcionEmpresa"));
            dto.setDescripcionPerfil(rs.getString("descripcionPerfil"));
            dto.setFechaNacimiento(rs.getString("fecha_nacimiento"));
            dto.setDescripcionCargo(rs.getString("descripcionCargo"));
            dto.setId_area_fk(rs.getInt("Id_area_fk"));
            dto.setId_empresa_fk(rs.getInt("Id_empresa_fk"));
            dto.setId_perfil_fk(rs.getInt("Id_perfil_fk"));
            dto.setId_cargo_fk(rs.getInt("Id_cargo_fk"));                       
            dto.setId_tipoidentificacion_fk(rs.getInt("Id_tipoidentificacion_fk"));
            dto.setId_detalle_usuario(rs.getInt("Id_detalle_usuario"));
           

            return dto;
        });
    } 

    // ACTUALIZAR
   
    @Transactional
    public void actualizarUsuario(UsuarioCompletoDTO dto) {
        String sql = "{call sp_actualizar_usuario(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?)}";

        jdbcTemplate.update(sql,
        		dto.getIdUsuario(),             // 1  @id_usuario INT
                dto.getUsuario(),               // 2  @usuario NVARCHAR(50)
                dto.getContrasena(),            // 3  @contrasena NVARCHAR(255)
                dto.getId_area_fk(),            // 4  @id_area INT
                dto.getId_perfil_fk(),          // 5  @id_perfil INT
                dto.getId_cargo_fk(),           // 6  @id_cargo INT
                dto.getIdentificacion(),        // 7  @identificacion NVARCHAR(50)
                dto.getNombre(),                // 8  @nombre NVARCHAR(100)
                dto.getApellido(),              // 9  @apellido NVARCHAR(100)
                dto.getRazon_social(),          // 10 @razon_social NVARCHAR(255)
                dto.getCorreo(),                // 11 @correo NVARCHAR(100)
                dto.getCelular(),               // 12 @celular NVARCHAR(20)
                dto.getFechaNacimiento(),      // 13 @fecha_nacimiento DATE
                dto.getId_empresa_fk(),         // 14 @id_empresa INT
                dto.getId_tipoidentificacion_fk() // 15 @id_tipoidentificacion INT
        );
    }

    // ELIMINAR
    @Transactional
    public void eliminarUsuario(Integer idUsuario) {
        String sql = "{call sp_eliminar_usuario(?)}";
        jdbcTemplate.update(sql, idUsuario);
    }

    // RowMapper_Actualizado

    private static class UsuarioRowMapper implements RowMapper {
        public UsuarioCompletoDTO mapRow(ResultSet rs, int rowNum) throws SQLException {
            UsuarioCompletoDTO dto = new UsuarioCompletoDTO();
            dto.setIdUsuario(rs.getInt("Id_usuario"));
            dto.setUsuario(rs.getString("usuario"));
            dto.setEstado(rs.getBoolean("usuario_estado"));
            dto.setDescripcionArea(rs.getString("descripcionArea"));
            dto.setDescripcionEmpresa(rs.getString("descripcionEmpresa"));
            dto.setDescripcionPerfil(rs.getString("descripcionPerfil"));
            dto.setIdentificacion(rs.getString("identificacion"));
            dto.setNombre(rs.getString("nombre"));
            dto.setApellido(rs.getString("apellido"));
            dto.setRazon_social(rs.getString("razon_social"));
            dto.setCorreo(rs.getString("correo"));
            dto.setCelular(rs.getString("celular"));
            dto.setFechaNacimiento(rs.getString("fechaNacimiento"));
            dto.setDescripcionCargo(rs.getString("descripcionCargo"));
            dto.setId_tipoidentificacion_fk(rs.getInt("Id_tipoidentificacion_fk"));
            return dto;
        }
    } 
}
