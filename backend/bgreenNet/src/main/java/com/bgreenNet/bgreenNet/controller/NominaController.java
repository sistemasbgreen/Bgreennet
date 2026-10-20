package com.bgreenNet.bgreenNet.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Collections;
import java.util.TreeMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/nomina", "/nomina"})
@CrossOrigin(origins = "*")
public class NominaController {

    // =========================================================================
    // CONFIGURACIÓN DE CORREOS PARA REPORTES DE LLEGADAS TARDE (MIGRADO DE .NET)
    // =========================================================================

    // Correo del jefe que recibe el reporte de cada grupo
    public static final Map<String, String> CORREO_POR_GRUPO = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
    static {
        CORREO_POR_GRUPO.put("CONTABILIDAD", "jefecontabilidad@bgreen.com.co");
        CORREO_POR_GRUPO.put("GESTION HUMANA Y ADMINISTRATIVO", "jefegestionhumana@bgreen.com.co");
        CORREO_POR_GRUPO.put("TESORERIA", "jefetesoreria@bgreen.com.co");
        CORREO_POR_GRUPO.put("SISTEMAS", "jefetic@bgreen.com.co");
        CORREO_POR_GRUPO.put("PLANEACION FINANCIERA", "jefeplaneacionfinanciera@bgreen.com.co");

        CORREO_POR_GRUPO.put("ABASTECIMIENTO", "jefeabastecimiento@bgreen.com.co");
        CORREO_POR_GRUPO.put("COMERCIAL", "directorcomercial@bgreen.com.co");
        CORREO_POR_GRUPO.put("Almacén", "jefecomexeinventarios@bgreen.com.co");
        CORREO_POR_GRUPO.put("COMEX", "jefecomexeinventarios@bgreen.com.co");
        CORREO_POR_GRUPO.put("Logística", "jefelogistica@bgreen.com.co");

        CORREO_POR_GRUPO.put("MEJORAMIENTO CONTINUO", "directorsig@bgreen.com.co");
        CORREO_POR_GRUPO.put("GESTION DOCUMENTAL", "correo@empresa.com");
        CORREO_POR_GRUPO.put("SIG", "jefehseq@bgreen.com.co");
        CORREO_POR_GRUPO.put("LABORATORIO", "jefecontrolcalidad@bgreen.com.co");
        CORREO_POR_GRUPO.put("PRODUCCION", "jefeoperacionproduccion@bgreen.com.co");

        CORREO_POR_GRUPO.put("COORDINADORES", "jefeoperacionproduccion@bgreen.com.co");
        CORREO_POR_GRUPO.put("OPERACIÓN", "jefeoperacionproduccion@bgreen.com.co");
        CORREO_POR_GRUPO.put("PLANEACIÓN Y MEJORAS", "jefeplaneacionproduccion@bgreen.com.co");

        CORREO_POR_GRUPO.put("MANTENIMIENTO", "jefemantenimiento@bgreen.com.co");
        CORREO_POR_GRUPO.put("MTTO ELECTRICOS", "coordinadormttoelectrico@bgreen.com.co");
        CORREO_POR_GRUPO.put("MTTO MECANICOS", "coordinadormttomecanico@bgreen.com.co");
        CORREO_POR_GRUPO.put("MTTO SERVICIOS INDUSTRIALES", "jefemantenimiento@bgreen.com.co");

        CORREO_POR_GRUPO.put("FLOTA PROPIA", "directoroperaciones@olc.com.co");
        CORREO_POR_GRUPO.put("TRAFICO Y SEGURIDAD", "directoroperaciones@olc.com.co");
    }

    // Directivos que reciben un consolidado de varios grupos
    public static final Map<String, List<String>> GRUPOS_POR_CORREO_DIRECTIVO = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
    static {
        GRUPOS_POR_CORREO_DIRECTIVO.put("jefegestionhumana@bgreen.com.co", List.of("GERENCIA", "PRESIDENCIA", "JURIDICA", "CONTROL INTERNO"));
        GRUPOS_POR_CORREO_DIRECTIVO.put("directorfinanciero@bgreen.com.co", List.of("CONTABILIDAD", "GESTION HUMANA Y ADMINISTRATIVO", "TESORERIA", "SISTEMAS", "PLANEACION FINANCIERA"));
        GRUPOS_POR_CORREO_DIRECTIVO.put("directorcomercial@bgreen.com.co", List.of("ABASTECIMIENTO", "COMERCIAL", "Almacén", "COMEX", "Logística"));
        GRUPOS_POR_CORREO_DIRECTIVO.put("directorsig@bgreen.com.co", List.of("MEJORAMIENTO CONTINUO", "GESTION DOCUMENTAL", "SIG", "LABORATORIO"));
        GRUPOS_POR_CORREO_DIRECTIVO.put("directorplanta@bgreen.com.co", List.of("PRODUCCIÓN", "COORDINADORES", "OPERACIÓN", "PLANEACIÓN Y MEJORAS", "MANTENIMIENTO", "MTTO ELECTRICOS", "MTTO MECANICOS", "MTTO SERVICIOS INDUSTRIALES"));
    }

    // Destinatarios del REPORTE GENERAL
    public static final List<String> CORREOS_GENERALES = List.of(
        "asistentetic@bgreen.com.co",
        "jefegestionhumana@bgreen.com.co",
        "analistagestionhumana@bgreen.com.co"
    );

    // Destinatarios del REPORTE GENERAL 2 (sin memorandos ni columna de memorandos)
    public static final List<String> CORREOS_GENERALES_2 = List.of(
        "directorfinanciero@bgreen.com.co"
    );

    // PRSNIDENTIFICATION que se excluyen de todas las consultas
    public static final Set<String> IDS_EXCLUIDOS = Set.of(
        "380", "421", "404", "638", "374", "708", "717"
    );

    @Autowired
    @Qualifier("primaryJdbcTemplate")
    private JdbcTemplate primaryJdbcTemplate;

    @Autowired(required = false)
    @Qualifier("siesaAccessJdbcTemplate")
    private JdbcTemplate siesaAccessJdbcTemplate;

    @Autowired(required = false)
    @Qualifier("siesaJdbcTemplate")
    private JdbcTemplate siesaJdbcTemplate;

    private JdbcTemplate getSiesaAccessTemplate() {
        if (siesaAccessJdbcTemplate != null) {
            return siesaAccessJdbcTemplate;
        }
        return primaryJdbcTemplate;
    }

    private String adaptarSql(String sql, JdbcTemplate template) {
        if (template == siesaAccessJdbcTemplate && sql != null) {
            return sql.replace("[siesaaccess_biocosta].[dbo].", "[dbo].");
        }
        return sql;
    }

