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
                      "WHERE [timestamp] >= ? AND [timestamp] < DATEADD(day, 1, CAST(? AS DATETIME)) " +
                      "ORDER BY [timestamp] ASC";
                return plcJdbcTemplate.queryForList(sql, fecha + " 00:00:00", fecha + " 00:00:00");
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
}

