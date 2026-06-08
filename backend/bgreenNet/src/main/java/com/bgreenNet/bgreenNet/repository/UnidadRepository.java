package com.bgreenNet.bgreenNet.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.bgreenNet.bgreenNet.models.Unidad;

@Repository
public interface UnidadRepository extends JpaRepository<Unidad, Integer> {
    Optional<Unidad> findByNombre(String nombre);
}
