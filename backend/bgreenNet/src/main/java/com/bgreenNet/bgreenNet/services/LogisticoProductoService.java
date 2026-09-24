package com.bgreenNet.bgreenNet.services;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.models.LogisticoProductoConfig;

import jakarta.annotation.PostConstruct;

@Service
public class LogisticoProductoService {

    private static final Logger log = LoggerFactory.getLogger(LogisticoProductoService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final List<String> PRODUCTOS_DEFAULT = Arrays.asList(
        "(MP) ACEITE CRUDO DE PALMA",
        "BIODIESEL DESTILADO",
        "RESIDUO LIQUIDO (DESECHO SIN VALOR COMERCIAL)",
        "(MP) METANOL",
        "(INS) METILATO DE SODIO",
        "(INS) ESTEARINA DE PALMA",
        "(INS) NITROGENO LIQUIDO",
        "GLICERINA CRUDA",
        "FONDOS DE DESTILACION",
        "(INS) ACIDO CLORHIDRICO",
        "DESECHOS SIN VALOR -TIERRAS USADAS",
        "DESECHOS SIN VALOR - TIERRAS USADAS",
        "(INS) ACIDO FOSFORICO",
        "(INS) SODA CAUSTICA LIQUIDA",
        "DESECHOS DE RESINAS USADAS",
        "(INS) RESINA DE GUARD LEWATIT MONO PLUS SP112 H",
        "(INS) RESINA DE GUARD LEWATIT  MONO PLUS SP112 H"
    );

    private volatile boolean schemaChecked = false;

    @PostConstruct
    public void init() {
        try {
            ensureSchemaAndSeed();
        } catch (Exception e) {
            log.error("Error al inicializar la tabla de productos logísticos en @PostConstruct: {}", e.getMessage());
        }
    }

    public synchronized void ensureSchemaAndSeed() {
        if (schemaChecked) {
            return;
        }

        try {
            // 1. Crear tabla si no existe (patrón simple y seguro para SQL Server / jTDS)
            jdbcTemplate.execute(
                "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('logistico_productos_config') AND type in ('U')) " +
                "CREATE TABLE logistico_productos_config (" +
                "  id INT IDENTITY(1,1) PRIMARY KEY, " +
                "  nombre_producto VARCHAR(255) NOT NULL, " +
                "  permitido BIT NOT NULL DEFAULT 1, " +
                "  fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(), " +
                "  fecha_modificacion DATETIME NOT NULL DEFAULT GETDATE(), " +
                "  usuario VARCHAR(100) NULL, " +
                "  CONSTRAINT UQ_logistico_productos_nombre UNIQUE (nombre_producto))"
            );

            // 2. Sembrar datos por defecto si no existen
            for (String prod : PRODUCTOS_DEFAULT) {
                String clean = prod.trim();
                try {
                    Integer count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM logistico_productos_config WHERE UPPER(LTRIM(RTRIM(nombre_producto))) = UPPER(?)",
                        Integer.class,
                        clean
                    );

                    if (count == null || count == 0) {
                        jdbcTemplate.update(
                            "INSERT INTO logistico_productos_config (nombre_producto, permitido, fecha_creacion, fecha_modificacion, usuario) " +
                            "VALUES (?, 1, GETDATE(), GETDATE(), 'SISTEMA_INICIAL')",
                            clean
                        );
                    }
                } catch (Exception exProd) {
                    log.warn("Aviso al sembrar producto {}: {}", clean, exProd.getMessage());
                }
            }
            log.info("Esquema y datos semilla de logistico_productos_config asegurados exitosamente.");
            schemaChecked = true;
        } catch (Exception e) {
            log.error("Error en ensureSchemaAndSeed de logistico_productos_config: {}", e.getMessage(), e);
        }
    }

    public List<LogisticoProductoConfig> obtenerTodos() {
        ensureSchemaAndSeed();
        try {
            String sql = "SELECT id, nombre_producto, permitido, fecha_creacion, fecha_modificacion, usuario " +
                         "FROM logistico_productos_config ORDER BY nombre_producto ASC";
            return jdbcTemplate.query(sql, (rs, rowNum) -> {
                LogisticoProductoConfig item = new LogisticoProductoConfig();
                item.setId(rs.getLong("id"));
                item.setNombreProducto(rs.getString("nombre_producto"));
                item.setPermitido(rs.getBoolean("permitido"));
                java.sql.Timestamp tc = rs.getTimestamp("fecha_creacion");
                if (tc != null) {
                    item.setFechaCreacion(tc.toLocalDateTime());
                }
                java.sql.Timestamp tm = rs.getTimestamp("fecha_modificacion");
                if (tm != null) {
                    item.setFechaModificacion(tm.toLocalDateTime());
                }
                item.setUsuario(rs.getString("usuario"));
                return item;
            });
        } catch (Exception e) {
            log.error("Error al consultar logistico_productos_config: {}", e.getMessage(), e);
            // Fallback para nunca romper con error 500
            long idx = 1;
            List<LogisticoProductoConfig> fallbackList = new ArrayList<>();
            for (String prod : PRODUCTOS_DEFAULT) {
                LogisticoProductoConfig item = new LogisticoProductoConfig(prod, true, "FALLBACK");
                item.setId(idx++);
                fallbackList.add(item);
            }
            return fallbackList;
        }
    }

