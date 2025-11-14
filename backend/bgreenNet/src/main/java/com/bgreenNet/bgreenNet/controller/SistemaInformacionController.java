package com.bgreenNet.bgreenNet.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

	    @GetMapping("/activos")
	    public ResponseEntity<List<SistemasInformacion>> getActivos() {
	        return ResponseEntity.ok(service.getActivos());
	    }

	    @GetMapping("/{id}")
	    public ResponseEntity<SistemasInformacion> getById(@PathVariable Long id) {
	        return service.getById(id)
	                .map(ResponseEntity::ok)
	                .orElse(ResponseEntity.notFound().build());
	    }

	    

	    @DeleteMapping("/{id}")
	    public ResponseEntity<Void> delete(@PathVariable Long id) {
	        if (service.getById(id).isPresent()) {
	            service.deleteById(id);
	            return ResponseEntity.noContent().build();
	        }
	        return ResponseEntity.notFound().build();
	    }
	    
}
