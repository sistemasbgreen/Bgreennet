package com.bgreenNet.bgreenNet.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.CambiarClaveDTO;
import com.bgreenNet.bgreenNet.dto.UsuarioCompletoDTO;
import com.bgreenNet.bgreenNet.services.UsuarioServices;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {
	
	private final UsuarioServices usuarioService;
	
	public UsuarioController(UsuarioServices usuarioService) {
        this.usuarioService = usuarioService;
    }


	@GetMapping("/listar")
    public List<UsuarioCompletoDTO> listarUsuarios() {
        return usuarioService.listarUsuarios();
    }
    
 
	 @PostMapping("/crear")
	    public ResponseEntity<Void> crearUsuario(@RequestBody UsuarioCompletoDTO dto) {
	        usuarioService.crearUsuario(dto);
	        return ResponseEntity.status(201).build();
	    }

	 @PutMapping("/actualizar/{id}")
	    public ResponseEntity<Void> actualizarUsuario(
	            @PathVariable Integer id,
	            @RequestBody UsuarioCompletoDTO dto) {
	        dto.setIdUsuario(id);
	        usuarioService.actualizarUsuario(dto);
	        return ResponseEntity.noContent().build();
	    }

	    @DeleteMapping("/eliminar/{id}")
	    public ResponseEntity<Void> eliminarUsuario(@PathVariable Integer id) {
	        usuarioService.eliminarUsuario(id);
	        return ResponseEntity.noContent().build();
	    }

	    @PostMapping("/cambiar-clave")
	    public ResponseEntity<?> cambiarClave(@RequestBody CambiarClaveDTO dto) {
	        try {
	            usuarioService.cambiarClave(dto);
	            return ResponseEntity.ok().build();
	        } catch (RuntimeException e) {
	            java.util.Map<String, String> error = new java.util.HashMap<>();
	            error.put("error", e.getMessage());
	            return ResponseEntity.badRequest().body(error);
	        }
	    }

	    @PostMapping("/cambiar-clave-admin")
	    public ResponseEntity<?> cambiarClaveAdmin(@RequestBody CambiarClaveDTO dto) {
	        try {
	            usuarioService.cambiarClaveAdmin(dto);
	            return ResponseEntity.ok().build();
	        } catch (RuntimeException e) {
	            java.util.Map<String, String> error = new java.util.HashMap<>();
	            error.put("error", e.getMessage());
	            return ResponseEntity.badRequest().body(error);
	        }
	    }

}
