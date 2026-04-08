package com.bgreenNet.bgreenNet.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.OpDoctoDTO;
import com.bgreenNet.bgreenNet.repository.OpDoctoRepository;



@RestController
@RequestMapping("/api/op-docto")
@CrossOrigin(origins = "*") 


public class OpDoctoController {

	 @Autowired
	    private OpDoctoRepository repository;

	    @GetMapping
	    public ResponseEntity<List<OpDoctoDTO>> listarDocumentos() {
	        List<OpDoctoDTO> documentos = repository.findAll();
	        return ResponseEntity.ok(documentos);
	    }
}
