package com.bgreenNet.bgreenNet.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.models.Area;
import com.bgreenNet.bgreenNet.models.Cargo;
import com.bgreenNet.bgreenNet.models.Empresa;
import com.bgreenNet.bgreenNet.models.ImagenLogin;
import com.bgreenNet.bgreenNet.models.Perfil;
import com.bgreenNet.bgreenNet.models.TipoIdentificacion;
import com.bgreenNet.bgreenNet.services.ListasServices;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping({"/api/listas", "/listas"})



public class ListasController {
	
	 @Autowired
	 private ListasServices listasServices;

	    @GetMapping("/perfiles")
	    public ResponseEntity<List<Perfil>> obtenerPerfiles() {
	        return ResponseEntity.ok(listasServices.obtenerPerfiles());
	    }

	    @GetMapping("/empresas")
	    public ResponseEntity<List<Empresa>> obtenerEmpresas() {
	        return ResponseEntity.ok(listasServices.obtenerEmpresas());
	    }

	    @GetMapping("/areas")
	    public ResponseEntity<List<Area>> obtenerAreas() {
	        return ResponseEntity.ok(listasServices.obtenerAreas());
	    }

	    @GetMapping("/cargos")
	    public ResponseEntity<List<Cargo>> obtenerCargos() {
	        return ResponseEntity.ok(listasServices.obtenerCargos());
	    }
	    @GetMapping("/identificacion")
	    public ResponseEntity<List<TipoIdentificacion>> obtenerIdentificacion() {
	        return ResponseEntity.ok(listasServices.obtenerIdentificacion());
	    }

	    // Endpoints Imágenes Login
	    @GetMapping("/login-images")
	    public ResponseEntity<List<ImagenLogin>> obtenerImagenesLogin() {
	        return ResponseEntity.ok(listasServices.obtenerImagenesLogin());
	    }

	    @GetMapping("/login-images/todas")
	    public ResponseEntity<List<ImagenLogin>> obtenerTodasLasImagenesLogin() {
	        return ResponseEntity.ok(listasServices.obtenerTodasLasImagenesLogin());
	    }

	    @PostMapping("/login-images")
	    public ResponseEntity<ImagenLogin> guardarImagenLogin(@RequestBody ImagenLogin imagen) {
	        return ResponseEntity.ok(listasServices.guardarImagenLogin(imagen));
	    }

	    @DeleteMapping("/login-images/{id}")
	    public ResponseEntity<Void> eliminarImagenLogin(@PathVariable Long id) {
	        listasServices.eliminarImagenLogin(id);
	        return ResponseEntity.noContent().build();
	    }
	    
}