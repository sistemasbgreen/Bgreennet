package com.bgreenNet.bgreenNet.services;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.CambiarClaveDTO;
import com.bgreenNet.bgreenNet.dto.UsuarioCompletoDTO;

import jakarta.transaction.Transactional;


@Service
@Transactional
public class UsuarioServices {

	
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UsuarioServices(JdbcTemplate jdbcTemplate, 
                          PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
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
            try {
                dto.setBloqueado(rs.getBoolean("bloqueado"));
            } catch (Exception e) {
                dto.setBloqueado(false); // campo puede no existir en queries antiguas
            }

            return dto;
        });
    } 

    // ACTUALIZAR
   
    @Transactional
    public void actualizarUsuario(UsuarioCompletoDTO dto) {
        String sql = "{call sp_actualizar_usuario(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)}";

        // ✅ Encriptar la contraseña si se proporciona una nueva
        String contrasena = dto.getContrasena();
        if (contrasena != null && !contrasena.isEmpty()) {
            contrasena = passwordEncoder.encode(contrasena);
        }

        jdbcTemplate.update(sql,
                dto.getIdUsuario(),               // 1  @id_usuario INT
                dto.getId_detalle_usuario(),      // 2  @id_detalleusuario INT
                dto.getUsuario(),                 // 3  @usuario NVARCHAR(50)
                contrasena,                       // 4  @contrasena NVARCHAR(255)
                dto.getId_area_fk(),              // 5  @id_area INT
                dto.getId_perfil_fk(),            // 6  @id_perfil INT
                dto.getId_cargo_fk(),             // 7  @id_cargo INT
                dto.getIdentificacion(),          // 8  @identificacion NVARCHAR(50)
                dto.getNombre(),                  // 9  @nombre NVARCHAR(100)
                dto.getApellido(),                // 10 @apellido NVARCHAR(100)
                dto.getRazon_social(),            // 11 @razon_social NVARCHAR(255)
                dto.getCorreo(),                  // 12 @correo NVARCHAR(100)
                dto.getCelular(),                 // 13 @celular NVARCHAR(20)
                dto.getFechaNacimiento(),         // 14 @fecha_nacimiento DATE
                dto.getId_empresa_fk(),           // 15 @id_empresa INT
                dto.getId_tipoidentificacion_fk(),// 16 @id_tipoidentificacion INT
                dto.getEstado()                   // 17 @activo BIT
        );
    }

    // ELIMINAR
    @Transactional
    public void eliminarUsuario(Integer idUsuario) {
        String sql = "{call sp_eliminar_usuario(?)}";
        jdbcTemplate.update(sql, idUsuario);
    }

  

    @Transactional
    public void cambiarClave(CambiarClaveDTO dto) {
        // Primero verificamos la clave actual
        String sqlSelect = "SELECT contrasena FROM Usuario WHERE id_usuario = ?";
        String currentPass;
        try {
            currentPass = jdbcTemplate.queryForObject(sqlSelect, String.class, dto.getIdUsuario());
        } catch (Exception e) {
            throw new RuntimeException("Usuario no encontrado");
        }

        if (currentPass == null || !passwordEncoder.matches(dto.getClaveActual(), currentPass)) {
            throw new RuntimeException("La clave actual es incorrectA");
        }

        String sqlUpdate = "UPDATE Usuario SET contrasena = ? WHERE id_usuario = ?";
        jdbcTemplate.update(sqlUpdate, passwordEncoder.encode(dto.getNuevaClave()), dto.getIdUsuario());
    }

    @Transactional
    public void cambiarClaveAdmin(CambiarClaveDTO dto) {
        String sqlUpdate = "UPDATE Usuario SET contrasena = ? WHERE id_usuario = ?";
        int updated = jdbcTemplate.update(sqlUpdate, passwordEncoder.encode(dto.getNuevaClave()), dto.getIdUsuario());
        
        if (updated == 0) {
            throw new RuntimeException("No se encontró el usuario para actualizar la clave");
        }
    }

    @Transactional
    public void toggleBloqueo(Integer idUsuario, boolean bloqueado) {
        String sql = "UPDATE Usuario SET bloqueado = ?, intentos_fallidos = ? WHERE id_usuario = ?";
        int intentos = bloqueado ? 0 : 0; // Resetear intentos al desbloquear
        jdbcTemplate.update(sql, bloqueado, intentos, idUsuario);
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
