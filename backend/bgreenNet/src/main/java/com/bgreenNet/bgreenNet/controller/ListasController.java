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
import org.springframework.web.bind.annotation.PutMapping;
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

	    @PostMapping({"/empresas", "/empresas/crear"})
	    public ResponseEntity<Empresa> crearEmpresa(@RequestBody Empresa empresa) {
	        return ResponseEntity.ok(listasServices.guardarEmpresa(empresa));
	    }

	    @PutMapping({"/empresas/actualizar/{id}", "/empresas/{id}"})
	    public ResponseEntity<Empresa> actualizarEmpresa(@PathVariable Integer id, @RequestBody Empresa empresa) {
	        return ResponseEntity.ok(listasServices.actualizarEmpresa(id, empresa));
	    }

	    @GetMapping("/areas")
	    public ResponseEntity<List<Area>> obtenerAreas() {
	        return ResponseEntity.ok(listasServices.obtenerAreas());
	    }

	    @PostMapping({"/areas", "/areas/crear"})
	    public ResponseEntity<Area> crearArea(@RequestBody Area area) {
	        return ResponseEntity.ok(listasServices.guardarArea(area));
	    }

	    @PutMapping({"/areas/actualizar/{id}", "/areas/{id}"})
	    public ResponseEntity<Area> actualizarArea(@PathVariable Integer id, @RequestBody Area area) {
	        return ResponseEntity.ok(listasServices.actualizarArea(id, area));
	    }

	    @GetMapping("/cargos")
	    public ResponseEntity<List<Cargo>> obtenerCargos() {
	        return ResponseEntity.ok(listasServices.obtenerCargos());
	    }

	    @PostMapping({"/cargos", "/cargos/crear"})
	    public ResponseEntity<Cargo> crearCargo(@RequestBody Cargo cargo) {
	        return ResponseEntity.ok(listasServices.guardarCargo(cargo));
	    }

	    @PutMapping({"/cargos/actualizar/{id}", "/cargos/{id}"})
	    public ResponseEntity<Cargo> actualizarCargo(@PathVariable Integer id, @RequestBody Cargo cargo) {
	        return ResponseEntity.ok(listasServices.actualizarCargo(id, cargo));
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