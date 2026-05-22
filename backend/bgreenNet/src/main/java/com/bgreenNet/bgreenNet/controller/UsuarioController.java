package com.bgreenNet.bgreenNet.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping({"/api/usuarios", "/usuarios"})
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
	    public ResponseEntity<Void> cambiarClave(@RequestBody CambiarClaveDTO dto) {
	        usuarioService.cambiarClave(dto);
	        return ResponseEntity.ok().build();
	    }

	    @PostMapping("/cambiar-clave-admin")
	    public ResponseEntity<Void> cambiarClaveAdmin(@RequestBody CambiarClaveDTO dto) {
	        usuarioService.cambiarClaveAdmin(dto);
	        return ResponseEntity.ok().build();
	    }

	    @PatchMapping("/{id}/bloqueo")
	    public ResponseEntity<Void> toggleBloqueo(
	            @PathVariable Integer id,
	            @RequestBody Map<String, Boolean> body) {
	        Boolean bloqueado = body.get("bloqueado");
	        usuarioService.toggleBloqueo(id, bloqueado != null && bloqueado);
	        return ResponseEntity.ok().build();
	    }

	    @PostMapping("/forzar-vencimiento")
	    public ResponseEntity<Void> forzarVencimiento() {
	        usuarioService.forzarVencimientoTodos();
	        return ResponseEntity.ok().build();
	    }
}
