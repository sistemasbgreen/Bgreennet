package com.bgreenNet.bgreenNet.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.models.Logs;
import com.bgreenNet.bgreenNet.repository.LogsRepository;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class LogsService {
	
	 @Autowired
	    private LogsRepository logsRepository;

	    public Logs registrarLog(String usuario, String accion, String tabla, String mensaje) {
	        Logs log = new Logs();
	        log.setUsuario(usuario);
	        log.setAccion(accion);
	        log.setTabla(tabla);
	        log.setMensaje(mensaje);
	        log.setFecha(LocalDateTime.now());
	        return logsRepository.save(log);
	    }

	    public List<Logs> getUltimosRegistros() {
	        return logsRepository.findTop10ByOrderByFechaDesc();
	    }

	    public List<Logs> getLogsPorUsuario(String usuario) {
	        return logsRepository.findByUsuarioOrderByFechaDesc(usuario);
	    }

}
