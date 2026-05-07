package com.bgreenNet.bgreenNet.services;

import com.bgreenNet.bgreenNet.dto.AsignarPermisoModulosDTO;
import com.bgreenNet.bgreenNet.models.PermisoSubModulo;
import com.bgreenNet.bgreenNet.models.SubModulo;
import com.bgreenNet.bgreenNet.repository.PermisoSubModuloRepository;
import com.bgreenNet.bgreenNet.repository.SubModuloRepository;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PermisoSubModuloService {
    
    private final PermisoSubModuloRepository permisoRepository;
    private final SubModuloRepository subModuloRepository;
    
    public PermisoSubModuloService(
        PermisoSubModuloRepository permisoRepository,
        SubModuloRepository subModuloRepository
    ) {
        this.permisoRepository = permisoRepository;
        this.subModuloRepository = subModuloRepository;
    }
    
    @Transactional
    public void asignarPermiso(AsignarPermisoModulosDTO dto) {
        // Verificar que el submódulo exista
        SubModulo subModulo = subModuloRepository.findById(dto.getIdSubModulo())
            .orElseThrow(() -> new EntityNotFoundException(
                "Submódulo con ID " + dto.getIdSubModulo() + " no encontrado"
            ));
        
        // Buscar si ya existe el permiso
        var permisoExistente = permisoRepository
            .findByIdPerfilAndIdSubModulo(dto.getIdPerfil(), dto.getIdSubModulo());
        
        if (permisoExistente.isPresent()) {
            // Actualizar estado existente
            PermisoSubModulo permiso = permisoExistente.get();
            permiso.setActivo(dto.getActivo());
            permisoRepository.save(permiso);
        } else {
            // Crear nuevo permiso
            PermisoSubModulo nuevoPermiso = new PermisoSubModulo();
            nuevoPermiso.setPerfil(new com.bgreenNet.bgreenNet.models.Perfil());
            nuevoPermiso.getPerfil().setIdPerfil(dto.getIdPerfil());
            nuevoPermiso.setSubModulo(subModulo);
            nuevoPermiso.setActivo(dto.getActivo());
            
            permisoRepository.save(nuevoPermiso);
        }
    }
    
    @Transactional
    public void revocarPermiso(Integer idPerfil, Integer idSubModulo) {
        permisoRepository.deleteByIdPerfilAndIdSubModulo(idPerfil, idSubModulo);
    }
}