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

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ModuleConfigService {

	private final ModuloRepository moduloRepository;

	public ModuleConfigService(ModuloRepository moduloRepository) {
		this.moduloRepository = moduloRepository;
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

		List<SubModuloDTO> subModulosDTO = modulo.getSubModulos().stream().filter(SubModulo::getActivo)
				.map(this::convertSubModuloToDTO).collect(Collectors.toList());

		dto.setSubModulos(subModulosDTO);
		return dto;
	}

	private SubModuloDTO convertSubModuloToDTO(SubModulo subModulo) {
		SubModuloDTO dto = new SubModuloDTO();
		dto.setIdSubModulo(subModulo.getIdSubModulo()); // ✅ Agregar ID
		dto.setNombre(subModulo.getSubmodulo());
		dto.setRuta(subModulo.getRuta());
		dto.setIcono(subModulo.getIconos());

		List<String> roles = subModulo.getPermisos().stream().filter(PermisoSubModulo::getActivo)
				.map(psm -> psm.getPerfil().getDescripcionPerfil()).distinct().collect(Collectors.toList());

		dto.setRoles(roles);
		return dto;
	}
	
	@Transactional(readOnly = true)
	public List<SubModuloDTO> getPermisosByPerfil(Integer idPerfil) {
	    List<SubModulo> subModulos = SubModuloRepository.findByActivoTrue();
	    
	    return subModulos.stream()
	        .map(subModulo -> {
	            SubModuloDTO dto = convertSubModuloToDTO(subModulo);
	            
	            // Verificar si el perfil tiene permiso a este submódulo
	            boolean tienePermiso = subModulo.getPermisos().stream()
	                .anyMatch(psm -> psm.getActivo() 
	                    && psm.getPerfil().getIdPerfil().equals(idPerfil));
	            
	            // Si no tiene permiso, limpiar la lista de roles
	            if (!tienePermiso) {
	                dto.setRoles(List.of());
	            }
	            
	            return dto;
	        })
	        .collect(Collectors.toList());
	}
}