package com.bgreenNet.bgreenNet.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
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

import com.bgreenNet.bgreenNet.models.SistemasInformacion;
import com.bgreenNet.bgreenNet.services.SistemasInformacionService;

@RestController
@RequestMapping("/api/sistemasinformacion")
@CrossOrigin(origins = "*") 
public class SistemaInformacionController {


	 @Autowired
	    private SistemasInformacionService service;

	    @GetMapping
	    public ResponseEntity<List<SistemasInformacion>> getAll() {
	        return ResponseEntity.ok(service.getAll());
	    }   
	    
	    @PostMapping
	    public ResponseEntity<SistemasInformacion> crear(@RequestBody SistemasInformacion sistema) {
	    	SistemasInformacion nuevo = service.crear(sistema);
	        return ResponseEntity.ok(nuevo);
	    }  
	    	    
	    @PutMapping("/{id}")
	    public ResponseEntity<SistemasInformacion> editar(
	            @PathVariable Long id,
	            @RequestBody SistemasInformacion sistema) {
	    	SistemasInformacion actualizado = service.editar(id, sistema);
	        return ResponseEntity.ok(actualizado);
	    }
	    
	    
	    // Opcional: un solo endpoint para activar/desactivar
	    @PatchMapping("/{id}/estado")
	    public ResponseEntity<Void> actualizarEstado(@PathVariable Long id, @RequestBody Map<String, Boolean> cuerpo) {
	        Boolean estado = cuerpo.get("activo");
	        if (estado == null) {
	            return ResponseEntity.badRequest().build();
	        }
	        service.activarDesactivar(id, estado);
	        return ResponseEntity.noContent().build();
	    }    
	    
	    @GetMapping("/{idPerfil}")
	    public ResponseEntity<List<SistemasInformacion>> getSistemasPorPerfil(@PathVariable Long idPerfil) {
	        List<SistemasInformacion> sistemas = service.getSistemasPorPerfil(idPerfil);
	        return ResponseEntity.ok(sistemas);
	    }
  
}
