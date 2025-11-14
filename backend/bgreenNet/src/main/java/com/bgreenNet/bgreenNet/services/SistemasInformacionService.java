package com.bgreenNet.bgreenNet.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.models.SistemasInformacion;
import com.bgreenNet.bgreenNet.repository.SistemaInformacionRepository;


@Service
public class SistemasInformacionService {
	
	@Autowired
    private SistemaInformacionRepository repository;

    public List<SistemasInformacion> getAll() {
        return repository.findAll();
    }

    public List<SistemasInformacion> getActivos() {
        return repository.findByActivoTrue();
    }

    public Optional<SistemasInformacion> getById(Long id) {
        return repository.findById(id);
    }	  

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

}
