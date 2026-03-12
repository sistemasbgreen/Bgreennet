package com.bgreenNet.bgreenNet.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.models.HomeContacto;
import com.bgreenNet.bgreenNet.models.Perfil;
import com.bgreenNet.bgreenNet.services.HomeContactoService;

@RestController
@RequestMapping({"/api/home", "/home"})
public class HomeContactoController {

	 private final HomeContactoService service;

	    public HomeContactoController(HomeContactoService service) {
	        this.service = service;
	    }


	    @GetMapping("/contacto")
	    public ResponseEntity<List<HomeContacto>> getContacto() {
	        return ResponseEntity.ok(service.getContacto());
	    }
	    

}
