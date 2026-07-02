package com.bgreenNet.bgreenNet.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.models.VariablesScada;
import com.bgreenNet.bgreenNet.repository.VariablesScadaRepository;

@Service
public class VariablesScadaService {

    @Autowired
    private VariablesScadaRepository repository;

    public VariablesScada obtenerUltimo() {
        return repository.findTopByOrderByTimestampDesc();
    }
}
