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
import com.bgreenNet.bgreenNet.models.Perfil;
import com.bgreenNet.bgreenNet.models.TipoIdentificacion;
import com.bgreenNet.bgreenNet.services.ListasServices;

@RestController
@RequestMapping("/api/listas")
@CrossOrigin(origins = "*")

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
	    
}