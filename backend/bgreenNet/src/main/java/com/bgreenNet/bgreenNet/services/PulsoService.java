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

    private PulsoResponseDTO mapToPulsoResponseDTO(Object[] row) {
        int i = 0;
        PulsoResponseDTO dto = new PulsoResponseDTO();

        dto.setIdPulso(asLong(row[i++]));
        dto.setTitulo(asString(row[i++]));
        dto.setDescripcion(asString(row[i++]));
        dto.setImagenUrl(UrlUtils.sanitizeUrl(asString(row[i++])));
        dto.setImagenNombreOriginal(asString(row[i++]));
        dto.setImagenTipoMime(asString(row[i++]));
        dto.setImagenTamanoBytes(asInteger(row[i++]));
        dto.setFechaFinal(asLocalDateTime(row[i++]));
        dto.setDateCreate(asLocalDateTime(row[i++]));
        dto.setDateModify(asLocalDateTime(row[i++]));
        dto.setActivo(asBoolean(row[i++]));
        dto.setCreadoPor(asString(row[i++]));

        return dto;
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