    public List<String> obtenerPermitidos() {
        ensureSchemaAndSeed();
        try {
            String sql = "SELECT nombre_producto FROM logistico_productos_config WHERE permitido = 1 ORDER BY nombre_producto ASC";
            List<String> permitidos = jdbcTemplate.queryForList(sql, String.class);
            if (permitidos == null || permitidos.isEmpty()) {
                return PRODUCTOS_DEFAULT;
            }
            return permitidos;
        } catch (Exception e) {
            log.warn("Error al consultar productos permitidos de logistico_productos_config: {}", e.getMessage());
            return PRODUCTOS_DEFAULT;
        }
    }

    public LogisticoProductoConfig permitirProducto(String nombreProducto, String usuario) {
        ensureSchemaAndSeed();
        if (nombreProducto == null || nombreProducto.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del producto no puede estar vacío.");
        }
        String cleanName = nombreProducto.trim();
        String user = (usuario != null && !usuario.trim().isEmpty()) ? usuario.trim() : "MODULO_LOGISTICO";

        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM logistico_productos_config WHERE UPPER(LTRIM(RTRIM(nombre_producto))) = UPPER(?)",
                Integer.class,
                cleanName
            );

            if (count != null && count > 0) {
                jdbcTemplate.update(
                    "UPDATE logistico_productos_config SET permitido = 1, fecha_modificacion = GETDATE(), usuario = ? " +
                    "WHERE UPPER(LTRIM(RTRIM(nombre_producto))) = UPPER(?)",
                    user, cleanName
                );
            } else {
                jdbcTemplate.update(
                    "INSERT INTO logistico_productos_config (nombre_producto, permitido, fecha_creacion, fecha_modificacion, usuario) " +
                    "VALUES (?, 1, GETDATE(), GETDATE(), ?)",
                    cleanName, user
                );
            }
        } catch (Exception e) {
            log.error("Error al permitir producto {}: {}", cleanName, e.getMessage(), e);
            throw new RuntimeException("Error en base de datos: " + e.getMessage());
        }

        LogisticoProductoConfig config = new LogisticoProductoConfig(cleanName, true, user);
        return config;
    }

    public LogisticoProductoConfig togglePermitido(Long id) {
        ensureSchemaAndSeed();
        try {
            jdbcTemplate.update(
                "UPDATE logistico_productos_config SET permitido = CASE WHEN permitido = 1 THEN 0 ELSE 1 END, " +
                "fecha_modificacion = GETDATE() WHERE id = ?",
                id
            );

            List<LogisticoProductoConfig> list = jdbcTemplate.query(
                "SELECT id, nombre_producto, permitido, fecha_creacion, fecha_modificacion, usuario FROM logistico_productos_config WHERE id = ?",
                (rs, rowNum) -> {
                    LogisticoProductoConfig item = new LogisticoProductoConfig();
                    item.setId(rs.getLong("id"));
                    item.setNombreProducto(rs.getString("nombre_producto"));
                    item.setPermitido(rs.getBoolean("permitido"));
                    return item;
                },
                id
            );

            if (!list.isEmpty()) {
                return list.get(0);
            }
        } catch (Exception e) {
            log.error("Error al conmutar visibilidad id {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Error en base de datos: " + e.getMessage());
        }
        throw new IllegalArgumentException("No se encontró producto con id: " + id);
    }

    public LogisticoProductoConfig guardarOActualizar(LogisticoProductoConfig config) {
        ensureSchemaAndSeed();
        if (config.getNombreProducto() == null || config.getNombreProducto().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del producto no puede estar vacío.");
        }
        String cleanName = config.getNombreProducto().trim();
        boolean permitido = config.getPermitido() != null ? config.getPermitido() : true;
        String user = config.getUsuario() != null ? config.getUsuario().trim() : "MODULO_LOGISTICO";

        try {
            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM logistico_productos_config WHERE UPPER(LTRIM(RTRIM(nombre_producto))) = UPPER(?)",
                Integer.class,
                cleanName
            );

            if (count != null && count > 0) {
                jdbcTemplate.update(
                    "UPDATE logistico_productos_config SET permitido = ?, fecha_modificacion = GETDATE(), usuario = ? " +
                    "WHERE UPPER(LTRIM(RTRIM(nombre_producto))) = UPPER(?)",
                    permitido ? 1 : 0, user, cleanName
                );
            } else {
                jdbcTemplate.update(
                    "INSERT INTO logistico_productos_config (nombre_producto, permitido, fecha_creacion, fecha_modificacion, usuario) " +
                    "VALUES (?, ?, GETDATE(), GETDATE(), ?)",
                    cleanName, permitido ? 1 : 0, user
                );
            }
            config.setNombreProducto(cleanName);
            config.setPermitido(permitido);
            config.setUsuario(user);
            return config;
        } catch (Exception e) {
            log.error("Error al guardar producto {}: {}", cleanName, e.getMessage(), e);
            throw new RuntimeException("Error en base de datos: " + e.getMessage());
        }
    }

    public void eliminar(Long id) {
        ensureSchemaAndSeed();
        try {
            jdbcTemplate.update("DELETE FROM logistico_productos_config WHERE id = ?", id);
        } catch (Exception e) {
            log.error("Error al eliminar producto id {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Error en base de datos: " + e.getMessage());
        }
    }
}
