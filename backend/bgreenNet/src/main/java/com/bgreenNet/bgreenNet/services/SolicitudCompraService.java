package com.bgreenNet.bgreenNet.services;

import com.bgreenNet.bgreenNet.dto.SolicitudCompraDTO;
import com.bgreenNet.bgreenNet.repository.SolicitudCompraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class SolicitudCompraService {

    @Autowired
    private SolicitudCompraRepository repository;

    /**
     * Obtiene el listado completo según la consulta solicitada.
     */
    public List<SolicitudCompraDTO> obtenerTodas() {
        return repository.findAll();
    }

    /**
     * Obtiene las solicitudes aplicando filtros opcionales.
     */
    public List<SolicitudCompraDTO> obtenerPorFiltros(String tipoDocto, Integer estado, LocalDate fechaInicio, LocalDate fechaFin) {
        return repository.findWithFilters(tipoDocto, estado, fechaInicio, fechaFin);
    }
}
