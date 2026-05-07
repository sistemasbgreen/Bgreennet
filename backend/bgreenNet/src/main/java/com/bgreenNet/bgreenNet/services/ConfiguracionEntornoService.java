package com.bgreenNet.bgreenNet.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.models.ConfiguracionEntorno;
import com.bgreenNet.bgreenNet.repository.ConfiguracionEntornoRepository;

@Service
public class ConfiguracionEntornoService {
	
	  @Autowired
	    private ConfiguracionEntornoRepository repo;

	    public ConfiguracionEntorno obtenerConfiguracionActiva() {
	        return repo.findByActivoTrue()
	                   .orElseThrow(() -> new RuntimeException("No hay entorno activo configurado"));
	    }

}
