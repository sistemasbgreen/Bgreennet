package com.bgreenNet.bgreenNet.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.models.ConfiguracionEntorno;

@Repository
public interface ConfiguracionEntornoRepository extends JpaRepository<ConfiguracionEntorno, Long> {
    Optional<ConfiguracionEntorno> findByActivoTrue();
}
