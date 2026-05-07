package com.bgreenNet.bgreenNet.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.models.HomeContacto;
import com.bgreenNet.bgreenNet.repository.HomeContactoRepository;

@Service
public class HomeContactoService {

	
	 private final HomeContactoRepository repository;

	    public HomeContactoService(HomeContactoRepository repository) {
	        this.repository = repository;
	    }

		public List<HomeContacto> getContacto() {
			return repository.obtenerContacto();
		}
	    
}
