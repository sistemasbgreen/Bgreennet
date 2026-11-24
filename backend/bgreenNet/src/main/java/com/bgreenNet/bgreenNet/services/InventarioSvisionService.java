package com.bgreenNet.bgreenNet.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.InventarioSvisionDTO;
import com.bgreenNet.bgreenNet.repository.InventarioSvisionRepository;

/**
 * Servicio de negocio para la consulta de Inventario Svision.
 */
@Service
public class InventarioSvisionService {

    private static final int DEFAULT_ID_CIA = 2;

    private final InventarioSvisionRepository inventarioSvisionRepository;

    public InventarioSvisionService(InventarioSvisionRepository inventarioSvisionRepository) {
        this.inventarioSvisionRepository = inventarioSvisionRepository;
    }

    public List<InventarioSvisionDTO> obtenerInventario(
            Integer idCia,
            String bodega,
            String tipoInventario) {
        int ciaFinal = (idCia != null && idCia > 0) ? idCia : DEFAULT_ID_CIA;
        return inventarioSvisionRepository.consultarInventario(ciaFinal, bodega, tipoInventario);
    }
}
