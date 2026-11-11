package com.bgreenNet.bgreenNet.services;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.FirmaDigitalRequisicionDTO;
import com.bgreenNet.bgreenNet.repository.FirmaDigitalRepository;

/**
 * Servicio de negocio para consultas del módulo de firmas digitales.
 */
@Service
public class FirmaDigitalService {

    private static final int DEFAULT_ID_CIA = 2;
    private static final String DEFAULT_TIPO_DOCTO = "RQ";

    private final FirmaDigitalRepository firmaDigitalRepository;

    public FirmaDigitalService(FirmaDigitalRepository firmaDigitalRepository) {
        this.firmaDigitalRepository = firmaDigitalRepository;
    }

    /**
     * Obtiene los registros de requisición interna dentro de un rango de fechas (f441_ts),
     * con filtro opcional por consecutivo de documento.
     */
    public List<FirmaDigitalRequisicionDTO> obtenerRequisiciones(
            String fechaInicio,
            String fechaFin,
            Integer consecDocto,
            Integer idCia,
            String tipoDocto) {
        LocalDate inicio = parseFecha(fechaInicio, "fechaInicio");
        LocalDate fin = parseFecha(fechaFin, "fechaFin");

        if (fin.isBefore(inicio)) {
            throw new IllegalArgumentException("El campo 'fechaFin' no puede ser anterior a 'fechaInicio'.");
        }
        if (consecDocto != null && consecDocto <= 0) {
            throw new IllegalArgumentException("El campo 'consecDocto' debe ser un número entero positivo.");
        }

        int ciaFinal = (idCia != null && idCia > 0) ? idCia : DEFAULT_ID_CIA;
        String tipoFinal = (tipoDocto != null && !tipoDocto.trim().isEmpty())
                ? tipoDocto.trim().toUpperCase()
                : DEFAULT_TIPO_DOCTO;

        return firmaDigitalRepository.consultarRequisicionesPorFecha(
                inicio,
                fin,
                consecDocto,
                ciaFinal,
                tipoFinal
        );
    }

    private LocalDate parseFecha(String valor, String nombreCampo) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException("El campo '" + nombreCampo + "' es obligatorio (formato YYYY-MM-DD).");
        }
        String limpio = valor.trim();
        if (limpio.length() > 10 && limpio.charAt(10) == 'T') {
            limpio = limpio.substring(0, 10);
        }
        try {
            return LocalDate.parse(limpio);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Formato inválido en '" + nombreCampo + "'. Usa YYYY-MM-DD.");
        }
    }
}
