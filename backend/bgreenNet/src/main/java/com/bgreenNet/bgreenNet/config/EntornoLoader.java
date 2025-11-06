package com.bgreenNet.bgreenNet.config;

import org.springframework.beans.factory.annotation.Autowired;

import com.bgreenNet.bgreenNet.models.ConfiguracionEntorno;
import com.bgreenNet.bgreenNet.services.ConfiguracionEntornoService;

import jakarta.annotation.PostConstruct;

public class EntornoLoader {

	 @Autowired
	    private ConfiguracionEntornoService entornoService;

	    @PostConstruct
	    public void init() {
	        ConfiguracionEntorno entorno = entornoService.obtenerConfiguracionActiva();

	        System.out.println("🔧 Entorno activo: " + entorno.getEntorno());
	        System.out.println("📦 DB URL: " + entorno.getDbUrl());

	        // Si deseas, puedes registrar estas propiedades en el entorno de Spring:
	        System.setProperty("app.entorno", entorno.getEntorno());
	        System.setProperty("spring.datasource.url", entorno.getDbUrl());
	        System.setProperty("spring.datasource.username", entorno.getDbUsername());
	        System.setProperty("spring.datasource.password", entorno.getDbPassword());
	    }
	    
}
