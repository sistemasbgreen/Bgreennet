package com.bgreenNet.bgreenNet.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.PermisoSistemaPerfilDTO;
import com.bgreenNet.bgreenNet.models.SistemasInformacion;
import com.bgreenNet.bgreenNet.repository.SistemaInformacionRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;

@Service
public class SistemasInformacionService {
	

	@Autowired
	private SistemaInformacionRepository repository;

	public List<SistemasInformacion> getAll() {
		return repository.findAll();
	}


	public SistemasInformacion crear(SistemasInformacion sistema) {
		sistema.setEstado(true);
		return repository.save(sistema);
	}

	public SistemasInformacion editar(Long id, SistemasInformacion sistemaActualizado) {
		return repository.findById(id).map(sistemaExistente -> {
			sistemaExistente.setNombre(sistemaActualizado.getNombre());
			sistemaExistente.setUrl(sistemaActualizado.getUrl());
			sistemaExistente.setImagenUrl(sistemaActualizado.getImagenUrl());
//			sistemaExistente.setTipoSistema(sistemaActualizado.getTipoSistema());
			sistemaExistente.setEstado(sistemaActualizado.getEstado());
			return repository.save(sistemaExistente);
		}).orElseThrow(() -> new RuntimeException("Sistema no encontrado con ID: " + id));
	}

	public void activarDesactivar(Long id, boolean activo) {
		repository.findById(id).ifPresentOrElse(sistema -> {
			sistema.setEstado(activo);
			repository.save(sistema);
		}, () -> {
			throw new RuntimeException("Sistema no encontrado con ID: " + id);
		});
	}
	
	
	 public List<SistemasInformacion> getSistemasPorPerfil(Long idPerfil) {
	        return repository.findSistemasByPerfil(idPerfil);
	    }
	
	
	

}
