package com.bgreenNet.bgreenNet.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.models.Logs;


@Repository
public interface LogsRepository  extends JpaRepository<Logs, Integer>{

	
    // Últimos 10 registros
    List<Logs> findTop10ByOrderByFechaDesc();
    
    // Por usuario
    List<Logs> findByUsuarioOrderByFechaDesc(String usuario);
    
    // Por rango de fechas
    List<Logs> findByFechaBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
}
