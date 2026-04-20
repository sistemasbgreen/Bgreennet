package com.bgreenNet.bgreenNet.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.bgreenNet.bgreenNet.models.Tarea;

public interface TareaRepository extends JpaRepository<Tarea, Long> {
	
	 List<Tarea> findByIdUsuario(Integer idUsuario);
	 
	 List<Tarea> findByIdUsuarioOrIdUsuarioCreador(Integer idUsuario, Integer idUsuarioCreador);

	    @Query("""
	        SELECT t FROM Tarea t
	        WHERE t.idUsuario = :idUsuario
	        AND UPPER(t.estado.nombre) IN ('CREADA','INICIADA', 'PENDIENTE', 'EN PROCESO')
	        AND (t.ultimaNotificacion IS NULL
	        OR FUNCTION('DATEADD', MINUTE, t.prioridad.minutosRecordatorio, t.ultimaNotificacion) <= CURRENT_TIMESTAMP)
	    """)
	    List<Tarea> tareasParaNotificar(@org.springframework.data.repository.query.Param("idUsuario") Integer idUsuario);

}
