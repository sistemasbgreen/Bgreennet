package com.bgreenNet.bgreenNet.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.bgreenNet.bgreenNet.models.Tarea;

public interface TareaRepository extends JpaRepository<Tarea, Long> {
	
	 List<Tarea> findByIdUsuario(Integer idUsuario);

	    @Query("""
	        SELECT t FROM Tarea t
	        WHERE t.estado.nombre IN ('CREADA','INICIADA')
	        AND (t.ultimaNotificacion IS NULL
	        OR FUNCTION('DATEADD', MINUTE, t.prioridad.minutosRecordatorio, t.ultimaNotificacion) <= CURRENT_TIMESTAMP)
	    """)
	    List<Tarea> tareasParaNotificar();

}
