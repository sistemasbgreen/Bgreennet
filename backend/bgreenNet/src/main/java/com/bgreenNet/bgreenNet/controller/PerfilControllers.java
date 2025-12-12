package com.bgreenNet.bgreenNet.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.AsignarPermisoDTO;
import com.bgreenNet.bgreenNet.dto.CrearPerfilDTO;
import com.bgreenNet.bgreenNet.dto.PermisoSistemaPerfilDTO;
import com.bgreenNet.bgreenNet.models.Perfil;
import com.bgreenNet.bgreenNet.services.PerfilServices;

@RestController
@RequestMapping("/api/perfil")
@CrossOrigin(origins = "*")
public class PerfilControllers {

	private final PerfilServices perfilservice;

	public PerfilControllers(PerfilServices perfilservice) {
		this.perfilservice = perfilservice;
	}

	// Obtener todos los perfiles
	@GetMapping
	public ResponseEntity<List<Perfil>> getAll() {
		return ResponseEntity.ok(perfilservice.getAll());
	}

	// Obtener todos los permisos de perfiles
	@GetMapping("/{idPerfil}")
	public ResponseEntity<List<PermisoSistemaPerfilDTO>> obtenerPermisosPorPerfil(@PathVariable Long idPerfil) {
		List<PermisoSistemaPerfilDTO> permisos = perfilservice.obtenerPermisosPorPerfil(idPerfil);
		return ResponseEntity.ok(permisos);
	}

	// Crear perfiles
	@PostMapping
	public ResponseEntity<Void> crearPerfil(@RequestBody CrearPerfilDTO dto) {
		if (dto.getDescripcionPerfil() == null || dto.getDescripcionPerfil().trim().isEmpty()) {
			return ResponseEntity.badRequest().build();
		}

		perfilservice.crearPerfil(dto.getDescripcionPerfil(), dto.getActivo());
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/asignar")
	public ResponseEntity<Boolean> asignarPermiso(@RequestBody AsignarPermisoDTO dto) {
	    if (dto.getIdPerfilFk() == null || dto.getIdSistemaFk() == null) {
	        return ResponseEntity.badRequest().body(false);
	    }
	    try {
	        perfilservice.asignarPermiso(dto.getIdPerfilFk(), dto.getIdSistemaFk());
	        return ResponseEntity.ok(true);
	    } catch (Exception e) {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(false);
	    }
	}

	@DeleteMapping("/eliminar")
	public ResponseEntity<Boolean> eliminarPermiso(@RequestBody AsignarPermisoDTO dto) {
	    if (dto.getIdPerfilFk() == null || dto.getIdSistemaFk() == null) {
	        return ResponseEntity.badRequest().body(false);
	    }
	    try {
	        perfilservice.eliminarPermiso(dto.getIdPerfilFk(), dto.getIdSistemaFk());
	        return ResponseEntity.ok(true);
	    } catch (Exception e) {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(false);
	    }
	}
	
	
	

}
