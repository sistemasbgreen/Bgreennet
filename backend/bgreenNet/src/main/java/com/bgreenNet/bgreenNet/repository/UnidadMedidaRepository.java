package com.bgreenNet.bgreenNet.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.bgreenNet.bgreenNet.models.UnidadMedida;

@Repository
public interface UnidadMedidaRepository extends JpaRepository<UnidadMedida, Integer> {
    Optional<UnidadMedida> findByNombre(String nombre);
}
