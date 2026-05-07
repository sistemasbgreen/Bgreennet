package com.bgreenNet.bgreenNet.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bgreenNet.bgreenNet.models.TareaEstadoHistorial;

public interface TareaEstadoHistorialRepository extends JpaRepository<TareaEstadoHistorial, Long> {
    
    List<TareaEstadoHistorial> findByTareaIdOrderByFechaInicioAsc(Long idTarea);
    
    Optional<TareaEstadoHistorial> findFirstByTareaIdAndFechaFinIsNullOrderByFechaInicioDesc(Long idTarea);
}
