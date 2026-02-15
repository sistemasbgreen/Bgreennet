package com.bgreenNet.bgreenNet.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.AsignarPermisoModulosDTO;
import com.bgreenNet.bgreenNet.dto.ModuloDTO;
import com.bgreenNet.bgreenNet.dto.SubModuloDTO;
import com.bgreenNet.bgreenNet.services.ModuleConfigService;
import com.bgreenNet.bgreenNet.services.PermisoSubModuloService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/module-config")
public class ModuleConfigController {

	
	 
    private final ModuleConfigService moduleConfigService;
    private final PermisoSubModuloService permisoService;
    
    public ModuleConfigController(
        ModuleConfigService moduleConfigService,
        PermisoSubModuloService permisoService
    ) {
        this.moduleConfigService = moduleConfigService;
        this.permisoService = permisoService;
    }
    
    // ==================== ENDPOINTS DE LECTURA ====================
    
    /**
     * Obtiene la configuración completa de módulos y submódulos con permisos
     * GET /api/module-config/config
     */
    @GetMapping("/config")
    public ResponseEntity<List<ModuloDTO>> getModuleConfig() {
        List<ModuloDTO> config = moduleConfigService.getModuleConfig();
        return ResponseEntity.ok(config);
    }
    
    // ==================== ENDPOINTS DE ESCRITURA ====================
    
    /**
     * Asigna o actualiza permiso a un submódulo
     * POST /api/module-config/permiso
     */
    @PostMapping("/permiso")
    public ResponseEntity<Void> asignarPermiso(
        @Valid @RequestBody AsignarPermisoModulosDTO dto
    ) {
        permisoService.asignarPermiso(dto);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Revoca permiso a un submódulo
     * DELETE /api/module-config/permiso/{idPerfil}/{idSubModulo}
     */
    @DeleteMapping("/permiso/{idPerfil}/{idSubModulo}")
    public ResponseEntity<Void> revocarPermiso(
        @PathVariable Integer idPerfil,
        @PathVariable Integer idSubModulo
    ) {
        permisoService.revocarPermiso(idPerfil, idSubModulo);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/permisos/perfil/{idPerfil}")
    public ResponseEntity<List<SubModuloDTO>> getPermisosByPerfil(@PathVariable Integer idPerfil) {
        List<SubModuloDTO> permisos = moduleConfigService.getPermisosByPerfil(idPerfil);
        return ResponseEntity.ok(permisos);
    }
}
