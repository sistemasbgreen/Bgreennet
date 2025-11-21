package com.bgreenNet.bgreenNet.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.models.HomeContacto;
import com.bgreenNet.bgreenNet.services.HomeContactoService;

@RestController
@RequestMapping("/api/home")
public class HomeContactoController {

	 private final HomeContactoService service;

	    public HomeContactoController(HomeContactoService service) {
	        this.service = service;
	    }

	    @GetMapping("/contacto")
	    public HomeContacto getContacto() {
	        return service.getContacto();
	    }
	    
}
