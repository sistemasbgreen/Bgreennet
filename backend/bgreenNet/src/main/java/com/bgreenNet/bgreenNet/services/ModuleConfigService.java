package com.bgreenNet.bgreenNet.services;

import com.bgreenNet.bgreenNet.dto.ModuloDTO;
import com.bgreenNet.bgreenNet.dto.SubModuloDTO;
import com.bgreenNet.bgreenNet.models.Modulo;
import com.bgreenNet.bgreenNet.models.PermisoSubModulo;
import com.bgreenNet.bgreenNet.models.SubModulo;
import com.bgreenNet.bgreenNet.repository.ModuloRepository;
import com.bgreenNet.bgreenNet.repository.SubModuloRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ModuleConfigService {

	private final ModuloRepository moduloRepository;
	private final SubModuloRepository subModuloRepository;

	public ModuleConfigService(ModuloRepository moduloRepository, SubModuloRepository subModuloRepository) {
		this.moduloRepository = moduloRepository;
		this.subModuloRepository = subModuloRepository;
	}

	@Transactional(readOnly = true)
	public List<ModuloDTO> getModuleConfig() {
		List<Modulo> modulos = moduloRepository.findAllWithSubModulosAndPermisos();

		return modulos.stream().map(this::convertToDTO).collect(Collectors.toList());
	}

	private ModuloDTO convertToDTO(Modulo modulo) {
	    ModuloDTO dto = new ModuloDTO();
	    dto.setNombre(modulo.getNombre());
	    dto.setRuta(modulo.getRuta());
	    dto.setIcono(modulo.getIconos());
	    dto.setExpandido(false);

	    // Crear una copia defensiva primero, luego hacer stream
	    List<SubModulo> subModulosList = new ArrayList<>(modulo.getSubModulos());
	    List<SubModuloDTO> subModulosDTO = subModulosList.stream()
	            .filter(SubModulo::getActivo)
	            .map(this::convertSubModuloToDTO)
	            .collect(Collectors.toList());

	    dto.setSubModulos(subModulosDTO);

	    return dto;
	}

	private SubModuloDTO convertSubModuloToDTO(SubModulo subModulo) {
		SubModuloDTO dto = new SubModuloDTO();
		dto.setIdSubModulo(subModulo.getIdSubModulo());
		dto.setNombre(subModulo.getSubmodulo());
		dto.setRuta(subModulo.getRuta());
		dto.setIcono(subModulo.getIconos());

		// Crear copia defensiva primero, luego hacer stream
		List<PermisoSubModulo> permisosList = new ArrayList<>(subModulo.getPermisos());
		List<String> roles = permisosList.stream()
				.filter(PermisoSubModulo::getActivo)
				.map(psm -> psm.getPerfil().getDescripcionPerfil())
				.distinct()
				.collect(Collectors.toList());

		dto.setRoles(roles);
		return dto;
	}

	@Transactional(readOnly = true)
	public List<SubModuloDTO> getPermisosByPerfil(Integer idPerfil) {
		// CORREGIDO: usar la instancia del repositorio, no llamada estática
		List<SubModulo> subModulos = subModuloRepository.findByActivoTrue();

		return subModulos.stream().map(subModulo -> {
			SubModuloDTO dto = convertSubModuloToDTO(subModulo);

			// Verificar si el perfil tiene permiso a este submódulo
			// Crear copia defensiva para evitar ConcurrentModificationException
			List<PermisoSubModulo> permisosList = new ArrayList<>(subModulo.getPermisos());
			boolean tienePermiso = permisosList.stream()
					.anyMatch(psm -> psm.getActivo() && psm.getPerfil().getIdPerfil().equals(idPerfil));

			// Si no tiene permiso, limpiar la lista de roles
			if (!tienePermiso) {
				dto.setRoles(List.of());
			}

			return dto;
		}).collect(Collectors.toList());
	}
}