    @Autowired(required = false)
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:notificacionesbgreennet@bgreen.com.co}")
    private String mailFrom;

    /**
     * Endpoint de diagnóstico para verificar conexión y existencia de las vistas
     * GET /api/nomina/test
     */
    @GetMapping("/test")
    public ResponseEntity<?> testConexiones() {
        Map<String, Object> diagnostico = new HashMap<>();

        // 0. Probar en base SIESA ACCESS (Biométrico)
        if (siesaAccessJdbcTemplate != null) {
            Map<String, Object> infoAccess = new HashMap<>();
            try {
                infoAccess.put("dbActual", siesaAccessJdbcTemplate.queryForObject("SELECT DB_NAME()", String.class));
                infoAccess.put("usuario", siesaAccessJdbcTemplate.queryForObject("SELECT SYSTEM_USER", String.class));
                try {
                    Integer c1 = siesaAccessJdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM [siesaaccess_biocosta].[dbo].[View_InterruptionsScheduling]", Integer.class);
                    infoAccess.put("View_InterruptionsScheduling_count", c1);
                    infoAccess.put("ok_interrupciones", true);
                } catch (Exception e1) {
                    infoAccess.put("ok_interrupciones", false);
                    infoAccess.put("error_interrupciones", e1.getMessage());
                }

                try {
                    Integer c2 = siesaAccessJdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM [siesaaccess_biocosta].[dbo].[View_Liquidation]", Integer.class);
                    infoAccess.put("View_Liquidation_count", c2);
                    infoAccess.put("ok_liquidacion", true);
                } catch (Exception e2) {
                    infoAccess.put("ok_liquidacion", false);
                    infoAccess.put("error_liquidacion", e2.getMessage());
                }
            } catch (Exception e) {
                infoAccess.put("errorConexion", e.getMessage());
            }
            diagnostico.put("siesaAccessDataSource", infoAccess);
        }

        // 1. Probar en base primaria
        Map<String, Object> infoPrimaria = new HashMap<>();
        try {
            infoPrimaria.put("dbActual", primaryJdbcTemplate.queryForObject("SELECT DB_NAME()", String.class));
            infoPrimaria.put("usuario", primaryJdbcTemplate.queryForObject("SELECT SYSTEM_USER", String.class));
            try {
                Integer c1 = primaryJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM [siesaaccess_biocosta].[dbo].[View_InterruptionsScheduling]", Integer.class);
                infoPrimaria.put("View_InterruptionsScheduling_count", c1);
                infoPrimaria.put("ok_interrupciones", true);
            } catch (Exception e1) {
                infoPrimaria.put("ok_interrupciones", false);
                infoPrimaria.put("error_interrupciones", e1.getMessage());
            }

            try {
                Integer c2 = primaryJdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM [siesaaccess_biocosta].[dbo].[View_Liquidation]", Integer.class);
                infoPrimaria.put("View_Liquidation_count", c2);
                infoPrimaria.put("ok_liquidacion", true);
            } catch (Exception e2) {
                infoPrimaria.put("ok_liquidacion", false);
                infoPrimaria.put("error_liquidacion", e2.getMessage());
            }
        } catch (Exception e) {
            infoPrimaria.put("errorConexion", e.getMessage());
        }
        diagnostico.put("primaryDataSource", infoPrimaria);

        // 2. Probar en base SIESA (si está configurada)
        if (siesaJdbcTemplate != null) {
            Map<String, Object> infoSiesa = new HashMap<>();
            try {
                infoSiesa.put("dbActual", siesaJdbcTemplate.queryForObject("SELECT DB_NAME()", String.class));
                infoSiesa.put("usuario", siesaJdbcTemplate.queryForObject("SELECT SYSTEM_USER", String.class));
                try {
                    Integer c1 = siesaJdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM [siesaaccess_biocosta].[dbo].[View_InterruptionsScheduling]", Integer.class);
                    infoSiesa.put("View_InterruptionsScheduling_count", c1);
                    infoSiesa.put("ok_interrupciones", true);
                } catch (Exception e1) {
                    infoSiesa.put("ok_interrupciones", false);
                    infoSiesa.put("error_interrupciones", e1.getMessage());
                }

                try {
                    Integer c2 = siesaJdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM [siesaaccess_biocosta].[dbo].[View_Liquidation]", Integer.class);
                    infoSiesa.put("View_Liquidation_count", c2);
                    infoSiesa.put("ok_liquidacion", true);
                } catch (Exception e2) {
                    infoSiesa.put("ok_liquidacion", false);
                    infoSiesa.put("error_liquidacion", e2.getMessage());
                }
            } catch (Exception e) {
                infoSiesa.put("errorConexion", e.getMessage());
            }
            diagnostico.put("siesaDataSource", infoSiesa);
        }

        return ResponseEntity.ok(diagnostico);
    }

    /**
     * Consulta la vista [siesaaccess_biocosta].[dbo].[View_InterruptionsScheduling]
     * Sin TOP obligatorio, filtra por rango de fechas
     */
    @GetMapping("/interrupciones")
    public ResponseEntity<?> getInterrupciones(
            @RequestParam(value = "fechaInicio", required = false) String fechaInicio,
            @RequestParam(value = "fechaFin", required = false) String fechaFin,
            @RequestParam(value = "busqueda", required = false) String busqueda,
            @RequestParam(value = "area", required = false) String area,
            @RequestParam(value = "grupo", required = false) String grupo,
            @RequestParam(value = "tipoInterrupcion", required = false) String tipoInterrupcion,
            @RequestParam(value = "empresa", required = false) String empresa,
            @RequestParam(value = "isAdditionalHour", required = false) String isAdditionalHour,
            @RequestParam(value = "limite", required = false) Integer limite
    ) {
        StringBuilder sql = new StringBuilder();
        if (limite != null && limite > 0) {
            sql.append("SELECT TOP ").append(limite).append(" ");
        } else {
            sql.append("SELECT ");
        }
        sql.append(" [PersonId], [InterruptionId], [PositionDescription], [AreaName], [GroupId], [GroupName], ");
        sql.append(" [FirstName], [MiddleName], [LastName], [Surname], [DocumentNumber], [CardNumber], [EmployeeTypeId], ");
        sql.append(" [Date], [EndDate], [DifferenceInHours], [InterruptionName], [InterruptionAlias], [CompanyName], ");
        sql.append(" [IsAdditionalHour], [InterruptionTypeId], [DefaultTime], [CreatedDate], [CreatedBy], ");
        sql.append(" [UserLogin], [UserFirstName], [UserLastName], [Observations] ");
        sql.append(" FROM [siesaaccess_biocosta].[dbo].[View_InterruptionsScheduling] ");
        sql.append(" WHERE 1=1 ");

        List<Object> params = new ArrayList<>();

        if (fechaInicio != null && !fechaInicio.trim().isEmpty()) {
            String fIni = extraerFecha(fechaInicio);
            if (!fIni.isEmpty()) {
                sql.append(" AND [Date] >= ? ");
                params.add(fIni);
            }
        }

        if (fechaFin != null && !fechaFin.trim().isEmpty()) {
            String fSiguiente = calcularFechaSiguiente(fechaFin);
            if (!fSiguiente.isEmpty()) {
                sql.append(" AND [Date] < ? ");
                params.add(fSiguiente);
            } else {
                sql.append(" AND [Date] <= ? ");
                params.add(extraerFecha(fechaFin));
            }
        }

        if (busqueda != null && !busqueda.trim().isEmpty()) {
            String q = "%" + busqueda.trim() + "%";
            sql.append(" AND ([DocumentNumber] LIKE ? OR [FirstName] LIKE ? OR [LastName] LIKE ? OR [PositionDescription] LIKE ? OR [CardNumber] LIKE ?) ");
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        if (area != null && !area.trim().isEmpty() && !area.equalsIgnoreCase("TODAS")) {
            sql.append(" AND [AreaName] = ? ");
            params.add(area.trim());
        }

        if (grupo != null && !grupo.trim().isEmpty() && !grupo.equalsIgnoreCase("TODOS")) {
            sql.append(" AND [GroupName] = ? ");
            params.add(grupo.trim());
        }

        if (tipoInterrupcion != null && !tipoInterrupcion.trim().isEmpty() && !tipoInterrupcion.equalsIgnoreCase("TODOS")) {
            sql.append(" AND [InterruptionName] = ? ");
            params.add(tipoInterrupcion.trim());
        }

        if (empresa != null && !empresa.trim().isEmpty() && !empresa.equalsIgnoreCase("TODAS")) {
            sql.append(" AND [CompanyName] = ? ");
            params.add(empresa.trim());
        }

        if (isAdditionalHour != null && !isAdditionalHour.trim().isEmpty()) {
            if (isAdditionalHour.equalsIgnoreCase("true") || isAdditionalHour.equals("1")) {
                sql.append(" AND [IsAdditionalHour] = 1 ");
            }
        }

        sql.append(" ORDER BY [Date] DESC ");

        // Intentar primero con siesaAccessJdbcTemplate
        JdbcTemplate template = getSiesaAccessTemplate();
        try {
            List<Map<String, Object>> resultados = template.queryForList(adaptarSql(sql.toString(), template), params.toArray());
            return ResponseEntity.ok(resultados);
        } catch (Exception eAccess) {
            System.err.println("⚠️ Intento en siesaAccess falló: " + eAccess.getMessage());

            if (primaryJdbcTemplate != null && template != primaryJdbcTemplate) {
                try {
                    List<Map<String, Object>> resultadosPrimaria = primaryJdbcTemplate.queryForList(sql.toString(), params.toArray());
                    System.out.println("✅ Consulta exitosa en primaryDataSource");
                    return ResponseEntity.ok(resultadosPrimaria);
                } catch (Exception ePri) {
                    System.err.println("❌ Falló también en primaryDataSource: " + ePri.getMessage());
                }
            }

            eAccess.printStackTrace();
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("error", eAccess.getMessage());
            errorBody.put("tipo", eAccess.getClass().getSimpleName());
            errorBody.put("sqlGenerado", sql.toString());
            return ResponseEntity.status(500).body(errorBody);
        }
    }

    /**
     * Consulta la vista [siesaaccess_biocosta].[dbo].[View_Liquidation]
     * Sin TOP obligatorio, filtra por rango de fechas
     */
    @GetMapping("/liquidacion")
    public ResponseEntity<?> getLiquidacion(
            @RequestParam(value = "fechaInicio", required = false) String fechaInicio,
            @RequestParam(value = "fechaFin", required = false) String fechaFin,
            @RequestParam(value = "busqueda", required = false) String busqueda,
            @RequestParam(value = "hourtype", required = false) String hourtype,
            @RequestParam(value = "workshiftName", required = false) String workshiftName,
            @RequestParam(value = "groupName", required = false) String groupName,
            @RequestParam(value = "limite", required = false) Integer limite
    ) {
        StringBuilder sql = new StringBuilder();
        if (limite != null && limite > 0) {
            sql.append("SELECT TOP ").append(limite).append(" ");
        } else {
            sql.append("SELECT ");
        }
        sql.append(" [PersonId], [FirstName], [MiddleName], [LastName], [Surname], [DocumentNumber], [CardNumber], ");
        sql.append(" [Date], [Hourtype], [Hours], [Minutes], [WorkshiftName], ");
        sql.append(" [FirstArrival], [SecondArrival], [FirstDeparture], [SecondDeparture], ");
        sql.append(" [DailyWorkingHours], [GroupId], [GroupName], [InterruptionName], ");
        sql.append(" [StartDateInterruption], [EndDateInterruption], [TotalInterruptionTime], [PayrollNovelties] ");
        sql.append(" FROM [siesaaccess_biocosta].[dbo].[View_Liquidation] ");
        sql.append(" WHERE 1=1 ");

        List<Object> params = new ArrayList<>();

        if (fechaInicio != null && !fechaInicio.trim().isEmpty()) {
            String fIni = extraerFecha(fechaInicio);
            if (!fIni.isEmpty()) {
                sql.append(" AND [Date] >= ? ");
                params.add(fIni);
            }
        }

        if (fechaFin != null && !fechaFin.trim().isEmpty()) {
            String fSiguiente = calcularFechaSiguiente(fechaFin);
            if (!fSiguiente.isEmpty()) {
                sql.append(" AND [Date] < ? ");
                params.add(fSiguiente);
            } else {
                sql.append(" AND [Date] <= ? ");
                params.add(extraerFecha(fechaFin));
            }
        }

        if (busqueda != null && !busqueda.trim().isEmpty()) {
            String q = "%" + busqueda.trim() + "%";
            sql.append(" AND ([DocumentNumber] LIKE ? OR [FirstName] LIKE ? OR [LastName] LIKE ? OR [WorkshiftName] LIKE ? OR [CardNumber] LIKE ? OR [PayrollNovelties] LIKE ?) ");
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
            params.add(q);
        }

        if (hourtype != null && !hourtype.trim().isEmpty() && !hourtype.equalsIgnoreCase("TODOS")) {
            sql.append(" AND [Hourtype] = ? ");
            params.add(hourtype.trim());
        }

        if (workshiftName != null && !workshiftName.trim().isEmpty() && !workshiftName.equalsIgnoreCase("TODOS")) {
            sql.append(" AND [WorkshiftName] = ? ");
            params.add(workshiftName.trim());
        }

        if (groupName != null && !groupName.trim().isEmpty() && !groupName.equalsIgnoreCase("TODOS")) {
            sql.append(" AND [GroupName] = ? ");
            params.add(groupName.trim());
        }

        sql.append(" ORDER BY [Date] DESC ");

        // Intentar primero con siesaAccessJdbcTemplate
        JdbcTemplate template = getSiesaAccessTemplate();
        try {
            List<Map<String, Object>> resultados = template.queryForList(adaptarSql(sql.toString(), template), params.toArray());
            return ResponseEntity.ok(resultados);
        } catch (Exception eAccess) {
            System.err.println("⚠️ Intento en siesaAccess falló: " + eAccess.getMessage());

            if (primaryJdbcTemplate != null && template != primaryJdbcTemplate) {
                try {
                    List<Map<String, Object>> resultadosPrimaria = primaryJdbcTemplate.queryForList(sql.toString(), params.toArray());
                    System.out.println("✅ Consulta exitosa en primaryDataSource");
                    return ResponseEntity.ok(resultadosPrimaria);
                } catch (Exception ePri) {
                    System.err.println("❌ Falló también en primaryDataSource: " + ePri.getMessage());
                }
            }

            eAccess.printStackTrace();
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("error", eAccess.getMessage());
            errorBody.put("tipo", eAccess.getClass().getSimpleName());
            errorBody.put("sqlGenerado", sql.toString());
            return ResponseEntity.status(500).body(errorBody);
        }
    }

    /**
     * Endpoint de Llegadas Tarde, Salidas Tarde, Omisiones (No Marcó) y Marcaciones Inválidas
     * Extraído y unificado directamente de la lógica de InformeTurno (.NET)
     * GET /api/nomina/llegadas-tarde
     */
    @GetMapping("/llegadas-tarde")
    public ResponseEntity<?> getLlegadasTarde(
            @RequestParam(value = "fechaInicio", required = false) String fechaInicio,
            @RequestParam(value = "fechaFin", required = false) String fechaFin,
            @RequestParam(value = "grupo", required = false) String grupo,
            @RequestParam(value = "busqueda", required = false) String busqueda
    ) {
        try {
            // Rango por defecto: última semana (7 días atrás hasta hoy)
            String fFin = (fechaFin != null && !fechaFin.trim().isEmpty()) ? extraerFecha(fechaFin) : java.time.LocalDate.now().toString();
            String fIni = (fechaInicio != null && !fechaInicio.trim().isEmpty()) ? extraerFecha(fechaInicio) : java.time.LocalDate.parse(fFin).minusDays(7).toString();
            String fSiguiente = calcularFechaSiguiente(fFin);

            // 1. Consulta de Eventos (Válidos + Inválidos)
            String sqlEventos = """
                SET DATEFIRST 1;
                WITH Eventos AS
                (
                    SELECT
                        a.[EVENIDENTIFICATION]      AS Identificacion_evento,
                        a.[PRSNIDENTIFICATION],
                        a.[GROUPIDENTIFICATION],
                        a.[AREAIDENTIFICATION],
                        a.[TYEVIDENTIFICATION]      AS TIPO_EVENTO,
                        CASE WHEN a.[TYEVIDENTIFICATION] = 1 THEN 'ENTRADA' ELSE 'SALIDA' END AS EVENTO,
                        a.[EVENDATERECORD]          AS Fecha_hora,
                        CAST(NULL AS NVARCHAR(500)) AS Motivo_invalidez,
                        b.[PRSNIDENTIFICATIONOWN]   AS Documento,
                        CONCAT(b.[PRSNFIRSTNAME], ' ', b.[PRSNFIRSTNAME1], ' ', b.[PRSNLASTNAME], ' ', b.[PRSNLASTNAME1]) AS Nombre
                    FROM [siesaaccess_biocosta].[dbo].[CIOEVENT] AS a
                    LEFT JOIN [siesaaccess_biocosta].[dbo].[ENRPERSON] AS b ON a.[PRSNIDENTIFICATION] = b.[PRSNIDENTIFICATION]
                    WHERE a.[EVENDATERECORD] >= ? AND a.[EVENDATERECORD] < ?

                    UNION ALL

                    SELECT
                        a.[VNNVIDENTIFICATION]      AS Identificacion_evento,
                        a.[PRSNIDENTIFICATION],
                        a.[GROUPIDENTIFICATION],
                        a.[AREAIDENTIFICATION],
                        3                            AS TIPO_EVENTO,
                        'INVÁLIDO'                  AS EVENTO,
                        a.[VNNVDATERECORD]          AS Fecha_hora,
                        a.[VNNVOBSERVATION]         AS Motivo_invalidez,
                        b.[PRSNIDENTIFICATIONOWN]   AS Documento,
                        CONCAT(b.[PRSNFIRSTNAME], ' ', b.[PRSNFIRSTNAME1], ' ', b.[PRSNLASTNAME], ' ', b.[PRSNLASTNAME1]) AS Nombre
                    FROM [siesaaccess_biocosta].[dbo].[CIOEVENTINVALID] AS a
                    LEFT JOIN [siesaaccess_biocosta].[dbo].[ENRPERSON] AS b ON a.[PRSNIDENTIFICATION] = b.[PRSNIDENTIFICATION]
                    WHERE a.[VNNVDATERECORD] >= ? AND a.[VNNVDATERECORD] < ?
                )
                SELECT
                    e.Identificacion_evento,
                    e.PRSNIDENTIFICATION             AS ID_PERSONA,
                    e.TIPO_EVENTO,
                    e.EVENTO,
                    e.Documento                      AS DOCUMENTO,
                    e.Nombre                         AS NOMBRE,
                    CONVERT(VARCHAR(10), CAST(e.Fecha_hora AS DATE), 120) AS FECHA,
                    CONVERT(VARCHAR(8), CAST(e.Fecha_hora AS TIME), 108)  AS HORA,
                    e.Motivo_invalidez               AS MOTIVO_INVALIDEZ,
                    c.GROUPNAME                      AS GRUPO,
                    d.AREANAME                       AS AREA,
                    g.TRFXNAME                       AS TURNO,
                    CONVERT(VARCHAR(8), CAST(h.TRFXINPUT1 AS TIME), 108)  AS INICIO,
                    CONVERT(VARCHAR(8), CAST(h.TRFXOUTPUT2 AS TIME), 108) AS FINALIZACION
                FROM Eventos AS e
                LEFT JOIN [siesaaccess_biocosta].[dbo].[CNFGROUP] AS c ON e.GROUPIDENTIFICATION = c.GROUPIDENTIFICATION
                LEFT JOIN [siesaaccess_biocosta].[dbo].[CNFAREA]  AS d ON e.AREAIDENTIFICATION  = d.AREAIDENTIFICATION
                LEFT JOIN [siesaaccess_biocosta].[dbo].[CNFPROGRAMATIONTURN] AS f
                    ON e.PRSNIDENTIFICATION = f.PRSNIDENTIFICATION
                   AND CAST(f.PRTRDATEINIT AS DATE) = CAST(e.Fecha_hora AS DATE)
                LEFT JOIN [siesaaccess_biocosta].[dbo].[CNFTURNFIX] AS g ON f.TRFXIDENTIFICATION = g.TRFXIDENTIFICATION
                LEFT JOIN [siesaaccess_biocosta].[dbo].[CNFTURNFIXDAY] AS h
                    ON g.TRFXIDENTIFICATION = h.TRFXIDENTIFICATION
                   AND h.NMDYIDENTIFICATION = (
                        CASE
                            WHEN EXISTS (
                                SELECT 1 FROM [siesaaccess_biocosta].[dbo].[GENDAY] gd
                                WHERE CAST(gd.DAYDATE AS DATE) = CAST(e.Fecha_hora AS DATE)
                            ) THEN 8
                            ELSE DATEPART(WEEKDAY, e.Fecha_hora)
                        END
                   )
                WHERE (e.PRSNIDENTIFICATION IS NULL OR e.PRSNIDENTIFICATION NOT IN ('380', '421', '404', '638', '374', '708', '717'))
                ORDER BY e.Fecha_hora DESC;
            """;

            // 2. Consulta de No Marcaron
            String sqlNoMarcaron = """
                SET DATEFIRST 1;
                SELECT
                    f.PRSNIDENTIFICATION          AS ID_PERSONA,
                    b.PRSNIDENTIFICATIONOWN       AS DOCUMENTO,
                    CONCAT(b.PRSNFIRSTNAME,' ',ISNULL(b.PRSNFIRSTNAME1,''),' ',b.PRSNLASTNAME,' ',ISNULL(b.PRSNLASTNAME1,'')) AS NOMBRE,
                    CONVERT(VARCHAR(10), CAST(f.PRTRDATEINIT AS DATE), 120) AS FECHA_TURNO,
                    g.TRFXNAME                    AS TURNO,
                    c.GROUPNAME                   AS GRUPO,
                    d.AREANAME                    AS CENTRO_COSTO,
                    CONVERT(VARCHAR(8), CAST(h.TRFXINPUT1 AS TIME), 108)  AS INICIO,
                    CONVERT(VARCHAR(8), CAST(h.TRFXOUTPUT2 AS TIME), 108) AS FINALIZACION,
                    (SELECT COUNT(1) FROM [siesaaccess_biocosta].[dbo].[CIOEVENT] ev 
                     WHERE ev.PRSNIDENTIFICATION = f.PRSNIDENTIFICATION
                       AND CAST(ev.EVENDATERECORD AS DATE) = CAST(f.PRTRDATEINIT AS DATE)
                       AND ev.TYEVIDENTIFICATION = 1
                       AND ev.PRSNIDENTIFICATION NOT IN ('380', '421', '404', '638', '374', '708', '717')) AS TIENE_ENTRADA,
                    (SELECT COUNT(1) FROM [siesaaccess_biocosta].[dbo].[CIOEVENT] ev 
                     WHERE ev.PRSNIDENTIFICATION = f.PRSNIDENTIFICATION
                       AND CAST(ev.EVENDATERECORD AS DATE) IN (CAST(f.PRTRDATEINIT AS DATE), DATEADD(day, 1, CAST(f.PRTRDATEINIT AS DATE)))
                       AND ev.TYEVIDENTIFICATION = 2
                       AND ev.PRSNIDENTIFICATION NOT IN ('380', '421', '404', '638', '374', '708', '717')) AS TIENE_SALIDA
                FROM [siesaaccess_biocosta].[dbo].[CNFPROGRAMATIONTURN] AS f
                INNER JOIN [siesaaccess_biocosta].[dbo].[CNFTURNFIX]    AS g ON f.TRFXIDENTIFICATION = g.TRFXIDENTIFICATION
                INNER JOIN [siesaaccess_biocosta].[dbo].[ENRPERSON]     AS b ON f.PRSNIDENTIFICATION = b.PRSNIDENTIFICATION
                INNER JOIN [siesaaccess_biocosta].[dbo].[CNFGROUP]      AS c ON b.GROUPIDENTIFICATION = c.GROUPIDENTIFICATION
                INNER JOIN [siesaaccess_biocosta].[dbo].[CNFAREA]       AS d ON b.AREAIDENTIFICATION  = d.AREAIDENTIFICATION
                LEFT  JOIN [siesaaccess_biocosta].[dbo].[CNFTURNFIXDAY] AS h
                    ON g.TRFXIDENTIFICATION = h.TRFXIDENTIFICATION
                   AND h.NMDYIDENTIFICATION = (
                        SELECT CASE
                            WHEN EXISTS (
                                SELECT 1 FROM [siesaaccess_biocosta].[dbo].[GENDAY] gd
                                WHERE CAST(gd.DAYDATE AS DATE) = CAST(f.PRTRDATEINIT AS DATE)
                            ) THEN 8
                            ELSE DATEPART(WEEKDAY, f.PRTRDATEINIT)
                        END
                   )
                WHERE
                    f.PRTRDATEINIT >= ? AND f.PRTRDATEINIT < ?
                    AND f.PRSNIDENTIFICATION NOT IN ('380', '421', '404', '638', '374', '708', '717')
                    AND h.TRFXINPUT1  IS NOT NULL
                    AND h.TRFXOUTPUT2 IS NOT NULL
                ORDER BY f.PRTRDATEINIT DESC;
            """;

            JdbcTemplate template = getSiesaAccessTemplate();
            List<Map<String, Object>> filasEventos;
            List<Map<String, Object>> filasNoMarcaron;
            try {
                filasEventos = template.queryForList(adaptarSql(sqlEventos, template), fIni, fSiguiente, fIni, fSiguiente);
                filasNoMarcaron = template.queryForList(adaptarSql(sqlNoMarcaron, template), fIni, fSiguiente);
            } catch (Exception eAccess) {
                if (primaryJdbcTemplate != null && template != primaryJdbcTemplate) {
                    filasEventos = primaryJdbcTemplate.queryForList(sqlEventos, fIni, fSiguiente, fIni, fSiguiente);
                    filasNoMarcaron = primaryJdbcTemplate.queryForList(sqlNoMarcaron, fIni, fSiguiente);
                } else {
                    throw eAccess;
                }
            }

            List<Map<String, Object>> llegadasTarde = new ArrayList<>();
            List<Map<String, Object>> salidasTarde = new ArrayList<>();
            List<Map<String, Object>> invalidos = new ArrayList<>();
            List<Map<String, Object>> noMarcaron = new ArrayList<>();

            Set<String> eventosInvalidosVistos = new HashSet<>();

            // Procesar Eventos
            for (Map<String, Object> row : filasEventos) {
                int tipoEvento = row.get("TIPO_EVENTO") != null ? ((Number) row.get("TIPO_EVENTO")).intValue() : 0;
                String fechaStr = String.valueOf(row.get("FECHA") != null ? row.get("FECHA") : "");
                String horaStr = String.valueOf(row.get("HORA") != null ? row.get("HORA") : "");
                String inicioStr = row.get("INICIO") != null ? String.valueOf(row.get("INICIO")) : null;
                String finStr = row.get("FINALIZACION") != null ? String.valueOf(row.get("FINALIZACION")) : null;
                String nombre = String.valueOf(row.get("NOMBRE") != null ? row.get("NOMBRE") : "").trim();
                String doc = String.valueOf(row.get("DOCUMENTO") != null ? row.get("DOCUMENTO") : "").trim();
                String grupoRow = String.valueOf(row.get("GRUPO") != null ? row.get("GRUPO") : "(SIN GRUPO)").trim();
                String areaRow = String.valueOf(row.get("AREA") != null ? row.get("AREA") : "").trim();
                String turno = String.valueOf(row.get("TURNO") != null ? row.get("TURNO") : "").trim();

                // 1. Llegadas tarde
                if (tipoEvento == 1 && inicioStr != null && !inicioStr.isEmpty()) {
                    int minRetraso = calcularDiferenciaMinutos(horaStr, inicioStr);
                    if (minRetraso > 6) { // Tolerancia 6 min
                        Map<String, Object> lt = new HashMap<>();
                        lt.put("idPersona", row.get("ID_PERSONA"));
                        lt.put("colaborador", nombre);
                        lt.put("documento", doc);
                        lt.put("grupo", grupoRow);
                        lt.put("centroCosto", areaRow);
                        lt.put("turno", turno);
                        lt.put("fecha", fechaStr);
                        lt.put("horaEntrada", horaStr);
                        lt.put("horaInicioTurno", inicioStr);
                        lt.put("minutosRetraso", minRetraso);
                        lt.put("aplicaMemorando", minRetraso > 15);
                        llegadasTarde.add(lt);
                    }
                }

                // 2. Salidas tarde
                if (tipoEvento == 2 && finStr != null && !finStr.isEmpty()) {
                    int minRetraso = calcularDiferenciaMinutos(horaStr, finStr);
                    if (minRetraso > 11) { // Tolerancia 11 min
                        Map<String, Object> st = new HashMap<>();
                        st.put("idPersona", row.get("ID_PERSONA"));
                        st.put("colaborador", nombre);
                        st.put("documento", doc);
                        st.put("grupo", grupoRow);
                        st.put("centroCosto", areaRow);
                        st.put("turno", turno);
                        st.put("fecha", fechaStr);
                        st.put("horaSalida", horaStr);
                        st.put("horaFinTurno", finStr);
                        st.put("minutosRetraso", minRetraso);
                        salidasTarde.add(st);
                    }
                }

                // 3. Marcaciones inválidas
                if (tipoEvento == 3) {
                    String idEvt = String.valueOf(row.get("Identificacion_evento"));
                    if (eventosInvalidosVistos.add(idEvt)) {
                        String motivo = String.valueOf(row.get("MOTIVO_INVALIDEZ") != null ? row.get("MOTIVO_INVALIDEZ") : "Sin motivo registrado").trim();
                        if (!motivo.toLowerCase().contains("ya tiene un evento a esta hora")) {
                            Map<String, Object> inv = new HashMap<>();
                            inv.put("idEvento", idEvt);
                            inv.put("idPersona", row.get("ID_PERSONA"));
                            inv.put("colaborador", nombre.isEmpty() ? "(Persona no registrada)" : nombre);
                            inv.put("documento", doc.isEmpty() ? "-" : doc);
                            inv.put("grupo", grupoRow);
                            inv.put("centroCosto", areaRow);
                            inv.put("fecha", fechaStr);
                            inv.put("hora", horaStr);
                            inv.put("motivo", motivo);
                            invalidos.add(inv);
                        }
                    }
                }
            }

            // 4. Procesar No Marcaron
            java.time.LocalDate hoy = java.time.LocalDate.now();
            java.time.LocalTime ahora = java.time.LocalTime.now();

            for (Map<String, Object> row : filasNoMarcaron) {
                int tieneEntrada = row.get("TIENE_ENTRADA") != null ? ((Number) row.get("TIENE_ENTRADA")).intValue() : 0;
                int tieneSalida = row.get("TIENE_SALIDA") != null ? ((Number) row.get("TIENE_SALIDA")).intValue() : 0;

                if (tieneEntrada > 0 && tieneSalida > 0) continue; // Marcó ambas -> OK

                String fechaTurnoStr = String.valueOf(row.get("FECHA_TURNO") != null ? row.get("FECHA_TURNO") : "").trim();
                java.time.LocalDate fechaTurno = null;
                try {
                    if (fechaTurnoStr.length() >= 10) {
                        fechaTurno = java.time.LocalDate.parse(fechaTurnoStr.substring(0, 10));
                    }
                } catch (Exception ignored) {}

                // Si la fecha del turno es futura, no ha ocurrido
                if (fechaTurno != null && fechaTurno.isAfter(hoy)) {
                    continue;
                }

                String inicioStr = row.get("INICIO") != null ? String.valueOf(row.get("INICIO")).trim() : null;
                String finStr = row.get("FINALIZACION") != null ? String.valueOf(row.get("FINALIZACION")).trim() : null;

                java.time.LocalTime horaInicioTurno = null;
                java.time.LocalTime horaFinTurno = null;
                try {
                    if (inicioStr != null && inicioStr.length() >= 5) {
                        horaInicioTurno = java.time.LocalTime.parse(inicioStr.length() == 5 ? inicioStr : inicioStr.substring(0, 8));
                    }
                } catch (Exception ignored) {}
                try {
                    if (finStr != null && finStr.length() >= 5) {
                        horaFinTurno = java.time.LocalTime.parse(finStr.length() == 5 ? finStr : finStr.substring(0, 8));
                    }
                } catch (Exception ignored) {}

                // Si es el turno del día de hoy:
                if (fechaTurno != null && fechaTurno.isEqual(hoy)) {
                    // Si el turno ni siquiera ha iniciado hoy, ignorar
                    if (horaInicioTurno != null && ahora.isBefore(horaInicioTurno)) {
                        continue;
                    }

                    // Si el colaborador marcó entrada y aún no ha marcado salida:
                    if (tieneEntrada > 0 && tieneSalida == 0) {
                        // "La salida aún no es": si la hora fin del turno no ha pasado (con 10 min de tolerancia)
                        if (horaFinTurno != null) {
                            if (horaInicioTurno == null || !horaInicioTurno.isAfter(horaFinTurno)) {
                                if (ahora.isBefore(horaFinTurno.plusMinutes(10))) {
                                    continue; // Colaborador laborando normalmente en su jornada
                                }
                            } else {
                                // Turno nocturno que culmina al día siguiente
                                continue;
                            }
                        } else {
                            // Por defecto las jornadas diurnas no terminan antes de las 17:30
                            if (ahora.isBefore(java.time.LocalTime.of(17, 30))) {
                                continue;
                            }
                        }
                    }
                }

                String tipoOmision;
                if (tieneEntrada == 0 && tieneSalida == 0) {
                    if (fechaTurno != null && fechaTurno.isEqual(hoy) && horaFinTurno != null && ahora.isBefore(horaFinTurno)) {
                        tipoOmision = "ENTRADA";
                    } else {
                        tipoOmision = "AMBAS";
                    }
                } else if (tieneEntrada == 0) {
                    tipoOmision = "ENTRADA";
                } else {
                    tipoOmision = "SALIDA";
                }

                Map<String, Object> nm = new HashMap<>();
                nm.put("idPersona", row.get("ID_PERSONA"));
                nm.put("documento", String.valueOf(row.get("DOCUMENTO") != null ? row.get("DOCUMENTO") : "").trim());
                nm.put("colaborador", String.valueOf(row.get("NOMBRE") != null ? row.get("NOMBRE") : "").trim());
                nm.put("fecha", String.valueOf(row.get("FECHA_TURNO") != null ? row.get("FECHA_TURNO") : ""));
                nm.put("turno", String.valueOf(row.get("TURNO") != null ? row.get("TURNO") : ""));
                nm.put("grupo", String.valueOf(row.get("GRUPO") != null ? row.get("GRUPO") : "(SIN GRUPO)").trim());
                nm.put("centroCosto", String.valueOf(row.get("CENTRO_COSTO") != null ? row.get("CENTRO_COSTO") : ""));
                nm.put("horaInicio", row.get("INICIO"));
                nm.put("horaFin", row.get("FINALIZACION"));
                nm.put("tipoOmision", tipoOmision);
                noMarcaron.add(nm);
            }

            // Filtros opcionales
            if (grupo != null && !grupo.trim().isEmpty() && !grupo.equalsIgnoreCase("TODOS")) {
                String gFiltro = grupo.trim().toLowerCase();
                llegadasTarde.removeIf(x -> !String.valueOf(x.get("grupo")).toLowerCase().contains(gFiltro));
                noMarcaron.removeIf(x -> !String.valueOf(x.get("grupo")).toLowerCase().contains(gFiltro));
                salidasTarde.removeIf(x -> !String.valueOf(x.get("grupo")).toLowerCase().contains(gFiltro));
                invalidos.removeIf(x -> !String.valueOf(x.get("grupo")).toLowerCase().contains(gFiltro));
            }

            if (busqueda != null && !busqueda.trim().isEmpty()) {
                String q = busqueda.trim().toLowerCase();
                java.util.function.Predicate<Map<String, Object>> pred = x ->
                    String.valueOf(x.get("colaborador")).toLowerCase().contains(q) ||
                    String.valueOf(x.get("documento")).toLowerCase().contains(q) ||
                    String.valueOf(x.get("turno")).toLowerCase().contains(q);

                llegadasTarde.removeIf(pred.negate());
                noMarcaron.removeIf(pred.negate());
                salidasTarde.removeIf(pred.negate());
                invalidos.removeIf(pred.negate());
            }

            long totalMemos = llegadasTarde.stream().filter(x -> Boolean.TRUE.equals(x.get("aplicaMemorando"))).count() + noMarcaron.size();

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("fechaInicio", fIni);
            respuesta.put("fechaFin", fFin);

            Map<String, Object> resumen = new HashMap<>();
            resumen.put("totalLlegadasTarde", llegadasTarde.size());
            resumen.put("totalNoMarcaron", noMarcaron.size());
            resumen.put("totalSalidasTarde", salidasTarde.size());
            resumen.put("totalInvalidos", invalidos.size());
            resumen.put("totalMemorandos", totalMemos);

            respuesta.put("resumen", resumen);
            respuesta.put("llegadasTarde", llegadasTarde);
            respuesta.put("noMarcaron", noMarcaron);
            respuesta.put("salidasTarde", salidasTarde);
            respuesta.put("invalidos", invalidos);

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            System.err.println("❌ Error en getLlegadasTarde: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    /**
     * Endpoint Módulo Prueba: Resumen Semanal de Horas Programadas vs Ejecutadas e Interrupciones por Usuario
     * GET /api/nomina/resumen-semanal
     * o GET /api/nomina/prueba
     */
    @GetMapping({"/resumen-semanal", "/prueba", "/liquidacion-2", "/liquidacion2", "/liquidacion"})
    public ResponseEntity<?> getResumenSemanal(
            @RequestParam(value = "fecha", required = false) String fechaRef,
            @RequestParam(value = "busqueda", required = false) String busqueda,
            @RequestParam(value = "grupo", required = false) String grupo,
            @RequestParam(value = "soloActivos", required = false, defaultValue = "false") Boolean soloActivos
    ) {
        try {
            java.time.LocalDate refDate;
            if (fechaRef != null && !fechaRef.trim().isEmpty()) {
                try {
                    refDate = java.time.LocalDate.parse(extraerFecha(fechaRef));
                } catch (Exception e) {
                    refDate = java.time.LocalDate.now();
                }
            } else {
                refDate = java.time.LocalDate.now();
            }

            java.time.LocalDate lunes = refDate.with(java.time.DayOfWeek.MONDAY);
            java.time.LocalDate domingo = refDate.with(java.time.DayOfWeek.SUNDAY);
            String fLunes = lunes.toString();
            String fDomingo = domingo.toString();
            String fSiguiente = domingo.plusDays(1).toString();
            java.time.LocalDate hoy = java.time.LocalDate.now();
            java.time.LocalTime ahora = java.time.LocalTime.now();

            String[] nombresDias = {"Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"};
            List<Map<String, Object>> diasSemanaMeta = new ArrayList<>();
            for (int i = 0; i < 7; i++) {
                java.time.LocalDate d = lunes.plusDays(i);
                Map<String, Object> dm = new HashMap<>();
                dm.put("indice", i);
                dm.put("nombre", nombresDias[i]);
                dm.put("fecha", d.toString());
                dm.put("esHoy", d.isEqual(hoy));
                dm.put("esFuturo", d.isAfter(hoy));
                diasSemanaMeta.add(dm);
            }

            // 1. Personas activas
            String sqlPersonas = """
                SELECT 
                    b.PRSNIDENTIFICATION AS ID_PERSONA,
                    b.PRSNIDENTIFICATIONOWN AS DOCUMENTO,
                    CONCAT(b.PRSNFIRSTNAME, ' ', ISNULL(b.PRSNFIRSTNAME1, ''), ' ', b.PRSNLASTNAME, ' ', ISNULL(b.PRSNLASTNAME1, '')) AS NOMBRE,
                    ISNULL(c.GROUPNAME, '(SIN GRUPO)') AS GRUPO,
                    ISNULL(d.AREANAME, '') AS AREA
                FROM [siesaaccess_biocosta].[dbo].[ENRPERSON] b
                LEFT JOIN [siesaaccess_biocosta].[dbo].[CNFGROUP] c ON b.GROUPIDENTIFICATION = c.GROUPIDENTIFICATION
                LEFT JOIN [siesaaccess_biocosta].[dbo].[CNFAREA] d ON b.AREAIDENTIFICATION = d.AREAIDENTIFICATION
                WHERE b.PRSNIDENTIFICATION NOT IN ('380', '421', '404', '638', '374', '708', '717')
                ORDER BY b.PRSNFIRSTNAME, b.PRSNLASTNAME
            """;

            // 2. Programación de turnos en la semana
            String sqlTurnos = """
                SET DATEFIRST 1;
                SELECT 
                    f.PRSNIDENTIFICATION AS ID_PERSONA,
                    CONVERT(VARCHAR(10), CAST(f.PRTRDATEINIT AS DATE), 120) AS FECHA_TURNO,
                    g.TRFXNAME AS TURNO,
                    CONVERT(VARCHAR(8), CAST(h.TRFXINPUT1 AS TIME), 108) AS INICIO,
                    CONVERT(VARCHAR(8), CAST(h.TRFXOUTPUT2 AS TIME), 108) AS FINALIZACION
                FROM [siesaaccess_biocosta].[dbo].[CNFPROGRAMATIONTURN] f
                INNER JOIN [siesaaccess_biocosta].[dbo].[CNFTURNFIX] g ON f.TRFXIDENTIFICATION = g.TRFXIDENTIFICATION
                LEFT JOIN [siesaaccess_biocosta].[dbo].[CNFTURNFIXDAY] h ON g.TRFXIDENTIFICATION = h.TRFXIDENTIFICATION
                    AND h.NMDYIDENTIFICATION = (
                        SELECT CASE
                            WHEN EXISTS (SELECT 1 FROM [siesaaccess_biocosta].[dbo].[GENDAY] gd WHERE CAST(gd.DAYDATE AS DATE) = CAST(f.PRTRDATEINIT AS DATE)) THEN 8
                            ELSE DATEPART(WEEKDAY, f.PRTRDATEINIT)
                        END
                    )
                WHERE f.PRTRDATEINIT >= ? AND f.PRTRDATEINIT < ?
                  AND f.PRSNIDENTIFICATION NOT IN ('380', '421', '404', '638', '374', '708', '717')
            """;

            // 3. Marcaciones biométricas de la semana
            String sqlBiometrico = """
                SELECT 
                    e.PRSNIDENTIFICATION AS ID_PERSONA,
                    CONVERT(VARCHAR(10), CAST(e.EVENDATERECORD AS DATE), 120) AS FECHA,
                    MIN(CASE WHEN e.TYEVIDENTIFICATION = 1 THEN CONVERT(VARCHAR(8), CAST(e.EVENDATERECORD AS TIME), 108) END) AS HORA_ENTRADA,
                    MAX(CASE WHEN e.TYEVIDENTIFICATION = 2 THEN CONVERT(VARCHAR(8), CAST(e.EVENDATERECORD AS TIME), 108) END) AS HORA_SALIDA,
                    SUM(CASE WHEN e.TYEVIDENTIFICATION = 1 THEN 1 ELSE 0 END) AS CANTIDAD_ENTRADAS
                FROM [siesaaccess_biocosta].[dbo].[CIOEVENT] e
                WHERE e.EVENDATERECORD >= ? AND e.EVENDATERECORD < ?
                  AND e.PRSNIDENTIFICATION NOT IN ('380', '421', '404', '638', '374', '708', '717')
                GROUP BY e.PRSNIDENTIFICATION, CONVERT(VARCHAR(10), CAST(e.EVENDATERECORD AS DATE), 120)
            """;

            // 4. Interrupciones de la semana
            String sqlInterrupciones = """
                SELECT 
                    PersonId AS ID_PERSONA,
                    DocumentNumber AS DOCUMENTO,
                    CONVERT(VARCHAR(10), CAST([Date] AS DATE), 120) AS FECHA,
                    InterruptionName AS INTERRUPCION,
                    DifferenceInHours AS HORAS_INTERRUPCION,
                    Observations AS OBSERVACIONES
                FROM [siesaaccess_biocosta].[dbo].[View_InterruptionsScheduling]
                WHERE [Date] >= ? AND [Date] < ?
            """;

            JdbcTemplate template = getSiesaAccessTemplate();
            List<Map<String, Object>> filasPersonas;
            List<Map<String, Object>> filasTurnos;
            List<Map<String, Object>> filasBiometrico;
            List<Map<String, Object>> filasInterrupciones;

            try {
                filasPersonas = template.queryForList(adaptarSql(sqlPersonas, template));
                filasTurnos = template.queryForList(adaptarSql(sqlTurnos, template), fLunes, fSiguiente);
                filasBiometrico = template.queryForList(adaptarSql(sqlBiometrico, template), fLunes, fSiguiente);
                filasInterrupciones = template.queryForList(adaptarSql(sqlInterrupciones, template), fLunes, fSiguiente);
            } catch (Exception eAccess) {
                if (primaryJdbcTemplate != null && template != primaryJdbcTemplate) {
                    template = primaryJdbcTemplate;
                    filasPersonas = template.queryForList(sqlPersonas);
                    filasTurnos = template.queryForList(sqlTurnos, fLunes, fSiguiente);
                    filasBiometrico = template.queryForList(sqlBiometrico, fLunes, fSiguiente);
                    filasInterrupciones = template.queryForList(sqlInterrupciones, fLunes, fSiguiente);
                } else {
                    throw eAccess;
                }
            }

            // Mapear turnos por (idPersona + "_" + fecha)
            Map<String, Map<String, Object>> mapaTurnos = new HashMap<>();
            for (Map<String, Object> t : filasTurnos) {
                String idp = String.valueOf(t.get("ID_PERSONA"));
                String fch = String.valueOf(t.get("FECHA_TURNO"));
                mapaTurnos.put(idp + "_" + fch, t);
            }

            // Mapear biométrico por (idPersona + "_" + fecha)
            Map<String, Map<String, Object>> mapaBio = new HashMap<>();
            for (Map<String, Object> b : filasBiometrico) {
                String idp = String.valueOf(b.get("ID_PERSONA"));
                String fch = String.valueOf(b.get("FECHA"));
                mapaBio.put(idp + "_" + fch, b);
            }

            // Mapear interrupciones por (idPersona + "_" + fecha) y por documento
            Map<String, List<Map<String, Object>>> mapaInterrupciones = new HashMap<>();
            for (Map<String, Object> in : filasInterrupciones) {
                String idp = String.valueOf(in.get("ID_PERSONA"));
                String fch = String.valueOf(in.get("FECHA"));
                String key = idp + "_" + fch;
                mapaInterrupciones.computeIfAbsent(key, k -> new ArrayList<>()).add(in);
            }

            // Procesar cada colaborador
            List<Map<String, Object>> colaboradoresResumen = new ArrayList<>();
            double totalHorasProgramadasGlobal = 0.0;
            double totalHorasEjecutadasGlobal = 0.0;
            double totalHorasInterrupcionesGlobal = 0.0;
            int totalConInterrupciones = 0;
            int totalConDobleEntradaGlobal = 0;
            int totalDiasDobleEntradaGlobal = 0;

            for (Map<String, Object> p : filasPersonas) {
                String idPersona = String.valueOf(p.get("ID_PERSONA"));
                String documento = String.valueOf(p.get("DOCUMENTO") != null ? p.get("DOCUMENTO") : "").trim();
                String nombre = String.valueOf(p.get("NOMBRE") != null ? p.get("NOMBRE") : "").trim();
                String grupoColab = String.valueOf(p.get("GRUPO") != null ? p.get("GRUPO") : "(SIN GRUPO)").trim();
                String areaColab = String.valueOf(p.get("AREA") != null ? p.get("AREA") : "").trim();

                double colabHorasProg = 0.0;
                double colabHorasEjec = 0.0;
                double colabHorasInterrup = 0.0;
                boolean colabTieneInterrup = false;
                boolean colabTieneDobleEntrada = false;
                int colabTotalDoblesEntradas = 0;
                List<String> novedadesSemana = new ArrayList<>();

                List<Map<String, Object>> diasColab = new ArrayList<>();

                for (int i = 0; i < 7; i++) {
                    java.time.LocalDate diaFecha = lunes.plusDays(i);
                    String diaFechaStr = diaFecha.toString();
                    String diaKey = idPersona + "_" + diaFechaStr;

                    Map<String, Object> turnoData = mapaTurnos.get(diaKey);
                    Map<String, Object> bioData = mapaBio.get(diaKey);
                    List<Map<String, Object>> interrupDataList = mapaInterrupciones.get(diaKey);

                    String nombreTurno = turnoData != null && turnoData.get("TURNO") != null ? String.valueOf(turnoData.get("TURNO")).trim() : "Descanso";
                    String inicioTurno = turnoData != null && turnoData.get("INICIO") != null ? String.valueOf(turnoData.get("INICIO")).trim() : null;
                    String finTurno = turnoData != null && turnoData.get("FINALIZACION") != null ? String.valueOf(turnoData.get("FINALIZACION")).trim() : null;

                    // 1. Horas programadas (Base semanal legal 42h: L-V 8.0h, Sábado 2.0h)
                    double hProg = 0.0;
                    if (inicioTurno != null && finTurno != null && !inicioTurno.isEmpty() && !finTurno.isEmpty()) {
                        hProg = calcularHorasEntreHoras(inicioTurno, finTurno);
                        // Descuento de 1 hora de almuerzo diaria si el turno programado es de tiempo completo (>= 7h) de Lunes a Viernes
                        if (i < 5 && hProg >= 7.0) {
                            hProg = Math.max(0.0, Math.round((hProg - 1.0) * 10.0) / 10.0);
                        } else if (i == 5 && hProg > 2.0) {
                            // En sábado, la jornada regular legal bajo Ley 2101 es de 2.0h
                            hProg = 2.0;
                        }
                    } else if (turnoData != null && !nombreTurno.equalsIgnoreCase("Descanso")) {
                        hProg = (i == 5) ? 2.0 : 8.0; // Jornada base: Sábado 2.0h, Lunes a Viernes 8.0h
                    }

                    // 2. Horas ejecutadas (restando 1 hora diaria de almuerzo)
                    String horaEntrada = bioData != null && bioData.get("HORA_ENTRADA") != null ? String.valueOf(bioData.get("HORA_ENTRADA")).trim() : null;
                    String horaSalida = bioData != null && bioData.get("HORA_SALIDA") != null ? String.valueOf(bioData.get("HORA_SALIDA")).trim() : null;
                    int cantEntradas = bioData != null && bioData.get("CANTIDAD_ENTRADAS") != null ? ((Number) bioData.get("CANTIDAD_ENTRADAS")).intValue() : 0;
                    boolean tieneDobleEntrada = cantEntradas >= 2;
                    if (tieneDobleEntrada) {
                        colabTieneDobleEntrada = true;
                        colabTotalDoblesEntradas++;
                        totalDiasDobleEntradaGlobal++;
                    }

                    double hEjec = 0.0;
                    boolean enCurso = false;
                    double almuerzoDescontado = 0.0;

                    if (horaEntrada != null && horaSalida != null && !horaEntrada.equals(horaSalida)) {
                        double hBrutas = calcularHorasEntreHoras(horaEntrada, horaSalida);
                        // A todos se les resta 1 hora diaria de almuerzo
                        if (hBrutas >= 1.0) {
                            hEjec = Math.round((hBrutas - 1.0) * 10.0) / 10.0;
                            almuerzoDescontado = 1.0;
                        } else if (hBrutas > 0.0) {
                            hEjec = 0.0;
                            almuerzoDescontado = hBrutas;
                        }
                    } else if (diaFecha.isEqual(hoy) && horaEntrada != null) {
                        // Está laborando hoy actualmente
                        int minEntrada = parsearHoraMinutos(horaEntrada);
                        int minAhora = ahora.getHour() * 60 + ahora.getMinute();
                        if (minAhora > minEntrada) {
                            double hBrutas = (minAhora - minEntrada) / 60.0;
                            // Si lleva 5 horas o más de permanencia, ya tomó su hora de almuerzo
                            if (hBrutas >= 5.0) {
                                hEjec = Math.max(0.0, Math.round((hBrutas - 1.0) * 10.0) / 10.0);
                                almuerzoDescontado = 1.0;
                            } else {
                                hEjec = Math.round(hBrutas * 10.0) / 10.0;
                            }
                            enCurso = true;
                        }
                    }

                    // 3. Interrupciones del día
                    boolean tieneInterrupDia = false;
                    double hInterrupDia = 0.0;
                    String descripInterrup = null;

                    if (interrupDataList != null && !interrupDataList.isEmpty()) {
                        tieneInterrupDia = true;
                        colabTieneInterrup = true;
                        for (Map<String, Object> inter : interrupDataList) {
                            String nomInt = String.valueOf(inter.get("INTERRUPCION") != null ? inter.get("INTERRUPCION") : "Interrupción");
                            double cant = inter.get("HORAS_INTERRUPCION") != null ? ((Number) inter.get("HORAS_INTERRUPCION")).doubleValue() : 0.0;
                            hInterrupDia += cant;
                            if (descripInterrup == null) {
                                descripInterrup = nomInt + (cant > 0 ? " (" + cant + "h)" : "");
                            }
                            if (!novedadesSemana.contains(nomInt)) {
                                novedadesSemana.add(nomInt);
                            }
                        }
                    }

                    // 4. Estado del día
                    String estadoDia;
                    if (diaFecha.isAfter(hoy)) {
                        estadoDia = "FUTURO";
                    } else if (enCurso) {
                        estadoDia = "EN_CURSO";
                    } else if (hProg == 0.0) {
                        estadoDia = hEjec > 0 ? "EXTRA_DESCANSO" : "DESCANSO";
                    } else if (hEjec == 0.0) {
                        estadoDia = tieneInterrupDia ? "CON_INTERRUPCION" : "NO_ASISTIO";
                    } else if (hEjec >= (hProg - 0.25)) {
                        estadoDia = hEjec > (hProg + 0.25) ? "CON_HORAS_EXTRA" : "CUMPLIDO";
                    } else {
                        estadoDia = "INCOMPLETO";
                    }

                    colabHorasProg += hProg;
                    colabHorasEjec += hEjec;
                    colabHorasInterrup += hInterrupDia;

                    Map<String, Object> diaInfo = new HashMap<>();
                    diaInfo.put("indice", i);
                    diaInfo.put("nombreDia", nombresDias[i]);
                    diaInfo.put("fecha", diaFechaStr);
                    diaInfo.put("esHoy", diaFecha.isEqual(hoy));
                    diaInfo.put("esFuturo", diaFecha.isAfter(hoy));
                    diaInfo.put("turno", nombreTurno);
                    diaInfo.put("inicioTurno", inicioTurno);
                    diaInfo.put("finTurno", finTurno);
                    diaInfo.put("horasProgramadas", Math.round(hProg * 10.0) / 10.0);
                    diaInfo.put("horasEjecutadas", Math.round(hEjec * 10.0) / 10.0);
                    diaInfo.put("horaEntrada", horaEntrada);
                    diaInfo.put("horaSalida", horaSalida);
                    diaInfo.put("enCurso", enCurso);
                    diaInfo.put("tieneInterrupcion", tieneInterrupDia);
                    diaInfo.put("horasInterrupcion", Math.round(hInterrupDia * 10.0) / 10.0);
                    diaInfo.put("interrupcion", descripInterrup);
                    diaInfo.put("almuerzoDescontado", almuerzoDescontado);
                    diaInfo.put("estado", estadoDia);
                    diaInfo.put("tieneDobleEntrada", tieneDobleEntrada);
                    diaInfo.put("cantidadEntradas", cantEntradas);

                    diasColab.add(diaInfo);
                }

                colabHorasProg = Math.round(colabHorasProg * 10.0) / 10.0;
                colabHorasEjec = Math.round(colabHorasEjec * 10.0) / 10.0;
                colabHorasInterrup = Math.round(colabHorasInterrup * 10.0) / 10.0;

                // Ajuste de jornada laboral semanal: estándar legal de 42h (Ley 2101 / Colombia)
                // Para colaboradores con jornada semanal completa (40h a 48h, incluyendo casos en 41h o 46h)
                if (colabHorasProg >= 40.0 && colabHorasProg <= 48.0) {
                    colabHorasProg = 42.0;

                    // Asegurar distribución exacta: L-V 8.0h cada día y Sábado 2.0h
                    for (Map<String, Object> d : diasColab) {
                        int idx = ((Number) d.get("indice")).intValue();
                        double hp = ((Number) d.get("horasProgramadas")).doubleValue();
                        if (idx < 5 && hp > 0) {
                            d.put("horasProgramadas", 8.0);
                        } else if (idx == 5) {
                            d.put("horasProgramadas", 2.0);
                        }
                    }

                    // Re-evaluar estado del día con las horas programadas ajustadas a 42h
                    for (Map<String, Object> d : diasColab) {
                        boolean esFut = Boolean.TRUE.equals(d.get("esFuturo"));
                        boolean enCur = Boolean.TRUE.equals(d.get("enCurso"));
                        double hp = ((Number) d.get("horasProgramadas")).doubleValue();
                        double he = ((Number) d.get("horasEjecutadas")).doubleValue();
                        boolean tieneInt = Boolean.TRUE.equals(d.get("tieneInterrupcion"));
                        if (!esFut && !enCur) {
                            if (hp == 0.0) {
                                d.put("estado", he > 0 ? "EXTRA_DESCANSO" : "DESCANSO");
                            } else if (he == 0.0) {
                                d.put("estado", tieneInt ? "CON_INTERRUPCION" : "NO_ASISTIO");
                            } else if (he >= (hp - 0.25)) {
                                d.put("estado", he > (hp + 0.25) ? "CON_HORAS_EXTRA" : "CUMPLIDO");
                            } else {
                                d.put("estado", "INCOMPLETO");
                            }
                        }
                    }
                } else if (colabHorasProg > 42.0) {
                    double reduccion = Math.round((colabHorasProg - 42.0) * 10.0) / 10.0;
                    colabHorasProg = 42.0;
                    for (Map<String, Object> d : diasColab) {
                        int idx = ((Number) d.get("indice")).intValue();
                        double hp = ((Number) d.get("horasProgramadas")).doubleValue();
                        if (idx == 5 && hp > 0) {
                            double aQuitar = Math.min(hp, reduccion);
                            d.put("horasProgramadas", Math.round((hp - aQuitar) * 10.0) / 10.0);
                            reduccion = Math.round((reduccion - aQuitar) * 10.0) / 10.0;
                            break;
                        }
                    }
                    if (reduccion > 0) {
                        for (int k = diasColab.size() - 1; k >= 0 && reduccion > 0; k--) {
                            Map<String, Object> d = diasColab.get(k);
                            double hp = ((Number) d.get("horasProgramadas")).doubleValue();
                            if (hp > 0) {
                                double aQuitar = Math.min(hp, reduccion);
                                d.put("horasProgramadas", Math.round((hp - aQuitar) * 10.0) / 10.0);
                                reduccion = Math.round((reduccion - aQuitar) * 10.0) / 10.0;
                            }
                        }
                    }
                }

                double diferencia = Math.round((colabHorasEjec - colabHorasProg) * 10.0) / 10.0;
                double pctCumplimiento = colabHorasProg > 0 ? Math.round((colabHorasEjec / colabHorasProg) * 1000.0) / 10.0 : (colabHorasEjec > 0 ? 100.0 : 0.0);

                boolean tieneHorasSemana = (colabHorasProg > 0.0 || colabHorasEjec > 0.0 || colabTieneInterrup);
                if (Boolean.TRUE.equals(soloActivos) && !tieneHorasSemana) {
                    continue;
                }

                totalHorasProgramadasGlobal += colabHorasProg;
                totalHorasEjecutadasGlobal += colabHorasEjec;
                totalHorasInterrupcionesGlobal += colabHorasInterrup;
                if (colabTieneInterrup) totalConInterrupciones++;

                Map<String, Object> cRow = new HashMap<>();
                cRow.put("idPersona", idPersona);
                cRow.put("documento", documento);
                cRow.put("colaborador", nombre);
                cRow.put("grupo", grupoColab);
                cRow.put("area", areaColab);
                cRow.put("totalHorasProgramadas", colabHorasProg);
                cRow.put("totalHorasEjecutadas", colabHorasEjec);
                cRow.put("diferenciaHoras", diferencia);
                cRow.put("porcentajeCumplimiento", pctCumplimiento);
                cRow.put("tieneInterrupciones", colabTieneInterrup);
                cRow.put("totalHorasInterrupciones", colabHorasInterrup);
                cRow.put("novedadesSemana", novedadesSemana);
                cRow.put("activo", true);
                cRow.put("tieneHorasEstaSemana", tieneHorasSemana);
                cRow.put("tieneDobleEntrada", colabTieneDobleEntrada);
                cRow.put("totalDoblesEntradas", colabTotalDoblesEntradas);
                if (colabTieneDobleEntrada) totalConDobleEntradaGlobal++;
                cRow.put("dias", diasColab);

                colaboradoresResumen.add(cRow);
            }

            // Filtros opcionales
            if (grupo != null && !grupo.trim().isEmpty() && !grupo.equalsIgnoreCase("TODOS")) {
                String gLow = grupo.trim().toLowerCase();
                colaboradoresResumen.removeIf(c -> !String.valueOf(c.get("grupo")).toLowerCase().contains(gLow));
            }

            if (busqueda != null && !busqueda.trim().isEmpty()) {
                String qLow = busqueda.trim().toLowerCase();
                colaboradoresResumen.removeIf(c ->
                    !String.valueOf(c.get("colaborador")).toLowerCase().contains(qLow) &&
                    !String.valueOf(c.get("documento")).toLowerCase().contains(qLow) &&
                    !String.valueOf(c.get("grupo")).toLowerCase().contains(qLow)
                );
            }

            Map<String, Object> resumen = new HashMap<>();
            resumen.put("totalColaboradores", colaboradoresResumen.size());
            resumen.put("totalHorasProgramadas", Math.round(totalHorasProgramadasGlobal * 10.0) / 10.0);
            resumen.put("totalHorasEjecutadas", Math.round(totalHorasEjecutadasGlobal * 10.0) / 10.0);
            resumen.put("totalHorasInterrupciones", Math.round(totalHorasInterrupcionesGlobal * 10.0) / 10.0);
            resumen.put("totalConInterrupciones", totalConInterrupciones);
            resumen.put("totalColaboradoresDobleEntrada", totalConDobleEntradaGlobal);
            resumen.put("totalDiasDobleEntrada", totalDiasDobleEntradaGlobal);
            double pctGlobal = totalHorasProgramadasGlobal > 0 ? Math.round((totalHorasEjecutadasGlobal / totalHorasProgramadasGlobal) * 1000.0) / 10.0 : 0.0;
            resumen.put("porcentajeCumplimientoGlobal", pctGlobal);

            Map<String, Object> resp = new HashMap<>();
            resp.put("semanaInicio", fLunes);
            resp.put("semanaFin", fDomingo);
            resp.put("diasMeta", diasSemanaMeta);
            resp.put("resumen", resumen);
            resp.put("colaboradores", colaboradoresResumen);

            return ResponseEntity.ok(resp);

        } catch (Exception e) {
            System.err.println("❌ Error en getResumenSemanal: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    private double calcularHorasEntreHoras(String h1, String h2) {
        if (h1 == null || h2 == null || h1.isEmpty() || h2.isEmpty()) return 0.0;
        int m1 = parsearHoraMinutos(h1);
        int m2 = parsearHoraMinutos(h2);
        int diff = m2 - m1;
        if (diff < 0) diff += 1440; // Cruza medianoche
        return Math.round((diff / 60.0) * 10.0) / 10.0;
    }

    private int parsearHoraMinutos(String horaStr) {
        if (horaStr == null || horaStr.isEmpty()) return 0;
        try {
            String[] parts = horaStr.split(":");
            return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
        } catch (Exception e) {
            return 0;
        }
    }

    private int calcularDiferenciaMinutos(String hMarc, String hEsp) {
        if (hMarc == null || hEsp == null || hMarc.isEmpty() || hEsp.isEmpty()) return 0;
        try {
            String[] pMarc = hMarc.split(":");
            String[] pEsp = hEsp.split(":");
            int secMarc = Integer.parseInt(pMarc[0]) * 3600 + Integer.parseInt(pMarc[1]) * 60 + (pMarc.length > 2 ? (int) Double.parseDouble(pMarc[2]) : 0);
            int secEsp = Integer.parseInt(pEsp[0]) * 3600 + Integer.parseInt(pEsp[1]) * 60 + (pEsp.length > 2 ? (int) Double.parseDouble(pEsp[2]) : 0);
            return (secMarc - secEsp) / 60;
        } catch (Exception e) {
            return 0;
        }
    }

    private String extraerFecha(String fechaStr) {
        if (fechaStr == null) return "";
        fechaStr = fechaStr.trim();
        if (fechaStr.length() >= 10) {
            return fechaStr.substring(0, 10);
        }
        return fechaStr;
    }

    private String calcularFechaSiguiente(String fechaStr) {
        String f = extraerFecha(fechaStr);
        if (f.isEmpty()) return "";
        try {
            java.time.LocalDate date = java.time.LocalDate.parse(f);
            return date.plusDays(1).toString();
        } catch (Exception e) {
            return "";
        }
    }

    @PostMapping("/notificar-horas-extras")
    public ResponseEntity<?> notificarHorasExtras(@RequestBody Map<String, Object> body) {
        try {
            String correoDestino = (String) body.getOrDefault("correo", "");
            String colaborador = (String) body.getOrDefault("colaborador", "");
            String documento = (String) body.getOrDefault("documento", "");
            String grupo = (String) body.getOrDefault("grupo", "");
            double horasProg = body.get("horasProgramadas") instanceof Number ? ((Number) body.get("horasProgramadas")).doubleValue() : 0.0;
            double horasEjec = body.get("horasEjecutadas") instanceof Number ? ((Number) body.get("horasEjecutadas")).doubleValue() : 0.0;
            double diferencia = body.get("diferenciaHoras") instanceof Number ? ((Number) body.get("diferenciaHoras")).doubleValue() : 0.0;
            String periodo = (String) body.getOrDefault("periodo", "Semana en curso");
            String observaciones = (String) body.getOrDefault("observaciones", "");

            if (correoDestino == null || correoDestino.trim().isEmpty() || !correoDestino.contains("@")) {
                correoDestino = "notificacionesbgreennet@bgreen.com.co";
            }

            final String destinoFinal = correoDestino.trim();

            if (mailSender != null) {
                new Thread(() -> {
                    try {
                        jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
                        org.springframework.mail.javamail.MimeMessageHelper helper = 
                            new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

                        helper.setFrom(mailFrom);
                        helper.setTo(destinoFinal);
                        helper.setSubject("⚠️ Alerta de Horas Excedidas: " + colaborador + " (+" + diferencia + "h)");

                        String obsHtml = (observaciones != null && !observaciones.trim().isEmpty())
                            ? "<p style='font-size: 13px; color: #475569;'><strong>Observación:</strong> " + observaciones.trim() + "</p>"
                            : "";

                        String html = "<div style='font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06);'>"
                            + "<div style='background: linear-gradient(135deg, #0a5c2e, #16a34a); padding: 22px; color: #ffffff; text-align: center;'>"
                            + "<h2 style='margin: 0; font-size: 20px; letter-spacing: 0.5px;'>Control de Nómina y Horas de Personal</h2>"
                            + "<p style='margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;'>Alerta de Colaborador con Horas Excedidas</p>"
                            + "</div>"
                            + "<div style='padding: 24px 28px; background-color: #ffffff;'>"
                            + "<p style='font-size: 14px; color: #334155; margin-top: 0;'>Se ha emitido una notificación formal por exceso de tiempo laborado respecto al horario programado:</p>"
                            + "<div style='background-color: #f8fafc; border-left: 4px solid #16a34a; padding: 16px; border-radius: 6px; margin: 18px 0;'>"
                            + "<p style='margin: 4px 0; font-size: 14px;'><strong>Colaborador:</strong> " + colaborador + "</p>"
                            + "<p style='margin: 4px 0; font-size: 14px;'><strong>Cédula:</strong> " + documento + "</p>"
                            + "<p style='margin: 4px 0; font-size: 14px;'><strong>Grupo / Cuadrilla:</strong> " + grupo + "</p>"
                            + "<p style='margin: 4px 0; font-size: 14px;'><strong>Período:</strong> " + periodo + "</p>"
                            + "<hr style='border: none; border-top: 1px dashed #cbd5e1; margin: 10px 0;'>"
                            + "<p style='margin: 4px 0; font-size: 14px;'><strong>Horas Programadas:</strong> " + horasProg + " hrs</p>"
                            + "<p style='margin: 4px 0; font-size: 14px;'><strong>Horas Ejecutadas (Biométrico):</strong> " + horasEjec + " hrs</p>"
                            + "<p style='margin: 4px 0; font-size: 15px; color: #b91c1c;'><strong>Horas Pasadas / Extra:</strong> +" + diferencia + " hrs</p>"
                            + "</div>"
                            + obsHtml
                            + "<p style='font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 14px;'>"
                            + "Notificación automática emitida desde la plataforma BgreenNet (Liquidación de Horas y Turnos 2)."
                            + "</p>"
                            + "</div></div>";

                        helper.setText(html, true);
                        mailSender.send(message);
                        System.out.println("📧 [Nomina] Notificación de horas excedidas enviada a: " + destinoFinal);
                    } catch (Exception err) {
                        System.err.println("❌ Error enviando correo de horas excedidas: " + err.getMessage());
                    }
                }).start();
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "mensaje", "Notificación de horas extras enviada con éxito a " + destinoFinal
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }


    /**
     * Retorna la configuración de correos para reportes de llegadas tarde (.NET)
     * GET /api/nomina/configuracion-correos-llegadas-tarde
     */
    @GetMapping("/configuracion-correos-llegadas-tarde")
    public ResponseEntity<?> getConfiguracionCorreosLT() {
        Map<String, Object> config = new HashMap<>();
        config.put("correoPorGrupo", CORREO_POR_GRUPO);
        config.put("gruposPorCorreoDirectivo", GRUPOS_POR_CORREO_DIRECTIVO);
        config.put("correosGenerales", CORREOS_GENERALES);
        config.put("correosGenerales2", CORREOS_GENERALES_2);
        config.put("idsExcluidos", IDS_EXCLUIDOS);
        return ResponseEntity.ok(config);
    }

    /**
     * Endpoint para enviar reportes de llegadas tarde por correo (General, General 2, Directivo, Jefes de Grupo, Masivo)
     * POST /api/nomina/enviar-reporte-llegadas-tarde
     */
    @PostMapping("/enviar-reporte-llegadas-tarde")
    public ResponseEntity<?> enviarReporteLlegadasTarde(@RequestBody Map<String, Object> body) {
        try {
            String tipoEnvio = (String) body.getOrDefault("tipoEnvio", "GENERAL");
            String fechaInicio = (String) body.getOrDefault("fechaInicio", "");
            String fechaFin = (String) body.getOrDefault("fechaFin", "");
            String directivo = (String) body.getOrDefault("directivo", "");
            String grupo = (String) body.getOrDefault("grupo", "");
            String observaciones = (String) body.getOrDefault("observaciones", "");
            Object destManualObj = body.get("destinatariosManuales");
            Object destPrincObj = body.get("destinatariosPrincipales");

            List<String> ccManuales = new ArrayList<>();
            if (destManualObj instanceof List<?>) {
                for (Object item : (List<?>) destManualObj) {
                    if (item != null && item.toString().contains("@")) {
                        ccManuales.add(item.toString().trim());
                    }
                }
            } else if (destManualObj instanceof String && !((String) destManualObj).trim().isEmpty()) {
                for (String part : ((String) destManualObj).split("[,;]")) {
                    if (part.contains("@")) {
                        ccManuales.add(part.trim());
                    }
                }
            }

            List<String> destPrincipales = new ArrayList<>();
            if (destPrincObj instanceof List<?>) {
                for (Object item : (List<?>) destPrincObj) {
                    if (item != null && item.toString().contains("@")) {
                        destPrincipales.add(item.toString().trim());
                    }
                }
            }

            // Consultar datos completos del período
            ResponseEntity<?> resp = getLlegadasTarde(fechaInicio, fechaFin, "TODOS", "");
            if (!resp.getStatusCode().is2xxSuccessful() || !(resp.getBody() instanceof Map)) {
                return ResponseEntity.status(500).body(Map.of("error", "Error al consultar registros de llegadas tarde"));
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) resp.getBody();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> todasLlegadas = (List<Map<String, Object>>) data.getOrDefault("llegadasTarde", Collections.emptyList());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> todasOmisiones = (List<Map<String, Object>>) data.getOrDefault("noMarcaron", Collections.emptyList());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> todasSalidas = (List<Map<String, Object>>) data.getOrDefault("salidasTarde", Collections.emptyList());

            String fIniStr = String.valueOf(data.getOrDefault("fechaInicio", fechaInicio));
            String fFinStr = String.valueOf(data.getOrDefault("fechaFin", fechaFin));
            String periodoTexto = fIniStr.equals(fFinStr) ? fIniStr : (fIniStr + " al " + fFinStr);

            List<String> despachosRealizados = new ArrayList<>();

            if (tipoEnvio.equalsIgnoreCase("GENERAL")) {
                // 1. REPORTE GENERAL (con memorandos) a CORREOS_GENERALES
                List<String> receptores = !destPrincipales.isEmpty() ? destPrincipales : CORREOS_GENERALES;
                String asunto = "Reporte General de Llegadas Tarde y Omisiones - BGreen (" + periodoTexto + ")";
                String html = generarHtmlReporteLlegadasTarde(
                    "Reporte General de Llegadas Tarde y Control Biométrico",
                    periodoTexto,
                    todasLlegadas,
                    todasOmisiones,
                    todasSalidas,
                    true, // con memorandos
                    observaciones
                );
                enviarEmailReporteHtml(receptores, ccManuales, asunto, html);
                despachosRealizados.add("Reporte General -> " + String.join(", ", receptores));

            } else if (tipoEnvio.equalsIgnoreCase("GENERAL_2")) {
                // 2. REPORTE GENERAL 2 (sin memorandos) a CORREOS_GENERALES_2
                List<String> receptores = !destPrincipales.isEmpty() ? destPrincipales : CORREOS_GENERALES_2;
                String asunto = "Reporte General Directivo - Control de Horarios - BGreen (" + periodoTexto + ")";
                String html = generarHtmlReporteLlegadasTarde(
                    "Reporte General de Novedades de Asistencia (Dirección)",
                    periodoTexto,
                    todasLlegadas,
                    todasOmisiones,
                    todasSalidas,
                    false, // SIN memorandos
                    observaciones
                );
                enviarEmailReporteHtml(receptores, ccManuales, asunto, html);
                despachosRealizados.add("Reporte General 2 -> " + String.join(", ", receptores));

            } else if (tipoEnvio.equalsIgnoreCase("DIRECTIVO")) {
                // 3. CONSOLIDADO DIRECTIVO
                Map<String, List<String>> directivosAProcesar = new HashMap<>();
                if (directivo != null && !directivo.trim().isEmpty() && !directivo.equalsIgnoreCase("TODOS")) {
                    List<String> grps = GRUPOS_POR_CORREO_DIRECTIVO.get(directivo.trim());
                    if (grps != null) {
                        directivosAProcesar.put(directivo.trim(), grps);
                    }
                } else {
                    directivosAProcesar.putAll(GRUPOS_POR_CORREO_DIRECTIVO);
                }

                for (Map.Entry<String, List<String>> entry : directivosAProcesar.entrySet()) {
                    String correoDir = entry.getKey();
                    List<String> gruposDir = entry.getValue();

                    List<Map<String, Object>> llegadasFilt = todasLlegadas.stream()
                        .filter(x -> gruposDir.stream().anyMatch(g -> String.valueOf(x.get("grupo")).equalsIgnoreCase(g)))
                        .collect(Collectors.toList());

                    List<Map<String, Object>> omisionesFilt = todasOmisiones.stream()
                        .filter(x -> gruposDir.stream().anyMatch(g -> String.valueOf(x.get("grupo")).equalsIgnoreCase(g)))
                        .collect(Collectors.toList());

                    List<Map<String, Object>> salidasFilt = todasSalidas.stream()
                        .filter(x -> gruposDir.stream().anyMatch(g -> String.valueOf(x.get("grupo")).equalsIgnoreCase(g)))
                        .collect(Collectors.toList());

                    String asunto = "Reporte Consolidado Directivo - Llegadas Tarde - BGreen (" + periodoTexto + ")";
                    String html = generarHtmlReporteLlegadasTarde(
                        "Reporte Consolidado Directivo (" + String.join(", ", gruposDir) + ")",
                        periodoTexto,
                        llegadasFilt,
                        omisionesFilt,
                        salidasFilt,
                        false, // NO aplica memorando
                        observaciones
                    );
                    enviarEmailReporteHtml(List.of(correoDir), ccManuales, asunto, html);
                    despachosRealizados.add("Directivo: " + correoDir + " (" + (llegadasFilt.size() + omisionesFilt.size()) + " novedades)");
                }

            } else if (tipoEnvio.equalsIgnoreCase("GRUPO")) {
                // 4. POR JEFE DE GRUPO
                Map<String, String> gruposAProcesar = new HashMap<>();
                if (grupo != null && !grupo.trim().isEmpty() && !grupo.equalsIgnoreCase("TODOS")) {
                    String correoJefe = CORREO_POR_GRUPO.get(grupo.trim());
                    if (correoJefe != null) {
                        gruposAProcesar.put(grupo.trim(), correoJefe);
                    }
                } else {
                    gruposAProcesar.putAll(CORREO_POR_GRUPO);
                }

                for (Map.Entry<String, String> entry : gruposAProcesar.entrySet()) {
                    String nomGrupo = entry.getKey();
                    String correoJefe = entry.getValue();

                    List<Map<String, Object>> llegadasFilt = todasLlegadas.stream()
                        .filter(x -> String.valueOf(x.get("grupo")).equalsIgnoreCase(nomGrupo))
                        .collect(Collectors.toList());

                    List<Map<String, Object>> omisionesFilt = todasOmisiones.stream()
                        .filter(x -> String.valueOf(x.get("grupo")).equalsIgnoreCase(nomGrupo))
                        .collect(Collectors.toList());

                    List<Map<String, Object>> salidasFilt = todasSalidas.stream()
                        .filter(x -> String.valueOf(x.get("grupo")).equalsIgnoreCase(nomGrupo))
                        .collect(Collectors.toList());

                    // Solo enviar a los grupos que tengan alguna novedad si es masivo de grupos
                    if (llegadasFilt.isEmpty() && omisionesFilt.isEmpty() && salidasFilt.isEmpty() && grupo.equalsIgnoreCase("TODOS")) {
                        continue;
                    }

                    String asunto = "Reporte de Llegadas Tarde y Omisiones - Grupo " + nomGrupo + " (" + periodoTexto + ")";
                    String html = generarHtmlReporteLlegadasTarde(
                        "Reporte de Novedades de Asistencia - Grupo " + nomGrupo,
                        periodoTexto,
                        llegadasFilt,
                        omisionesFilt,
                        salidasFilt,
                        false, // NO aplica memorando
                        observaciones
                    );
                    enviarEmailReporteHtml(List.of(correoJefe), ccManuales, asunto, html);
                    despachosRealizados.add("Grupo " + nomGrupo + " -> " + correoJefe + " (" + (llegadasFilt.size() + omisionesFilt.size()) + " novedades)");
                }

            } else if (tipoEnvio.equalsIgnoreCase("MASIVO")) {
                // 5. DESPACHO MASIVO COMPLETO
                // A) General
                String asuntoGen = "Reporte General de Llegadas Tarde y Omisiones - BGreen (" + periodoTexto + ")";
                String htmlGen = generarHtmlReporteLlegadasTarde("Reporte General de Llegadas Tarde", periodoTexto, todasLlegadas, todasOmisiones, todasSalidas, true, observaciones);
                enviarEmailReporteHtml(CORREOS_GENERALES, ccManuales, asuntoGen, htmlGen);
                despachosRealizados.add("General: " + String.join(", ", CORREOS_GENERALES));

                // B) General 2
                String asuntoGen2 = "Reporte General Directivo - Control de Horarios - BGreen (" + periodoTexto + ")";
                String htmlGen2 = generarHtmlReporteLlegadasTarde("Reporte General Directivo", periodoTexto, todasLlegadas, todasOmisiones, todasSalidas, false, observaciones);
                enviarEmailReporteHtml(CORREOS_GENERALES_2, ccManuales, asuntoGen2, htmlGen2);
                despachosRealizados.add("General 2 (Financiero): " + String.join(", ", CORREOS_GENERALES_2));

                // C) Cada Directivo
                for (Map.Entry<String, List<String>> entry : GRUPOS_POR_CORREO_DIRECTIVO.entrySet()) {
                    String correoDir = entry.getKey();
                    List<String> grps = entry.getValue();
                    List<Map<String, Object>> lF = todasLlegadas.stream().filter(x -> grps.stream().anyMatch(g -> String.valueOf(x.get("grupo")).equalsIgnoreCase(g))).collect(Collectors.toList());
                    List<Map<String, Object>> oF = todasOmisiones.stream().filter(x -> grps.stream().anyMatch(g -> String.valueOf(x.get("grupo")).equalsIgnoreCase(g))).collect(Collectors.toList());
                    List<Map<String, Object>> sF = todasSalidas.stream().filter(x -> grps.stream().anyMatch(g -> String.valueOf(x.get("grupo")).equalsIgnoreCase(g))).collect(Collectors.toList());

                    String asuntoDir = "Reporte Consolidado Directivo - " + periodoTexto;
                    String htmlDir = generarHtmlReporteLlegadasTarde("Reporte Consolidado (" + String.join(", ", grps) + ")", periodoTexto, lF, oF, sF, false, observaciones);
                    enviarEmailReporteHtml(List.of(correoDir), ccManuales, asuntoDir, htmlDir);
                    despachosRealizados.add("Directivo " + correoDir);
                }

                // D) Cada Jefe de Grupo con novedades
                for (Map.Entry<String, String> entry : CORREO_POR_GRUPO.entrySet()) {
                    String nomG = entry.getKey();
                    String mailJefe = entry.getValue();
                    List<Map<String, Object>> lG = todasLlegadas.stream().filter(x -> String.valueOf(x.get("grupo")).equalsIgnoreCase(nomG)).collect(Collectors.toList());
                    List<Map<String, Object>> oG = todasOmisiones.stream().filter(x -> String.valueOf(x.get("grupo")).equalsIgnoreCase(nomG)).collect(Collectors.toList());
                    List<Map<String, Object>> sG = todasSalidas.stream().filter(x -> String.valueOf(x.get("grupo")).equalsIgnoreCase(nomG)).collect(Collectors.toList());

                    if (!lG.isEmpty() || !oG.isEmpty() || !sG.isEmpty()) {
                        String asuntoG = "Reporte Llegadas Tarde - Grupo " + nomG + " (" + periodoTexto + ")";
                        String htmlG = generarHtmlReporteLlegadasTarde("Reporte Grupo " + nomG, periodoTexto, lG, oG, sG, false, observaciones);
                        enviarEmailReporteHtml(List.of(mailJefe), ccManuales, asuntoG, htmlG);
                        despachosRealizados.add("Jefe Grupo " + nomG + " (" + mailJefe + ")");
                    }
                }
            } else if (tipoEnvio.equalsIgnoreCase("PERSONALIZADO")) {
                // 6. PERSONALIZADO A DESTINATARIOS MANUALES
                List<String> destinatarios = new ArrayList<>(ccManuales);
                if (destinatarios.isEmpty()) {
                    destinatarios.add(mailFrom != null ? mailFrom : "notificacionesbgreennet@bgreen.com.co");
                }
                String asunto = (String) body.getOrDefault("asunto", "Reporte Personalizado de Novedades de Horario - BGreen (" + periodoTexto + ")");
                String html = generarHtmlReporteLlegadasTarde(
                    "Reporte Personalizado de Novedades de Asistencia",
                    periodoTexto,
                    todasLlegadas,
                    todasOmisiones,
                    todasSalidas,
                    false, // NO aplica memorando
                    observaciones
                );
                enviarEmailReporteHtml(destinatarios, Collections.emptyList(), asunto, html);
                despachosRealizados.add("Personalizado -> " + String.join(", ", destinatarios));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "mensaje", "Reportes despachados correctamente",
                "totalDespachos", despachosRealizados.size(),
                "despachos", despachosRealizados
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private void enviarEmailReporteHtml(List<String> destinatarios, List<String> ccList, String asunto, String cuerpoHtml) {
        if (destinatarios == null || destinatarios.isEmpty()) return;
        if (mailSender == null) {
            System.out.println("⚠️ [Nomina] mailSender es null, simulando envío a: " + destinatarios);
            return;
        }

        new Thread(() -> {
            try {
                jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
                org.springframework.mail.javamail.MimeMessageHelper helper =
                    new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(mailFrom != null ? mailFrom : "notificacionesbgreennet@bgreen.com.co");
                helper.setTo(destinatarios.toArray(new String[0]));

                if (ccList != null && !ccList.isEmpty()) {
                    helper.setCc(ccList.toArray(new String[0]));
                }

                helper.setSubject(asunto);
                helper.setText(cuerpoHtml, true);

                mailSender.send(message);
                System.out.println("📧 [Nomina] Reporte enviado con éxito a: " + destinatarios + (ccList != null && !ccList.isEmpty() ? " (CC: " + ccList + ")" : ""));
            } catch (Exception err) {
                System.err.println("❌ [Nomina] Error enviando correo de reporte a " + destinatarios + ": " + err.getMessage());
            }
        }).start();
    }

    private String generarHtmlReporteLlegadasTarde(
        String tituloReporte, 
        String periodoTexto, 
        List<Map<String, Object>> llegadas, 
        List<Map<String, Object>> noMarcaron, 
        List<Map<String, Object>> salidas, 
        boolean incluirMemorandos, 
        String observaciones
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div style='font-family: Arial, sans-serif; max-width: 850px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.06);'>");
        
        // Header
        sb.append("<div style='background: linear-gradient(135deg, #0a5c2e, #15803d); padding: 22px; color: #ffffff; text-align: center;'>");
        sb.append("<h2 style='margin: 0; font-size: 20px; letter-spacing: 0.5px;'>").append(tituloReporte).append("</h2>");
        sb.append("<p style='margin: 6px 0 0 0; font-size: 13.5px; opacity: 0.9;'>Período de Consulta: <strong>").append(periodoTexto).append("</strong> | BGreen / Biocosta</p>");
        sb.append("</div>");

        sb.append("<div style='padding: 22px;'>");

        // Observaciones opcionales
        if (observaciones != null && !observaciones.trim().isEmpty()) {
            sb.append("<div style='background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;'>");
            sb.append("<p style='margin: 0; font-size: 13px; color: #1e3a8a;'><strong>Nota / Observación:</strong> ").append(observaciones.trim()).append("</p>");
            sb.append("</div>");
        }

        // Resumen métrico
        int totalLT = llegadas != null ? llegadas.size() : 0;
        int totalNM = noMarcaron != null ? noMarcaron.size() : 0;
        int totalST = salidas != null ? salidas.size() : 0;
        long totalMemos = llegadas != null ? llegadas.stream().filter(x -> Boolean.TRUE.equals(x.get("aplicaMemorando"))).count() : 0;

        sb.append("<div style='display: flex; gap: 12px; margin-bottom: 24px; text-align: center;'>");
        sb.append("<div style='flex: 1; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 12px;'>");
        sb.append("<span style='display: block; font-size: 11px; color: #9f1239; font-weight: bold;'>LLEGADAS TARDE</span>");
        sb.append("<span style='font-size: 22px; font-weight: 800; color: #e11d48;'>").append(totalLT).append("</span>");
        sb.append("</div>");

        sb.append("<div style='flex: 1; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px;'>");
        sb.append("<span style='display: block; font-size: 11px; color: #9a3412; font-weight: bold;'>NO MARCARON</span>");
        sb.append("<span style='font-size: 22px; font-weight: 800; color: #ea580c;'>").append(totalNM).append("</span>");
        sb.append("</div>");

        if (incluirMemorandos) {
            sb.append("<div style='flex: 1; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px;'>");
            sb.append("<span style='display: block; font-size: 11px; color: #991b1b; font-weight: bold;'>MEMORANDO (>15m)</span>");
            sb.append("<span style='font-size: 22px; font-weight: 800; color: #dc2626;'>").append(totalMemos).append("</span>");
            sb.append("</div>");
        }

        sb.append("<div style='flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px;'>");
        sb.append("<span style='display: block; font-size: 11px; color: #166534; font-weight: bold;'>SALIDAS TARDE</span>");
        sb.append("<span style='font-size: 22px; font-weight: 800; color: #16a34a;'>").append(totalST).append("</span>");
        sb.append("</div>");
        sb.append("</div>");

        // 1. Tabla de Llegadas Tarde
        sb.append("<h3 style='margin: 20px 0 10px 0; font-size: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;'>🚨 1. Colaboradores con Llegada Tarde</h3>");
        if (llegadas != null && !llegadas.isEmpty()) {
            sb.append("<table style='width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;'>");
            sb.append("<thead style='background: #f8fafc; color: #334155;'><tr>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: left;'>Colaborador</th>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: left;'>Cédula</th>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: left;'>Grupo</th>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: left;'>Turno</th>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>Turno Inicio</th>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>Hora Entrada</th>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>Retraso</th>");
            if (incluirMemorandos) {
                sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>Memorando</th>");
            }
            sb.append("</tr></thead><tbody>");
            for (Map<String, Object> lt : llegadas) {
                boolean memo = Boolean.TRUE.equals(lt.get("aplicaMemorando"));
                String rowBg = memo && incluirMemorandos ? "#fff1f2" : "#ffffff";
                sb.append("<tr style='background: ").append(rowBg).append("; border-bottom: 1px solid #e2e8f0;'>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0; font-weight: bold;'>").append(lt.get("colaborador")).append("</td>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0;'>").append(lt.get("documento")).append("</td>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0;'>").append(lt.get("grupo")).append("</td>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0;'>").append(lt.get("turno")).append("</td>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0; text-align: center;'>").append(lt.get("horaInicioTurno")).append("</td>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0; text-align: center; color: #dc2626; font-weight: bold;'>").append(lt.get("horaEntrada")).append("</td>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;'>+").append(lt.get("minutosRetraso")).append(" min</td>");
                if (incluirMemorandos) {
                    sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0; text-align: center;'>")
                      .append(memo ? "<span style='background: #dc2626; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;'>SÍ (>15m)</span>" : "<span style='color: #64748b;'>NO</span>")
                      .append("</td>");
                }
                sb.append("</tr>");
            }
            sb.append("</tbody></table>");
        } else {
            sb.append("<p style='font-size: 13px; color: #64748b; font-style: italic; margin-bottom: 24px;'>Sin registros de llegadas tarde en este reporte.</p>");
        }

        // 2. Tabla de No Marcaron
        sb.append("<h3 style='margin: 20px 0 10px 0; font-size: 15px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;'>⚠️ 2. Omisiones de Marcación en Biométrico</h3>");
        if (noMarcaron != null && !noMarcaron.isEmpty()) {
            sb.append("<table style='width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px;'>");
            sb.append("<thead style='background: #f8fafc; color: #334155;'><tr>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: left;'>Colaborador</th>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: left;'>Cédula</th>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: left;'>Grupo</th>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: left;'>Turno</th>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>Horario Turno</th>");
            sb.append("<th style='padding: 8px; border: 1px solid #cbd5e1; text-align: center;'>Tipo Omisión</th>");
            sb.append("</tr></thead><tbody>");
            for (Map<String, Object> nm : noMarcaron) {
                String tipoOm = String.valueOf(nm.get("tipoOmision"));
                String badgeColor = tipoOm.equalsIgnoreCase("AMBAS") ? "#ef4444" : (tipoOm.equalsIgnoreCase("ENTRADA") ? "#f97316" : "#3b82f6");
                sb.append("<tr style='border-bottom: 1px solid #e2e8f0;'>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0; font-weight: bold;'>").append(nm.get("colaborador")).append("</td>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0;'>").append(nm.get("documento")).append("</td>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0;'>").append(nm.get("grupo")).append("</td>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0;'>").append(nm.get("turno")).append("</td>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0; text-align: center;'>").append(nm.get("horaInicio")).append(" - ").append(nm.get("horaFin")).append("</td>");
                sb.append("<td style='padding: 7px 8px; border: 1px solid #e2e8f0; text-align: center;'><span style='background: ").append(badgeColor).append("; color: #ffffff; padding: 2px 7px; border-radius: 4px; font-weight: bold; font-size: 11px;'>").append(tipoOm).append("</span></td>");
                sb.append("</tr>");
            }
            sb.append("</tbody></table>");
        } else {
            sb.append("<p style='font-size: 13px; color: #64748b; font-style: italic; margin-bottom: 24px;'>Sin registros de omisión biométrica en este reporte.</p>");
        }

        // Footer
        sb.append("<div style='border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #64748b; text-align: center;'>");
        sb.append("<p style='margin: 0;'>Reporte emitido desde la plataforma BgreenNet - Gestión Humana y Control de Horarios.</p>");
        sb.append("<p style='margin: 4px 0 0 0;'>Biocosta / BGreen S.A.S. - Generado: ").append(java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))).append("</p>");
        sb.append("</div>");

        sb.append("</div></div>");
        return sb.toString();
    }

}
