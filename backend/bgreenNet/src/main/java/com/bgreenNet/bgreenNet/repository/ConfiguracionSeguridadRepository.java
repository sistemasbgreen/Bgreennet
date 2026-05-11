package com.bgreenNet.bgreenNet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.bgreenNet.bgreenNet.models.ConfiguracionSeguridad;
import java.util.Optional;

@Repository
public interface ConfiguracionSeguridadRepository extends JpaRepository<ConfiguracionSeguridad, Integer> {
    // Normalmente solo habrá un registro de configuración global
    Optional<ConfiguracionSeguridad> findFirstByOrderByIdConfiguracionAsc();
}
