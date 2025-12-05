package com.bgreenNet.bgreenNet.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

	@GetMapping
	public ResponseEntity<List<Perfil>> getAll() {
		return ResponseEntity.ok(perfilservice.getAll());
	}

	@GetMapping("/{idPerfil}")
	public ResponseEntity<List<PermisoSistemaPerfilDTO>> obtenerPermisosPorPerfil(@PathVariable Long idPerfil) {
		List<PermisoSistemaPerfilDTO> permisos = perfilservice.obtenerPermisosPorPerfil(idPerfil);
		return ResponseEntity.ok(permisos);
	}

}
