package com.bgreenNet.bgreenNet.services;

import com.bgreenNet.bgreenNet.client.NovoSoapClient;
import com.bgreenNet.bgreenNet.dto.novo.*;
import com.bgreenNet.bgreenNet.models.NovoHistory;
import com.bgreenNet.bgreenNet.models.NovoPoint;
import com.bgreenNet.bgreenNet.models.NovoRule;
import com.bgreenNet.bgreenNet.repository.NovoHistoryRepository;
import com.bgreenNet.bgreenNet.repository.NovoPointRepository;
import com.bgreenNet.bgreenNet.repository.NovoRuleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class NovoIntegrationService {

    private static final Logger logger = LoggerFactory.getLogger(NovoIntegrationService.class);
    private static final DateTimeFormatter REQUEST_DATE_FORMATTER = DateTimeFormatter.ofPattern("MM-dd-yyyy HH:mm:ss");

    private final NovoSoapClient soapClient;
    private final NovoRuleRepository ruleRepository;
    private final NovoHistoryRepository historyRepository;
    private final NovoPointRepository pointRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public NovoIntegrationService(NovoSoapClient soapClient,
                                  NovoRuleRepository ruleRepository,
                                  NovoHistoryRepository historyRepository,
                                  NovoPointRepository pointRepository,
                                  ObjectMapper objectMapper) {
        this.soapClient = soapClient;
        this.ruleRepository = ruleRepository;
        this.historyRepository = historyRepository;
        this.pointRepository = pointRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Consume LoadUserRulesJson, parsea la respuesta e inserta/actualiza las reglas en SQL Server.
     */
    @Transactional
    public List<NovoRule> fetchAndSaveUserRules() {
        logger.info("Iniciando sincronización de reglas de usuario desde NOVO...");
        
        try {
            String jsonResult = soapClient.loadUserRulesJson();
            NovoRuleResponse response = objectMapper.readValue(jsonResult, NovoRuleResponse.class);

            if (response == null) {
                throw new RuntimeException("Respuesta nula obtenida al deserializar las reglas de NOVO.");
            }

            if (response.getResult() != 0) {
                logger.warn("El servicio de NOVO reportó un código de retorno no exitoso. Código: {}, Mensaje: {}", 
                    response.getResult(), response.getMessage());
                throw new RuntimeException("NOVO Error: " + response.getMessage());
            }

            List<NovoRuleDTO> dtoList = response.getData();
            if (dtoList == null || dtoList.isEmpty()) {
                logger.info("No se encontraron reglas devueltas por NOVO.");
                return Collections.emptyList();
            }

            List<NovoRule> savedRules = new ArrayList<>();
            LocalDateTime now = LocalDateTime.now();

            for (NovoRuleDTO dto : dtoList) {
                if (dto.getRuleId() == null) continue;
                
                NovoRule entity = new NovoRule();
                entity.setRuleId(dto.getRuleId());
                entity.setRuleDescription(dto.getRuleDescription());
                entity.setRuleType(dto.getRuleType());
                entity.setRuleFilter(dto.getRuleFilter());
                entity.setUpdatedAt(now);

                savedRules.add(ruleRepository.save(entity));
            }

            logger.info("Sincronización de reglas completada. Total guardadas: {}", savedRules.size());
            return savedRules;

        } catch (Exception e) {
            logger.error("Error procesando o guardando reglas de NOVO: {}", e.getMessage(), e);
            throw new RuntimeException("Error en sincronización de reglas NOVO: " + e.getMessage(), e);
        }
    }

    /**
     * Consume LoadRuleHistoryDataJson, parsea la respuesta e inserta los históricos en SQL Server.
     */
    @Transactional
    public List<NovoHistory> fetchAndSaveRuleHistory(Long ruleId, LocalDateTime start, LocalDateTime end) {
        if (ruleId == null || start == null || end == null) {
            throw new IllegalArgumentException("Los parámetros ruleId, start y end son obligatorios.");
        }

        String startStr = start.format(REQUEST_DATE_FORMATTER);
        String endStr = end.format(REQUEST_DATE_FORMATTER);

        logger.info("Iniciando sincronización de históricos desde NOVO. RuleId: {}, Rango: {} al {}", ruleId, startStr, endStr);

        try {
            String jsonResult = soapClient.loadRuleHistoryDataJson(ruleId, startStr, endStr);
            NovoHistoryResponse response = objectMapper.readValue(jsonResult, NovoHistoryResponse.class);

            if (response == null) {
                throw new RuntimeException("Respuesta nula obtenida al deserializar los históricos de NOVO.");
            }

            if (response.getResult() != 0) {
                logger.warn("El servicio de NOVO reportó código de retorno no exitoso para históricos. Código: {}, Mensaje: {}", 
                    response.getResult(), response.getMessage());
                throw new RuntimeException("NOVO Error (Históricos): " + response.getMessage());
            }

            List<NovoHistoryDataDTO> dtoList = response.getData();
            if (dtoList == null || dtoList.isEmpty()) {
                logger.info("No se encontraron registros históricos devueltos por NOVO para la regla {}.", ruleId);
                return Collections.emptyList();
            }

            List<NovoHistory> savedHistories = new ArrayList<>();
            LocalDateTime importTime = LocalDateTime.now();

            for (NovoHistoryDataDTO dto : dtoList) {
                NovoHistory entity = new NovoHistory();
                entity.setDeviceId(dto.getDeviceId());
                entity.setDeviceName(dto.getDeviceName());
                entity.setMeterId(dto.getMeterId());
                entity.setHistory(dto.getHistory());
                entity.setHistoryId(dto.getHistoryId());
                entity.setHistoryName(dto.getHistoryName());
                entity.setIntervalType(dto.getIntervalType());
                entity.setRunType(dto.getRunType());
                entity.setHistoryDateTime(parseDateTime(dto.getHistoryDateTime()));
                entity.setImportedAt(importTime);

                // Serializar detailHistory dinámico a JSON
                entity.setDetailHistoryJson(serializeToJson(dto.getDetailHistory()));

                savedHistories.add(historyRepository.save(entity));
            }

            logger.info("Sincronización de históricos completada. Total guardados: {}", savedHistories.size());
            return savedHistories;

        } catch (Exception e) {
            logger.error("Error procesando o guardando históricos de NOVO: {}", e.getMessage(), e);
            throw new RuntimeException("Error en sincronización de históricos NOVO: " + e.getMessage(), e);
        }
    }

    /**
     * Consume LoadPointRuleDataJson, parsea la respuesta e inserta los punteros/valores actuales en SQL Server.
     */
    @Transactional
    public List<NovoPoint> fetchAndSavePointRuleData(Long ruleId) {
        if (ruleId == null) {
            throw new IllegalArgumentException("El parámetro ruleId es obligatorio.");
        }

        logger.info("Iniciando sincronización de valores actuales de punteros desde NOVO. RuleId: {}", ruleId);

        try {
            String jsonResult = soapClient.loadPointRuleDataJson(ruleId);
            NovoPointResponse response = objectMapper.readValue(jsonResult, NovoPointResponse.class);

            if (response == null) {
                throw new RuntimeException("Respuesta nula obtenida al deserializar los puntos/punteros de NOVO.");
            }

            if (response.getResult() != 0) {
                logger.warn("El servicio de NOVO reportó código de retorno no exitoso para puntos. Código: {}, Mensaje: {}", 
                    response.getResult(), response.getMessage());
                throw new RuntimeException("NOVO Error (Puntos): " + response.getMessage());
            }

            List<NovoPointDataDTO> dtoList = response.getData();
            if (dtoList == null || dtoList.isEmpty()) {
                logger.info("No se encontraron registros de puntos devueltos por NOVO para la regla {}.", ruleId);
                return Collections.emptyList();
            }

            List<NovoPoint> savedPoints = new ArrayList<>();
            LocalDateTime importTime = LocalDateTime.now();

            for (NovoPointDataDTO deviceDto : dtoList) {
                List<NovoPointAttributeDTO> attributes = deviceDto.getAttributes();
                if (attributes == null || attributes.isEmpty()) {
                    continue;
                }

                for (NovoPointAttributeDTO attrDto : attributes) {
                    NovoPoint entity = new NovoPoint();
                    entity.setDeviceId(deviceDto.getDeviceId());
                    entity.setDeviceName(deviceDto.getDeviceName());
                    entity.setMeterId(deviceDto.getMeterId());
                    entity.setProtocolComm(deviceDto.getProtocolComm());
                    
                    // Asignar atributos del punto
                    entity.setAttributeName(attrDto.getAttribute());
                    entity.setPointAddress(attrDto.getPointAddress());
                    entity.setPointName(attrDto.getPointName());
                    entity.setPointUnit(attrDto.getPointUnit());
                    entity.setCurrentValue(attrDto.getCurrentValue());
                    entity.setModificationDateTime(parseDateTime(attrDto.getModificationDateTime()));
                    entity.setImportedAt(importTime);

                    savedPoints.add(pointRepository.save(entity));
                }
            }

            logger.info("Sincronización de puntos completada. Total de registros guardados: {}", savedPoints.size());
            return savedPoints;

        } catch (Exception e) {
            logger.error("Error procesando o guardando puntos de NOVO: {}", e.getMessage(), e);
            throw new RuntimeException("Error en sincronización de puntos NOVO: " + e.getMessage(), e);
        }
    }

    private String serializeToJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            logger.error("Error serializando campo detailHistory dinámico a JSON: {}", e.getMessage());
            return null;
        }
    }

    private LocalDateTime parseDateTime(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return null;
        }
        dateStr = dateStr.trim();

        // Intentar con múltiples formatos posibles para asegurar resiliencia
        DateTimeFormatter[] formatters = {
            DateTimeFormatter.ofPattern("MM-dd-yyyy HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
            DateTimeFormatter.ISO_LOCAL_DATE_TIME
        };

        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDateTime.parse(dateStr, formatter);
            } catch (Exception ignored) {
            }
        }

        // Intento de fallback usando timestamp directo si tiene formato nativo SQL
        try {
            return java.sql.Timestamp.valueOf(dateStr).toLocalDateTime();
        } catch (Exception ignored) {
        }

        logger.warn("No se pudo analizar la cadena de fecha: '{}'. Se establecerá como NULL.", dateStr);
        return null;
    }
}
