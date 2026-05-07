package com.bgreenNet.bgreenNet.services;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bgreenNet.bgreenNet.config.PulsoNotFoundException;
import com.bgreenNet.bgreenNet.dto.PulsoCreateDTO;
import com.bgreenNet.bgreenNet.dto.PulsoResponseDTO;
import com.bgreenNet.bgreenNet.dto.PulsoUpdateDTO;
import com.bgreenNet.bgreenNet.repository.PulsoRepository;
import com.bgreenNet.bgreenNet.util.UrlUtils;

@Service
public class PulsoService {

    private final PulsoRepository pulsoRepository;

    private static final DateTimeFormatter[] DATE_FORMATTERS = {
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss.SSS"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"),
        DateTimeFormatter.ISO_LOCAL_DATE_TIME
    };

    @Autowired
    public PulsoService(PulsoRepository pulsoRepository) {
        this.pulsoRepository = pulsoRepository;
    }

    @Transactional(readOnly = true)
    public List<PulsoResponseDTO> getActivePulsos() {
        return pulsoRepository.findActivePulsosRaw()
                .stream()
                .map(this::mapToPulsoResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PulsoResponseDTO> getAllPulsos() {
        return pulsoRepository.findAllPulsosRaw()
                .stream()
                .map(this::mapToPulsoResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PulsoResponseDTO getPulsoById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("El ID no puede ser nulo");
        }

        List<Object[]> results = pulsoRepository.findPulsoByIdRaw(id);

        if (results.isEmpty()) {
            throw new PulsoNotFoundException("No se encontró el pulso con ID: " + id);
        }

        return mapToPulsoResponseDTO(results.get(0));
    }

    @Transactional
    public Long createPulso(PulsoCreateDTO dto) {
        validateCreateDTO(dto);

        Long id = pulsoRepository.insertPulso(
                dto.getTitulo(),
                dto.getDescripcion(),
                dto.getImagenUrl(),
                dto.getImagenNombreOriginal(),
                dto.getImagenTipoMime(),
                dto.getImagenTamanoBytes(),
                dto.getFechaFinal(),
                dto.getFechaActivacion(),
                dto.getCreadoPor()
        );

        if (id == null) {
            throw new RuntimeException("No se pudo obtener el ID generado");
        }

        return id;
    }

    @Transactional
    public void updatePulso(PulsoUpdateDTO dto) {
        validateUpdateDTO(dto);
        verifyPulsoExists(dto.getId());

        pulsoRepository.updatePulso(
                dto.getId(),
                dto.getTitulo(),
                dto.getDescripcion(),
                dto.getImagenUrl(),
                dto.getImagenNombreOriginal(),
                dto.getImagenTipoMime(),
                dto.getImagenTamanoBytes(),
                dto.getFechaFinal(),
                dto.getFechaActivacion(),
                dto.getActivo()
        );
    }

    @Transactional
    public void updateEstado(Long id, Boolean activo) {
        if (id == null) {
            throw new IllegalArgumentException("ID requerido");
        }
        if (activo == null) {
            throw new IllegalArgumentException("Estado requerido");
        }

        verifyPulsoExists(id);
        pulsoRepository.updateEstadoPulso(id, activo);
    }

    @Transactional
    public void deletePulsoFisico(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("El ID del pulso es requerido");
        }

        verifyPulsoExists(id);
        pulsoRepository.deletePulsoFisico(id);
    }

    // ==================== MAPPER ====================
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(PulsoService.class);

    private PulsoResponseDTO mapToPulsoResponseDTO(Object[] row) {
        int i = 0;
        try {
            PulsoResponseDTO dto = new PulsoResponseDTO();

            dto.setIdPulso(asLong(row[i++])); // 0
            dto.setTitulo(asString(row[i++])); // 1
            dto.setDescripcion(asString(row[i++])); // 2
            dto.setImagenUrl(UrlUtils.sanitizeUrl(asString(row[i++]))); // 3
            dto.setImagenNombreOriginal(asString(row[i++])); // 4
            dto.setImagenTipoMime(asString(row[i++])); // 5
            dto.setImagenTamanoBytes(asInteger(row[i++])); // 6
            dto.setFechaFinal(asLocalDateTime(row[i++])); // 7
            dto.setDateCreate(asLocalDateTime(row[i++])); // 8
            dto.setDateModify(asLocalDateTime(row[i++])); // 9
            dto.setActivo(asBoolean(row[i++])); // 10
            
            // Lógica robusta para encontrar email y fechaActivacion
            // Buscamos entre las columnas restantes (usualmente 11, 12, 13...)
            for (int k = i; k < row.length; k++) {
                Object val = row[k];
                if (val == null) continue;
                
                String valStr = val.toString();
                
                // Si parece email, asignarlo a creadoPor (si no está ya asignado)
                if (dto.getCreadoPor() == null && valStr.contains("@")) {
                    dto.setCreadoPor(valStr);
                } 
                // Si es un tipo de fecha o una cadena que parece fecha, intentar como fechaActivacion
                else if (dto.getFechaActivacion() == null && 
                    (val instanceof java.util.Date || val instanceof java.time.temporal.Temporal || 
                     valStr.matches("\\d{2}-\\d{2}-\\d{4}.*") || valStr.matches("\\d{4}-\\d{2}-\\d{2}.*"))) {
                    try {
                        dto.setFechaActivacion(asLocalDateTime(val));
                    } catch (Exception ignored) {}
                }
            }
            
            // Fallback si no se encontró el email en el loop inteligente (probablemente en la pos 11 o 12)
            if (dto.getCreadoPor() == null && row.length > i) {
                // Buscamos la última cadena larga que no sea fecha? No, mejor solo usar el loop de arriba.
            }

            return dto;
        } catch (Exception e) {
            logger.error("Error fatal en el mapper de Pulsos. Row length: {}", row.length);
            for (int k = 0; k < row.length; k++) {
                logger.error("Col {}: {} ({})", k, row[k], row[k] != null ? row[k].getClass().getSimpleName() : "null");
            }
            throw e;
        }
    }

    // ==================== CONVERSORES ====================

    private String asString(Object value) {
        return value != null ? value.toString() : null;
    }

    private Long asLong(Object value) {
        return value instanceof Number ? ((Number) value).longValue() : null;
    }

    private Integer asInteger(Object value) {
        return value instanceof Number ? ((Number) value).intValue() : null;
    }

    private Boolean asBoolean(Object value) {
        if (value == null) return null;
        if (value instanceof Boolean) return (Boolean) value;
        if (value instanceof Number) return ((Number) value).intValue() == 1;
        if (value instanceof String)
            return "1".equals(value) || "true".equalsIgnoreCase(value.toString());
        throw new IllegalArgumentException("Tipo no soportado para Boolean");
    }

    private LocalDateTime asLocalDateTime(Object value) {
        if (value == null) return null;

        if (value instanceof LocalDateTime) return (LocalDateTime) value;
        if (value instanceof Timestamp)
            return ((Timestamp) value).toLocalDateTime();
        if (value instanceof java.util.Date)
            return new Timestamp(((java.util.Date) value).getTime()).toLocalDateTime();

        if (value instanceof String) {
            String dateStr = value.toString().trim();
            for (DateTimeFormatter f : DATE_FORMATTERS) {
                try {
                    return LocalDateTime.parse(dateStr, f);
                } catch (DateTimeParseException ignored) {}
            }
        }

        throw new IllegalArgumentException("No se puede convertir a LocalDateTime: " + value);
    }

    // ==================== VALIDACIONES ====================

    private void validateCreateDTO(PulsoCreateDTO dto) {
        if (dto == null) throw new IllegalArgumentException("DTO requerido");
        if (dto.getTitulo() == null || dto.getTitulo().isBlank())
            throw new IllegalArgumentException("Título requerido");
        if (dto.getFechaFinal() == null)
            throw new IllegalArgumentException("Fecha final requerida");
    }

    private void validateUpdateDTO(PulsoUpdateDTO dto) {
        if (dto == null) throw new IllegalArgumentException("DTO requerido");
        if (dto.getId() == null)
            throw new IllegalArgumentException("ID requerido");
    }

    private void verifyPulsoExists(Long id) {
        Integer exists = pulsoRepository.existsPulsoById(id);
        if (exists == null || exists == 0) {
            throw new PulsoNotFoundException("No existe el pulso con ID: " + id);
        }
    }
}
