package com.bgreenNet.bgreenNet.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.models.VariablesScada;

@Repository
public interface VariablesScadaRepository 
        extends JpaRepository<VariablesScada, LocalDateTime> {

    VariablesScada findTopByOrderByTimestampDesc();
}