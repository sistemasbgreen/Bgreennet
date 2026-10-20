package com.bgreenNet.bgreenNet.services;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.JavaMailSender;

import com.bgreenNet.bgreenNet.models.Unidad;
import com.bgreenNet.bgreenNet.models.UnidadMedida;
import com.bgreenNet.bgreenNet.models.VariableScadaConfig;
import com.bgreenNet.bgreenNet.repository.UnidadRepository;
import com.bgreenNet.bgreenNet.repository.UnidadMedidaRepository;
import com.bgreenNet.bgreenNet.repository.VariableScadaConfigRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class VariablesScadaService {

    private final JdbcTemplate plcJdbcTemplate;

    @Autowired
    private UnidadRepository unidadRepository;

    @Autowired
    private UnidadMedidaRepository unidadMedidaRepository;

    @Autowired
    private VariableScadaConfigRepository variableScadaConfigRepository;

    @Autowired
    private EmailReporteService emailReporteService;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private JdbcTemplate appJdbcTemplate;

    public VariablesScadaService(@Qualifier("plcJdbcTemplate") JdbcTemplate plcJdbcTemplate) {
        this.plcJdbcTemplate = plcJdbcTemplate;
    }

    /**
     * Retorna el último registro de Tabla_12 de la 3ª BD (DB_Process_Data_PLCs)
     * como un mapa clave→valor (incluyendo 'timestamp' como String ISO).
     */
    public Map<String, Object> obtenerUltimo() {
        String sql = "SELECT TOP 1 * FROM [DB_Process_Data_PLCs].[dbo].[Tabla_12] ORDER BY [timestamp] DESC";
        try {
            Map<String, Object> row = plcJdbcTemplate.queryForMap(sql);
            Map<String, Object> result = new HashMap<>();
            for (Map.Entry<String, Object> entry : row.entrySet()) {
                result.put(entry.getKey(), entry.getValue());
            }
            return result;
        } catch (Exception e) {
            System.err.println("❌ Error consultando último registro de Tabla_12: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("No se pudo leer el último registro de Tabla_12", e);
        }
    }

    /**
     * Retorna todos los registros de Tabla_12 de la 3ª BD filtrados por fecha (formato yyyy-MM-dd)
     * o por defecto de hoy ordenados por timestamp.
     */
    public java.util.List<Map<String, Object>> obtenerHistoricoHoy(String fecha) {
        String sql;
        try {
            if (fecha != null && !fecha.trim().isEmpty()) {
                sql = "SELECT * FROM [DB_Process_Data_PLCs].[dbo].[Tabla_12] " +
                      "WHERE [timestamp] >= CONVERT(DATETIME, ?, 120) AND [timestamp] < DATEADD(day, 1, CONVERT(DATETIME, ?, 120)) " +
                      "ORDER BY [timestamp] ASC";
                return plcJdbcTemplate.queryForList(sql, fecha.trim() + " 00:00:00", fecha.trim() + " 00:00:00");
            } else {
                sql = "SELECT * FROM [DB_Process_Data_PLCs].[dbo].[Tabla_12] " +
                      "WHERE [timestamp] >= CAST(GETDATE() AS DATE) " +
                      "ORDER BY [timestamp] ASC";
                return plcJdbcTemplate.queryForList(sql);
            }
        } catch (Exception e) {
            System.err.println("❌ Error consultando histórico de Tabla_12: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("No se pudo leer el histórico de Tabla_12", e);
        }
    }

    /**
     * Retorna todas las configuraciones de variables guardadas.
     * Si la tabla está vacía, la inicializa con los valores estáticos.
     */
    public List<VariableScadaConfig> obtenerTodasLasVariables() {
        asegurarColumnasNodeRed();
        List<VariableScadaConfig> configList = variableScadaConfigRepository.findAll();
        if (configList.isEmpty()) {
            inicializarVariablesPorDefecto();
            return variableScadaConfigRepository.findAll();
        }
        return configList;
    }

    /**
     * Obtiene la lista de todas las unidades de proceso disponibles.
     */
    public List<Unidad> obtenerTodasLasUnidades() {
        return unidadRepository.findAll();
    }

    /**
     * Obtiene la lista de todas las unidades de medida físicas disponibles.
     */
    public List<UnidadMedida> obtenerTodasLasUnidadesMedida() {
        return unidadMedidaRepository.findAll();
    }

    /**
     * Crea o actualiza una variable en la configuración.
     */
    public VariableScadaConfig guardarOActualizarVariable(VariableScadaConfig config, String usuarioModificador) {
        Optional<VariableScadaConfig> existenteOpt = variableScadaConfigRepository.findById(config.getTag());
        
        // Asegurar que la Unidad y la Unidad de Medida existan en base de datos
        Unidad unidad = obtenerOAsegurarUnidad(config.getUnidad().getNombre(), usuarioModificador);
        UnidadMedida unit = config.getUnit() != null ? obtenerOAsegurarUnidadMedida(config.getUnit().getNombre(), usuarioModificador) : null;

        VariableScadaConfig aGuardar;
        if (existenteOpt.isPresent()) {
            aGuardar = existenteOpt.get();
            aGuardar.setNombre(config.getNombre());
            aGuardar.setUnidad(unidad);
            aGuardar.setUnit(unit);
            aGuardar.setMetaMin(config.getMetaMin());
            aGuardar.setMetaMax(config.getMetaMax());
            aGuardar.setNotificar(config.getNotificar());
            aGuardar.setActivo(config.getActivo() != null ? config.getActivo() : true);
            aGuardar.setActualizadoEn(LocalDateTime.now());
            aGuardar.setUsuario(usuarioModificador);
        } else {
            aGuardar = config;
            aGuardar.setUnidad(unidad);
            aGuardar.setUnit(unit);
            aGuardar.setNotificar(config.getNotificar() != null ? config.getNotificar() : false);
            aGuardar.setActivo(config.getActivo() != null ? config.getActivo() : true);
            aGuardar.setCreadoEn(LocalDateTime.now());
            aGuardar.setActualizadoEn(LocalDateTime.now());
            aGuardar.setUsuario(usuarioModificador);
        }
        return variableScadaConfigRepository.save(aGuardar);
    }

    /**
     * Sincroniza las variables desde la Tabla_14 de DB_Process_Data_PLCs
     */
    public int sincronizarDesdeTabla14(String usuario) {
        String sql = "SELECT * FROM [DB_Process_Data_PLCs].[dbo].[Tabla_14]";
        List<Map<String, Object>> rows;
        try {
            rows = plcJdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            System.err.println("⚠️ Tabla_14 no se pudo consultar o no existe: " + e.getMessage());
            return 0;
        }

        int count = 0;
        for (Map<String, Object> row : rows) {
            String tag = findValueIgnoreCase(row, "tag", "variable");
            if (tag == null || tag.trim().isEmpty()) continue;

            String nombre = findValueIgnoreCase(row, "nombre", "name", "descripcion");
            if (nombre == null || nombre.trim().isEmpty()) nombre = tag;

            String unidadNom = findValueIgnoreCase(row, "unidad", "area", "grupo");
            if (unidadNom == null || unidadNom.trim().isEmpty()) unidadNom = "General";

            String unitNom = findValueIgnoreCase(row, "unit", "unidad_medida", "um");

            Double min = null;
            Object minVal = row.get("meta_min");
            if (minVal == null) minVal = row.get("min");
            if (minVal instanceof Number) min = ((Number) minVal).doubleValue();

            Double max = null;
            Object maxVal = row.get("meta_max");
            if (maxVal == null) maxVal = row.get("max");
            if (maxVal instanceof Number) max = ((Number) maxVal).doubleValue();

            Unidad unidad = obtenerOAsegurarUnidad(unidadNom, usuario);
            UnidadMedida unit = unitNom != null && !unitNom.trim().isEmpty() ? obtenerOAsegurarUnidadMedida(unitNom, usuario) : null;

            VariableScadaConfig config = new VariableScadaConfig();
            config.setTag(tag);
            config.setNombre(nombre);
            config.setUnidad(unidad);
            config.setUnit(unit);
            config.setMetaMin(min);
            config.setMetaMax(max);

            guardarOActualizarVariable(config, usuario);
            count++;
        }
        return count;
    }

    private String findValueIgnoreCase(Map<String, Object> map, String... keys) {
        for (String k : keys) {
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(k)) {
                    return entry.getValue() != null ? entry.getValue().toString() : null;
                }
            }
        }
        return null;
    }

    private Unidad obtenerOAsegurarUnidad(String nombre, String usuario) {
        return unidadRepository.findByNombre(nombre)
                .orElseGet(() -> {
                    Unidad u = new Unidad();
                    u.setNombre(nombre);
                    u.setEstado(1);
                    u.setDateCreate(LocalDateTime.now());
                    u.setDateModify(LocalDateTime.now());
                    u.setUsuario(usuario);
                    return unidadRepository.save(u);
                });
    }

    private UnidadMedida obtenerOAsegurarUnidadMedida(String nombre, String usuario) {
        if (nombre == null || nombre.trim().isEmpty()) return null;
        return unidadMedidaRepository.findByNombre(nombre)
                .orElseGet(() -> {
                    UnidadMedida um = new UnidadMedida();
                    um.setNombre(nombre);
                    um.setEstado(1);
                    um.setDateCreate(LocalDateTime.now());
                    um.setDateModify(LocalDateTime.now());
                    um.setUsuario(usuario);
                    return unidadMedidaRepository.save(um);
                });
    }

    private void inicializarVariablesPorDefecto() {
        System.out.println("🔄 Inicializando variables scada por defecto en BgreenNet_Dev...");
        
        // Mapeo inicial (hardcoded en Angular)
        Map<String, String[][]> iniciales = new HashMap<>();
        iniciales.put("Unidad 150", new String[][] {
            { "120TT01", "Temperatura CPO Ingreso", "50", "65", "°C" },
            { "150TT02", "150HE01", "95", "125", "°C" },
            { "120PT02", "Presión Bomba 150P02", "2.5", "5", "Bar" },
            { "150TT05", "Temperatura Entrada Filtros Niágara", "95", "125", "°C" },
            { "120FT02", "Flujo Alimentación", "", "", "" },
            { "150PT05", "Presión Reactor", "", "", "" }
        });
        iniciales.put("Unidad 320", new String[][] {
            { "320PT04", "Presión Resina 320T03", "3", "4.5", "Bar" },
            { "320TT02", "Temperatura 320HE02", "95", "115", "°C" },
            { "320PT01", "Presión Resina 320T02", "3", "5.5", "Bar" },
            { "320TT06", "Temperatura 320HE03", "95", "120", "°C" },
            { "320TT08", "Temperatura 320HE04", "50", "75", "°C" },
            { "320PT06", "Vacío Flash 320T04", "450", "900", "mBar" }
        });
        iniciales.put("Unidad 350", new String[][] {
            { "350AT01", "pH Dosificación de Acético", "7", "9", "-" }
        });
        iniciales.put("Unidad 420", new String[][] {
            { "420TT06", "Temperatura 420HE02", "90", "115", "°C" },
            { "420TT05", "Temperatura 420HE03", "95", "110", "°C" },
            { "420PT06", "Vacío flash 420T04", "450", "900", "mBar" },
            { "420PT04", "Vacío flash 420T02", "450", "900", "mBar" },
            { "420TT01", "Temperatura 420HE01", "100", "130", "°C" }
        });
        iniciales.put("Unidad 450", new String[][] {
            { "450TT07", "Temperatura Flash 450T06", "125", "160", "°C" },
            { "450PT16", "Presión Recirculación Flash 450T06", "0.5", "2", "Bar" }
        });
        iniciales.put("Unidad 520", new String[][] {
            { "520PT031", "Vacío flash 520T01", "100", "300", "mBar" },
            { "520TT059", "Temperatura Calentamiento 520T02", "145", "185", "°C" },
            { "520TT012", "Temperatura Entrada Chaqueta Inferior WFE 520", "250", "265", "°C" },
            { "520TT107", "Temperatura Recirculación 1er Condensador", "178", "192", "°C" },
            { "520TT114", "Temperatura Recirculación 2do Condensador", "95", "115", "°C" },
            { "421TT02", "Temperatura entrada resinas 421", "", "80", "°C" },
            { "520TT023", "Temperatura Salida B100", "", "90", "°C" },
            { "520PT062", "Vacío unidad 520", "8", "18", "mBar" },
            { "520TT04", "Temperatura Ingreso Flash 520T01", "95", "140", "°C" },
            { "520P05", "Bomba Transferencia 520P05", "", "", "" },
            { "520FT01", "Flujo Salida Tanque 520FT01", "", "", "" },
            { "520AG01", "Agitador Tanque 520AG01", "", "", "" }
        });
        iniciales.put("Unidad 550", new String[][] {
            { "550PT03", "Presión Entrada Filtro 550PT03", "", "", "" },
            { "550PT04", "Delta presión columna metanol", "", "0.4", "Bar" },
            { "550TT03", "Temperatura fondo columna metanol", "68", "75", "°C" },
            { "550TT06", "Temperatura rehervidor", "95", "105", "°C" },
            { "550TT04", "Temperatura media columna metanol", "65", "73", "°C" },
            { "550TT05", "Temperatura tope columna metanol", "63", "67", "°C" },
            { "550FT04", "Flujo de vapor columna de metanol", "1200", "2000", "Kg/h" }
        });

        for (Map.Entry<String, String[][]> entry : iniciales.entrySet()) {
            Unidad unidad = obtenerOAsegurarUnidad(entry.getKey(), "sistema");
            for (String[] data : entry.getValue()) {
                String tag = data[0];
                String nombre = data[1];
                Double min = data[2].isEmpty() ? null : Double.parseDouble(data[2]);
                Double max = data[3].isEmpty() ? null : Double.parseDouble(data[3]);
                String unitNom = data[4];
                
                UnidadMedida unit = (unitNom == null || unitNom.isEmpty()) ? null : obtenerOAsegurarUnidadMedida(unitNom, "sistema");
                
                VariableScadaConfig config = new VariableScadaConfig();
                config.setTag(tag);
                config.setNombre(nombre);
                config.setUnidad(unidad);
                config.setUnit(unit);
                config.setMetaMin(min);
                config.setMetaMax(max);
                config.setActivo(true);
                config.setCreadoEn(LocalDateTime.now());
                config.setActualizadoEn(LocalDateTime.now());
                config.setUsuario("sistema");
                variableScadaConfigRepository.save(config);
            }
        }
    }

    public Unidad guardarOActualizarUnidad(Unidad unidad, String usuario) {
        if (unidad.getId() != null) {
            Optional<Unidad> existente = unidadRepository.findById(unidad.getId());
            if (existente.isPresent()) {
                Unidad act = existente.get();
                act.setNombre(unidad.getNombre());
                act.setEstado(unidad.getEstado());
                act.setDateModify(LocalDateTime.now());
                act.setUsuario(usuario);
                return unidadRepository.save(act);
            }
        }
        unidad.setDateCreate(LocalDateTime.now());
        unidad.setDateModify(LocalDateTime.now());
        unidad.setUsuario(usuario);
        if (unidad.getEstado() == null) unidad.setEstado(1);
        return unidadRepository.save(unidad);
    }

    public UnidadMedida guardarOActualizarUnidadMedida(UnidadMedida unidadMedida, String usuario) {
        if (unidadMedida.getId() != null) {
            Optional<UnidadMedida> existente = unidadMedidaRepository.findById(unidadMedida.getId());
            if (existente.isPresent()) {
                UnidadMedida act = existente.get();
                act.setNombre(unidadMedida.getNombre());
                act.setEstado(unidadMedida.getEstado());
                act.setDateModify(LocalDateTime.now());
                act.setUsuario(usuario);
                return unidadMedidaRepository.save(act);
            }
        }
        unidadMedida.setDateCreate(LocalDateTime.now());
        unidadMedida.setDateModify(LocalDateTime.now());
        unidadMedida.setUsuario(usuario);
        if (unidadMedida.getEstado() == null) unidadMedida.setEstado(1);
        return unidadMedidaRepository.save(unidadMedida);
    }

    private void asegurarTablaConfigPlc() {
        try {
            appJdbcTemplate.execute("""
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[config_receptores_reporte_plc]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE [dbo].[config_receptores_reporte_plc](
                        [id] [int] PRIMARY KEY,
                        [destinatarios] [varchar](MAX) NOT NULL
                    )
                    INSERT INTO [dbo].[config_receptores_reporte_plc] (id, destinatarios) VALUES (1, 'Notificacionesbgreennet@bgreen.com.co')
                END
            """);
        } catch (Exception e) {
            System.err.println("Error asegurando tabla config_receptores_reporte_plc: " + e.getMessage());
        }
    }

    private void asegurarColumnasNodeRed() {
        try {
            appJdbcTemplate.execute("""
                IF COL_LENGTH('dbo.variables_scada', 'origen_node_red') IS NULL
                BEGIN
                    ALTER TABLE dbo.variables_scada ADD origen_node_red VARCHAR(255) NULL;
                END
                IF COL_LENGTH('dbo.variables_scada', 'db_node_red') IS NULL
                BEGIN
                    ALTER TABLE dbo.variables_scada ADD db_node_red VARCHAR(255) NULL;
                END
            """);
        } catch (Exception e) {
            System.err.println("Error asegurando columnas de Node-RED en variables_scada: " + e.getMessage());
        }
    }

    public String obtenerReceptoresPlcConfigurados() {
        asegurarTablaConfigPlc();
        try {
            return appJdbcTemplate.queryForObject("SELECT destinatarios FROM config_receptores_reporte_plc WHERE id = 1", String.class);
        } catch (Exception e) {
            return "Notificacionesbgreennet@bgreen.com.co"; // Fallback
        }
    }

    public void guardarReceptoresPlc(String nuevosDestinatarios) {
        asegurarTablaConfigPlc();
        int rows = appJdbcTemplate.update(
            "UPDATE config_receptores_reporte_plc SET destinatarios = ? WHERE id = 1",
            nuevosDestinatarios);

        if (rows == 0) {
            appJdbcTemplate.update(
                "INSERT INTO config_receptores_reporte_plc (id, destinatarios) VALUES (1, ?)",
                nuevosDestinatarios);
        }
    }

    public void enviarAlertaEmail(String tag, Double valor, String tipo, String chartImageBase64) {
        Optional<VariableScadaConfig> opt = variableScadaConfigRepository.findById(tag);
        if (opt.isEmpty()) return;
        VariableScadaConfig varConfig = opt.get();

        try {
            String destinatarios = obtenerReceptoresPlcConfigurados();
            if (destinatarios == null || destinatarios.trim().isEmpty()) {
                System.err.println("[AlertaScada] No hay receptores configurados para enviar el correo.");
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String emailFrom = "Notificacionesbgreennet@bgreen.com.co";
            helper.setFrom(emailFrom);
            helper.setTo(destinatarios.split(","));

            boolean fuera = "fuera".equalsIgnoreCase(tipo);
            String subject = fuera 
                ? "⚠️ ALERTA SCADA: Variable " + tag + " FUERA de límites"
                : "✅ RESTABLECIMIENTO SCADA: Variable " + tag + " DENTRO de límites";
            
            helper.setSubject(subject);

            String colorHdr = fuera ? "#dc3545" : "#198754";
            String estadoTexto = fuera ? "FUERA DE LÍMITES (CRÍTICO)" : "DENTRO DE LÍMITES (NORMALIZADO)";
            
            String limitsText = "";
            if (varConfig.getMetaMin() != null && varConfig.getMetaMax() != null) {
                limitsText = varConfig.getMetaMin() + " - " + varConfig.getMetaMax();
            } else if (varConfig.getMetaMin() != null) {
                limitsText = "Mín: " + varConfig.getMetaMin();
            } else if (varConfig.getMetaMax() != null) {
                limitsText = "Máx: " + varConfig.getMetaMax();
            } else {
                limitsText = "Sin límites definidos";
            }

            String unitSymbol = varConfig.getUnit() != null ? varConfig.getUnit().getNombre() : "";

            boolean tieneGrafico = chartImageBase64 != null && chartImageBase64.contains(",");

            String html = "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "<style>"
                + "body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px; color: #333; }"
                + ".card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #dee2e6; }"
                + ".header { background-color: " + colorHdr + "; padding: 20px; text-align: center; color: #ffffff; }"
                + ".header h2 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }"
                + ".content { padding: 30px; }"
                + ".item { display: flex; border-bottom: 1px solid #f1f3f5; padding: 12px 0; font-size: 14px; }"
                + ".label { width: 180px; font-weight: bold; color: #495057; }"
                + ".value { font-weight: 500; color: #212529; }"
                + ".value.alert { color: #dc3545; font-weight: bold; }"
                + ".value.normal { color: #198754; font-weight: bold; }"
                + ".footer { text-align: center; padding: 15px; font-size: 11px; color: #868e96; background-color: #f1f3f5; }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class='card'>"
                + "  <div class='header'>"
                + "    <h2>" + subject + "</h2>"
                + "  </div>"
                + "  <div class='content'>"
                + "    <div class='item'>"
                + "      <div class='label'>Tag de Variable:</div>"
                + "      <div class='value'>" + tag + "</div>"
                + "    </div>"
                + "    <div class='item'>"
                + "      <div class='label'>Nombre / Descripción:</div>"
                + "      <div class='value'>" + varConfig.getNombre() + "</div>"
                + "    </div>"
                + "    <div class='item'>"
                + "      <div class='label'>Proceso / Planta:</div>"
                + "      <div class='value'>" + (varConfig.getUnidad() != null ? varConfig.getUnidad().getNombre() : "-") + "</div>"
                + "    </div>"
                + "    <div class='item'>"
                + "      <div class='label'>Valor Registrado:</div>"
                + "      <div class='value " + (fuera ? "alert" : "normal") + "'>" + valor + " " + unitSymbol + "</div>"
                + "    </div>"
                + "    <div class='item'>"
                + "      <div class='label'>Límites de Meta:</div>"
                + "      <div class='value'>" + limitsText + " " + unitSymbol + "</div>"
                + "    </div>"
                + "    <div class='item'>"
                + "      <div class='label'>Estado:</div>"
                + "      <div class='value " + (fuera ? "alert" : "normal") + "'>" + estadoTexto + "</div>"
                + "    </div>"
                + "    <div class='item'>"
                + "      <div class='label'>Fecha y Hora:</div>"
                + "      <div class='value'>" + LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) + "</div>"
                + "    </div>"
                + (tieneGrafico 
                    ? "    <div class='item' style='display: block; text-align: center; margin-top: 15px; border-bottom: none;'>"
                    + "      <div class='label' style='width: 100%; text-align: left; margin-bottom: 8px;'>Gráfico de Comportamiento Reciente:</div>"
                    + "      <img src='cid:chartImage' style='max-width: 100%; height: auto; border: 1px solid #dee2e6; border-radius: 4px; display: inline-block;' alt='Gráfico SCADA' />"
                    + "    </div>"
                    : "")
                + "  </div>"
                + "  <div class='footer'>"
                + "    Sistema de Notificaciones BGREEN · No responder a este correo."
                + "  </div>"
                + "</div>"
                + "</body>"
                + "</html>";

            helper.setText(html, true);

            if (tieneGrafico) {
                String base64Data = chartImageBase64.substring(chartImageBase64.indexOf(",") + 1);
                byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Data);
                helper.addInline("chartImage", new org.springframework.core.io.ByteArrayResource(imageBytes), "image/png");
            }

            mailSender.send(message);
            System.out.println("[AlertaScada] ✅ Correo de alerta enviado correctamente para la variable " + tag);
        } catch (Exception e) {
            System.err.println("[AlertaScada] ❌ Error enviando correo de alerta para variable " + tag + ": " + e.getMessage());
        }
    }


    // =========================================================================
    // REPORTE DIARIO PROGRAMADO (6:00 AM TODOS LOS DÍAS)
    // Cobertura: 06:00:00 AM del día anterior hasta las 05:59:59 AM del día actual
    // =========================================================================

    public static class VariableEstadisticaReporte {
        public String tag;
        public String nombre;
        public String unidadProceso;
        public String unidadMedida;
        public Double metaMin;
        public Double metaMax;
        public boolean notificar;
        public int totalLecturas = 0;
        public double minRegistrado = Double.MAX_VALUE;
        public double maxRegistrado = -Double.MAX_VALUE;
        public double sumaLecturas = 0.0;
        public int lecturasFueraDeRango = 0;
        public int porDebajoMin = 0;
        public int porEncimaMax = 0;
        public double peorExcursion = 0.0;

        public double getPromedio() {
            return totalLecturas > 0 ? (sumaLecturas / totalLecturas) : 0.0;
        }

        public double getPorcentajeFuera() {
            return totalLecturas > 0 ? ((double) lecturasFueraDeRango / totalLecturas) * 100.0 : 0.0;
        }

        public double getPorcentajeCumplimiento() {
            return Math.max(0.0, 100.0 - getPorcentajeFuera());
        }

        public boolean tieneNovedad() {
            return lecturasFueraDeRango > 0;
        }
    }

    private Double obtenerValorDeFila(Map<String, Object> row, String tag) {
        if (tag == null || row == null) return null;
        Object val = row.get(tag);
        if (val == null) val = row.get("[" + tag + "]");
        if (val == null) {
            String cleanTag = tag.replace("[", "").replace("]", "").trim();
            for (Map.Entry<String, Object> e : row.entrySet()) {
                String keyClean = e.getKey().replace("[", "").replace("]", "").trim();
                if (keyClean.equalsIgnoreCase(cleanTag)) {
                    val = e.getValue();
                    break;
                }
            }
        }
        if (val instanceof Number) {
            return ((Number) val).doubleValue();
        }
        if (val instanceof String) {
            try {
                return Double.parseDouble(((String) val).trim());
            } catch (Exception ex) {
                return null;
            }
        }
        return null;
    }

    public Map<String, Object> generarYEnviarReporteDiario(java.time.LocalDate fechaRef) {
        java.time.LocalDate ref = (fechaRef != null) ? fechaRef : java.time.LocalDate.now();
        java.time.LocalDateTime fin = ref.atTime(5, 59, 59);
        java.time.LocalDateTime inicio = ref.minusDays(1).atTime(6, 0, 0);

        java.time.format.DateTimeFormatter dtfSql = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        java.time.format.DateTimeFormatter dtfDisplay = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a");
        java.time.format.DateTimeFormatter dtfSoloFecha = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");

        String strInicioSql = inicio.format(dtfSql);
        String strFinSql = fin.format(dtfSql);

        System.out.println("[ReporteScada6AM] ⏳ Generando reporte de 24 horas: " + strInicioSql + " hasta " + strFinSql);

        // 1. Consultar registros de Tabla_12
        String sql = "SELECT * FROM [DB_Process_Data_PLCs].[dbo].[Tabla_12] " +
                     "WHERE [timestamp] >= CONVERT(DATETIME, ?, 120) AND [timestamp] <= CONVERT(DATETIME, ?, 120) " +
                     "ORDER BY [timestamp] ASC";

        List<Map<String, Object>> rows;
        try {
            rows = plcJdbcTemplate.queryForList(sql, strInicioSql, strFinSql);
            System.out.println("[ReporteScada6AM] Registros obtenidos de Tabla_12: " + rows.size());
        } catch (Exception e) {
            System.err.println("[ReporteScada6AM] ❌ Error consultando Tabla_12: " + e.getMessage());
            rows = new java.util.ArrayList<>();
        }

        // 2. Obtener variables configuradas activas
        List<VariableScadaConfig> configs = variableScadaConfigRepository.findAll().stream()
                .filter(v -> v.getActivo() == null || v.getActivo())
                .collect(java.util.stream.Collectors.toList());

        List<VariableEstadisticaReporte> stats = new java.util.ArrayList<>();

        for (VariableScadaConfig cfg : configs) {
            VariableEstadisticaReporte stat = new VariableEstadisticaReporte();
            stat.tag = cfg.getTag();
            stat.nombre = cfg.getNombre() != null ? cfg.getNombre() : cfg.getTag();
            stat.unidadProceso = cfg.getUnidad() != null ? cfg.getUnidad().getNombre() : "General";
            stat.unidadMedida = cfg.getUnit() != null ? cfg.getUnit().getNombre() : "";
            stat.metaMin = cfg.getMetaMin();
            stat.metaMax = cfg.getMetaMax();
            stat.notificar = Boolean.TRUE.equals(cfg.getNotificar());

            for (Map<String, Object> r : rows) {
                Double v = obtenerValorDeFila(r, cfg.getTag());
                if (v != null && !Double.isNaN(v) && !Double.isInfinite(v)) {
                    stat.totalLecturas++;
                    stat.sumaLecturas += v;
                    if (v < stat.minRegistrado) stat.minRegistrado = v;
                    if (v > stat.maxRegistrado) stat.maxRegistrado = v;

                    if (cfg.getMetaMin() != null && v < cfg.getMetaMin()) {
                        stat.lecturasFueraDeRango++;
                        stat.porDebajoMin++;
                        double diff = cfg.getMetaMin() - v;
                        if (diff > stat.peorExcursion) stat.peorExcursion = diff;
                    } else if (cfg.getMetaMax() != null && v > cfg.getMetaMax()) {
                        stat.lecturasFueraDeRango++;
                        stat.porEncimaMax++;
                        double diff = v - cfg.getMetaMax();
                        if (diff > stat.peorExcursion) stat.peorExcursion = diff;
                    }
                }
            }

            if (stat.minRegistrado == Double.MAX_VALUE) stat.minRegistrado = 0.0;
            if (stat.maxRegistrado == -Double.MAX_VALUE) stat.maxRegistrado = 0.0;

            stats.add(stat);
        }

        // 3. Separar en novedades y normales
        List<VariableEstadisticaReporte> conNovedad = stats.stream()
                .filter(s -> s.totalLecturas > 0 && s.tieneNovedad())
                .sorted((a, b) -> Double.compare(b.getPorcentajeFuera(), a.getPorcentajeFuera()))
                .collect(java.util.stream.Collectors.toList());

        List<VariableEstadisticaReporte> normales = stats.stream()
                .filter(s -> s.totalLecturas > 0 && !s.tieneNovedad())
                .sorted((a, b) -> a.nombre.compareToIgnoreCase(b.nombre))
                .collect(java.util.stream.Collectors.toList());

        List<VariableEstadisticaReporte> sinLecturas = stats.stream()
                .filter(s -> s.totalLecturas == 0)
                .collect(java.util.stream.Collectors.toList());

        // 4. Obtener destinatarios
        String destinatarios = obtenerReceptoresPlcConfigurados();
        if (destinatarios == null || destinatarios.trim().isEmpty()) {
            destinatarios = "Notificacionesbgreennet@bgreen.com.co";
        }

        // 5. Construir HTML del correo
        String html = construirHtmlReporteDiario(inicio, fin, rows.size(), stats.size(), conNovedad, normales, sinLecturas);

        String subject = (conNovedad.size() > 0)
                ? "⚠️ [REPORTE SCADA 6:00 AM] BGREEN: " + conNovedad.size() + " Variable(s) Fuera de Rango (" + inicio.format(dtfSoloFecha) + " - " + fin.format(dtfSoloFecha) + ")"
                : "✅ [REPORTE SCADA 6:00 AM] BGREEN: Operación Normal de Variables (" + inicio.format(dtfSoloFecha) + " - " + fin.format(dtfSoloFecha) + ")";

        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("Notificacionesbgreennet@bgreen.com.co");
            helper.setTo(destinatarios.split(","));
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            System.out.println("[ReporteScada6AM] ✅ Correo enviado exitosamente a: " + destinatarios);

            return Map.of(
                    "success", true,
                    "message", "Reporte diario de 24 horas enviado exitosamente.",
                    "inicio", inicio.format(dtfDisplay),
                    "fin", fin.format(dtfDisplay),
                    "totalLecturas", rows.size(),
                    "totalVariablesMonitoreadas", stats.size(),
                    "variablesFueraDeRango", conNovedad.size(),
                    "variablesNormales", normales.size(),
                    "destinatarios", destinatarios
            );
        } catch (Exception e) {
            System.err.println("[ReporteScada6AM] ❌ Error enviando correo: " + e.getMessage());
            e.printStackTrace();
            return Map.of(
                    "success", false,
                    "error", "Error enviando correo: " + e.getMessage()
            );
        }
    }

    private String construirHtmlReporteDiario(
            java.time.LocalDateTime inicio,
            java.time.LocalDateTime fin,
            int totalLecturas,
            int totalVariables,
            List<VariableEstadisticaReporte> conNovedad,
            List<VariableEstadisticaReporte> normales,
            List<VariableEstadisticaReporte> sinLecturas) {

        java.time.format.DateTimeFormatter dtf = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy hh:mm a");
        java.text.DecimalFormat df = new java.text.DecimalFormat("#,##0.00");

        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        sb.append("<style>");
        sb.append("body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }");
        sb.append(".container { max-width: 820px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }");
        sb.append(".header { background: linear-gradient(135deg, #15803d 0%, #065f46 100%); color: #ffffff; padding: 24px 28px; text-align: left; }");
        sb.append(".header-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }");
        sb.append(".header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }");
        sb.append(".header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }");
        sb.append(".content { padding: 24px 28px; }");
        sb.append(".kpi-grid { display: table; width: 100%; margin-bottom: 24px; border-spacing: 8px; border-collapse: separate; }");
        sb.append(".kpi-cell { display: table-cell; width: 25%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; vertical-align: middle; }");
        sb.append(".kpi-num { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }");
        sb.append(".kpi-lbl { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }");
        sb.append(".kpi-alert { background: #fef2f2; border-color: #fecaca; }");
        sb.append(".kpi-alert .kpi-num { color: #dc2626; }");
        sb.append(".kpi-ok { background: #f0fdf4; border-color: #bbf7d0; }");
        sb.append(".kpi-ok .kpi-num { color: #16a34a; }");
        sb.append(".alert-banner { background: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #d97706; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; color: #92400e; }");
        sb.append(".ok-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 5px solid #16a34a; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; color: #166534; }");
        sb.append(".section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 10px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }");
        sb.append(".table-custom { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }");
        sb.append(".table-custom th { background: #f8fafc; color: #475569; font-weight: 700; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; }");
        sb.append(".table-custom td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }");
        sb.append(".tag-badge { background: #0f172a; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-family: monospace; font-size: 11px; font-weight: bold; }");
        sb.append(".badge-red { background: #dc2626; color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }");
        sb.append(".badge-orange { background: #d97706; color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }");
        sb.append(".badge-green { background: #16a34a; color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }");
        sb.append(".footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 11px; color: #64748b; }");
        sb.append("</style></head><body>");

        sb.append("<div class='container'>");

        // Header
        sb.append("<div class='header'>");
        sb.append("<div class='header-badge'>Control de Operación & Planta · SCADA / PLC</div>");
        sb.append("<h1>Reporte Diario de Variables y Operación de Planta</h1>");
        sb.append("<p>Ciclo Operativo: <strong>").append(inicio.format(dtf)).append("</strong> hasta <strong>").append(fin.format(dtf)).append("</strong> (24 horas)</p>");
        sb.append("</div>");

        // Content
        sb.append("<div class='content'>");

        // KPIs
        sb.append("<div class='kpi-grid'>");
        sb.append("<div class='kpi-cell'><div class='kpi-num'>").append(totalVariables).append("</div><div class='kpi-lbl'>Variables Configuradas</div></div>");
        
        if (!conNovedad.isEmpty()) {
            sb.append("<div class='kpi-cell kpi-alert'><div class='kpi-num'>").append(conNovedad.size()).append("</div><div class='kpi-lbl'>Fuera de Límites</div></div>");
        } else {
            sb.append("<div class='kpi-cell kpi-ok'><div class='kpi-num'>0</div><div class='kpi-lbl'>Fuera de Límites</div></div>");
        }

        sb.append("<div class='kpi-cell kpi-ok'><div class='kpi-num'>").append(normales.size()).append("</div><div class='kpi-lbl'>100% en Meta</div></div>");
        sb.append("<div class='kpi-cell'><div class='kpi-num'>").append(totalLecturas).append("</div><div class='kpi-lbl'>Registros PLC Analizados</div></div>");
        sb.append("</div>");

        // Banner
        if (!conNovedad.isEmpty()) {
            sb.append("<div class='alert-banner'>");
            sb.append("<strong>⚠️ Novedad Operativa Detectada:</strong> Durante la ventana de 24 horas finalizada a las 05:59 AM, se registraron <strong>")
              .append(conNovedad.size()).append(" variable(s)</strong> con excursiones fuera de los límites operacionales.");
            sb.append("</div>");

            // Tabla con Novedad
            sb.append("<div class='section-title' style='color: #dc2626;'>🚨 Variables con Desviación de Meta</div>");
            sb.append("<table class='table-custom'>");
            sb.append("<thead><tr>");
            sb.append("<th>Tag</th>");
            sb.append("<th>Nombre / Proceso</th>");
            sb.append("<th>Límites Meta</th>");
            sb.append("<th style='text-align: right;'>Mínimo</th>");
            sb.append("<th style='text-align: right;'>Máximo</th>");
            sb.append("<th style='text-align: right;'>Promedio</th>");
            sb.append("<th style='text-align: center;'>Lecturas Fuera</th>");
            sb.append("<th style='text-align: center;'>% Fuera</th>");
            sb.append("</tr></thead><tbody>");

            for (VariableEstadisticaReporte v : conNovedad) {
                String metaStr = (v.metaMin != null ? df.format(v.metaMin) : "-") + " a " + (v.metaMax != null ? df.format(v.metaMax) : "-") + " " + v.unidadMedida;
                String badgeClass = v.getPorcentajeFuera() >= 20.0 ? "badge-red" : "badge-orange";

                sb.append("<tr>");
                sb.append("<td><span class='tag-badge'>").append(v.tag).append("</span></td>");
                sb.append("<td><strong>").append(v.nombre).append("</strong><br><small style='color: #64748b;'>").append(v.unidadProceso).append("</small></td>");
                sb.append("<td style='color: #475569;'>").append(metaStr).append("</td>");
                sb.append("<td style='text-align: right; color: ").append(v.porDebajoMin > 0 ? "#dc2626; font-weight: bold;" : "#1e293b;").append("'>").append(df.format(v.minRegistrado)).append("</td>");
                sb.append("<td style='text-align: right; color: ").append(v.porEncimaMax > 0 ? "#dc2626; font-weight: bold;" : "#1e293b;").append("'>").append(df.format(v.maxRegistrado)).append("</td>");
                sb.append("<td style='text-align: right; font-weight: 600;'>").append(df.format(v.getPromedio())).append(" ").append(v.unidadMedida).append("</td>");
                sb.append("<td style='text-align: center; color: #dc2626; font-weight: bold;'>").append(v.lecturasFueraDeRango).append(" / ").append(v.totalLecturas).append("</td>");
                sb.append("<td style='text-align: center;'><span class='").append(badgeClass).append("'>").append(df.format(v.getPorcentajeFuera())).append("%</span></td>");
                sb.append("</tr>");
            }
            sb.append("</tbody></table>");
        } else {
            sb.append("<div class='ok-banner'>");
            sb.append("<strong>✅ Operación Estable y Conforme:</strong> Todas las variables monitoreadas se mantuvieron dentro de sus rangos y metas operativas durante la ventana completa de 24 horas.");
            sb.append("</div>");
        }

        // Tabla Variables Normales
        if (!normales.isEmpty()) {
            sb.append("<div class='section-title' style='color: #166534;'>✅ Variables con Cumplimiento 100% en Meta</div>");
            sb.append("<table class='table-custom'>");
            sb.append("<thead><tr>");
            sb.append("<th>Tag</th>");
            sb.append("<th>Nombre / Proceso</th>");
            sb.append("<th>Límites Meta</th>");
            sb.append("<th style='text-align: right;'>Mínimo</th>");
            sb.append("<th style='text-align: right;'>Máximo</th>");
            sb.append("<th style='text-align: right;'>Promedio</th>");
            sb.append("<th style='text-align: center;'>Cumplimiento</th>");
            sb.append("</tr></thead><tbody>");

            int maxToShow = 25;
            int count = 0;
            for (VariableEstadisticaReporte v : normales) {
                if (count++ >= maxToShow) break;
                String metaStr = (v.metaMin != null ? df.format(v.metaMin) : "-") + " a " + (v.metaMax != null ? df.format(v.metaMax) : "-") + " " + v.unidadMedida;

                sb.append("<tr>");
                sb.append("<td><span class='tag-badge'>").append(v.tag).append("</span></td>");
                sb.append("<td>").append(v.nombre).append(" <small style='color: #64748b;'>(").append(v.unidadProceso).append(")</small></td>");
                sb.append("<td style='color: #475569;'>").append(metaStr).append("</td>");
                sb.append("<td style='text-align: right;'>").append(df.format(v.minRegistrado)).append("</td>");
                sb.append("<td style='text-align: right;'>").append(df.format(v.maxRegistrado)).append("</td>");
                sb.append("<td style='text-align: right; font-weight: 600;'>").append(df.format(v.getPromedio())).append(" ").append(v.unidadMedida).append("</td>");
                sb.append("<td style='text-align: center;'><span class='badge-green'>100% OK</span></td>");
                sb.append("</tr>");
            }
            if (normales.size() > maxToShow) {
                sb.append("<tr><td colspan='7' style='text-align: center; color: #64748b; font-style: italic;'>... y ").append(normales.size() - maxToShow).append(" variables adicionales dentro de rango.</td></tr>");
            }
            sb.append("</tbody></table>");
        }

        sb.append("</div>"); // /content

        // Footer
        sb.append("<div class='footer'>");
        sb.append("<p style='margin: 0;'>Reporte emitido automáticamente a las 06:00 AM desde la plataforma <strong>BgreenNet</strong>.</p>");
        sb.append("<p style='margin: 4px 0 0; color: #94a3b8;'>Para modificar destinatarios o metas, ingresa a BgreenNet > Configuración > Variables y Parámetros (/configuracion/variables-plc).</p>");
        sb.append("</div>");

        sb.append("</div></body></html>");

        return sb.toString();
    }

}
