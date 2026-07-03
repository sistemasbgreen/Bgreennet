package com.bgreenNet.bgreenNet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.models.VariablesScada;

// Repositorio JPA conservado como referencia.
// La lectura de Tabla_12 ahora se realiza via plcJdbcTemplate en VariablesScadaService.
@Repository
public interface VariablesScadaRepository
        extends JpaRepository<VariablesScada, Long> {

    VariablesScada findTopByOrderByTimestampDesc();
}