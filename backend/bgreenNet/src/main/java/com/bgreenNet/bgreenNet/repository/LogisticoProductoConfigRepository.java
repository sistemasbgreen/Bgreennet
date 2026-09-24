package com.bgreenNet.bgreenNet.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.models.LogisticoProductoConfig;

@Repository
public interface LogisticoProductoConfigRepository extends JpaRepository<LogisticoProductoConfig, Long> {

    List<LogisticoProductoConfig> findAllByOrderByNombreProductoAsc();

    List<LogisticoProductoConfig> findByPermitidoTrue();

    Optional<LogisticoProductoConfig> findByNombreProductoIgnoreCase(String nombreProducto);
}
