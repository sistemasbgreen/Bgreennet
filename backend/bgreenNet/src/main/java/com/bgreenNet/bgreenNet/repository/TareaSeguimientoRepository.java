package com.bgreenNet.bgreenNet.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bgreenNet.bgreenNet.models.TareaSeguimiento;

public interface TareaSeguimientoRepository extends JpaRepository<TareaSeguimiento, Long> {
    
    List<TareaSeguimiento> findByTareaIdOrderByFechaAsc(Long idTarea);
}
