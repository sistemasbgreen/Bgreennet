package com.bgreenNet.bgreenNet.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/presentismo", "/presentismo"})
@CrossOrigin(origins = "*")
public class PresentismoController {

    @Autowired
    @Qualifier("primaryJdbcTemplate")
    private JdbcTemplate jdbcTemplate;

    @Autowired(required = false)
    @Qualifier("siesaAccessJdbcTemplate")
    private JdbcTemplate siesaAccessJdbcTemplate;

    private JdbcTemplate getSiesaAccessTemplate() {
        if (siesaAccessJdbcTemplate != null) {
            return siesaAccessJdbcTemplate;
        }
        return jdbcTemplate;
    }

    @GetMapping("/eventos")
    public ResponseEntity<?> getEventos(
            @RequestParam(value = "documento", required = false) String documento,
            @RequestParam("fechaInicio") String fechaInicio,
            @RequestParam("fechaFin") String fechaFin) {

        String doc = (documento != null) ? documento.trim() : "";
        String fInicio = normalizarFecha(fechaInicio);
        String fFin = normalizarFecha(fechaFin);

        String sql = """
            WITH Eventos AS
            (
                -- EVENTOS VÁLIDOS
                SELECT
                    a.[EVENIDENTIFICATION] AS Identificacion_evento,
                    a.[UBCTIDENTIFICATION],
                    CASE 
                        WHEN a.[TYEVIDENTIFICATION] = 1 THEN 'ENTRADA'
                        ELSE 'SALIDA'
                    END AS EVENTO,
                    a.[EVENDATERECORD] AS Fecha_hora_dt,
                    CAST(NULL AS VARCHAR(500)) AS Motivo_invalidez,
                    b.[PRSNIDENTIFICATIONOWN] AS Documento,
                    CONCAT(
                        b.[PRSNFIRSTNAME], ' ',
                        b.[PRSNFIRSTNAME1], ' ',
                        b.[PRSNLASTNAME], ' ',
                        b.[PRSNLASTNAME1]
                    ) AS Nombre,
                    a.[EVENISMANUAL]
                FROM [siesaaccess_biocosta].[dbo].[CIOEVENT] AS a
                LEFT JOIN [siesaaccess_biocosta].[dbo].[ENRPERSON] AS b
                    ON a.[PRSNIDENTIFICATION] = b.[PRSNIDENTIFICATION]

                UNION ALL

                -- EVENTOS INVÁLIDOS
                SELECT
                    a.[VNNVIDENTIFICATION] AS Identificacion_evento,
                    a.[UBCTIDENTIFICATION],
                    'INVÁLIDO' AS EVENTO,
                    a.[VNNVDATERECORD] AS Fecha_hora_dt,
                    a.[VNNVOBSERVATION] AS Motivo_invalidez,
                    b.[PRSNIDENTIFICATIONOWN] AS Documento,
                    CONCAT(
                        b.[PRSNFIRSTNAME], ' ',
                        b.[PRSNFIRSTNAME1], ' ',
                        b.[PRSNLASTNAME], ' ',
                        b.[PRSNLASTNAME1]
                    ) AS Nombre,
                    NULL AS [EVENISMANUAL]
                FROM [siesaaccess_biocosta].[dbo].[CIOEVENTINVALID] AS a
                LEFT JOIN [siesaaccess_biocosta].[dbo].[ENRPERSON] AS b
                    ON a.[PRSNIDENTIFICATION] = b.[PRSNIDENTIFICATION]
            )
            SELECT TOP 1000
                   Identificacion_evento,
                   EVENTO,
                   CONVERT(VARCHAR(19), Fecha_hora_dt, 120) AS Fecha_hora,
                   Motivo_invalidez,
                   Documento,
                   Nombre,
                   UBCTIDENTIFICATION,
                   EVENISMANUAL
            FROM Eventos
            WHERE Fecha_hora_dt >= ?
              AND Fecha_hora_dt <  ?
              AND (? = '' OR Documento = ?)
            ORDER BY Fecha_hora_dt DESC
        """;

        try {
            JdbcTemplate template = getSiesaAccessTemplate();
            String sqlToRun = (template == siesaAccessJdbcTemplate)
                    ? sql.replace("[siesaaccess_biocosta].[dbo].", "[dbo].")
                    : sql;
            List<Map<String, Object>> eventos;
            try {
                eventos = template.queryForList(sqlToRun, fInicio, fFin, doc, doc);
            } catch (Exception ex) {
                try {
                    eventos = template.queryForList(sql, fInicio, fFin, doc, doc);
                } catch (Exception ex2) {
                    if (template != jdbcTemplate && jdbcTemplate != null) {
                        eventos = jdbcTemplate.queryForList(sql, fInicio, fFin, doc, doc);
                    } else {
                        throw ex;
                    }
                }
            }
            return ResponseEntity.ok(eventos);
        } catch (Exception e) {
            System.err.println("❌ Error en PresentismoController.getEventos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error al consultar marcaciones: " + e.getMessage());
        }
    }

    /**
     * Endpoint para consultar marcaciones erróneas (personas con 2 o más entradas registradas en un mismo día).
     * GET /api/presentismo/marcaciones-erroneas?fechaInicio=...&fechaFin=...&documento=...
     */
    @GetMapping("/marcaciones-erroneas")
    public ResponseEntity<?> getMarcacionesErroneas(
            @RequestParam(value = "documento", required = false) String documento,
            @RequestParam(value = "fechaInicio", required = false) String fechaInicio,
            @RequestParam(value = "fechaFin", required = false) String fechaFin) {

        String doc = (documento != null) ? documento.trim() : "";
        String fInicio = normalizarFecha(fechaInicio);
        String fFin = normalizarFecha(fechaFin);

        if (fInicio.isEmpty()) {
            java.time.LocalDate hoy = java.time.LocalDate.now();
            fInicio = hoy.withDayOfMonth(1).toString();
            fFin = hoy.plusMonths(1).withDayOfMonth(1).toString();
        } else if (fFin.isEmpty()) {
            fFin = java.time.LocalDate.parse(fInicio).plusMonths(1).toString();
        }

        String sql = """
            SELECT
                a.[EVENIDENTIFICATION] AS Identificacion_evento,
                a.[EVENDATERECORD] AS Fecha_hora_dt,
                CONVERT(VARCHAR(10), CAST(a.[EVENDATERECORD] AS DATE), 120) AS Fecha,
                CONVERT(VARCHAR(8), CAST(a.[EVENDATERECORD] AS TIME), 108)  AS Hora,
                b.[PRSNIDENTIFICATIONOWN] AS Documento,
                CONCAT(
                    LTRIM(RTRIM(ISNULL(b.[PRSNFIRSTNAME], ''))), ' ',
                    LTRIM(RTRIM(ISNULL(b.[PRSNFIRSTNAME1], ''))), ' ',
                    LTRIM(RTRIM(ISNULL(b.[PRSNLASTNAME], ''))), ' ',
                    LTRIM(RTRIM(ISNULL(b.[PRSNLASTNAME1], '')))
                ) AS Nombre
            FROM [siesaaccess_biocosta].[dbo].[CIOEVENT] AS a
            LEFT JOIN [siesaaccess_biocosta].[dbo].[ENRPERSON] AS b
                ON a.[PRSNIDENTIFICATION] = b.[PRSNIDENTIFICATION]
            WHERE a.[TYEVIDENTIFICATION] = 1
              AND a.[EVENDATERECORD] >= ?
              AND a.[EVENDATERECORD] < ?
              AND (? = '' OR b.[PRSNIDENTIFICATIONOWN] = ?)
            ORDER BY b.[PRSNIDENTIFICATIONOWN] ASC, a.[EVENDATERECORD] ASC
        """;

        try {
            JdbcTemplate template = getSiesaAccessTemplate();
            String sqlToRun = (template == siesaAccessJdbcTemplate)
                    ? sql.replace("[siesaaccess_biocosta].[dbo].", "[dbo].")
                    : sql;
            List<Map<String, Object>> rows;
            try {
                rows = template.queryForList(sqlToRun, fInicio, fFin, doc, doc);
            } catch (Exception ex) {
                try {
                    rows = template.queryForList(sql, fInicio, fFin, doc, doc);
                } catch (Exception ex2) {
                    if (template != jdbcTemplate && jdbcTemplate != null) {
                        rows = jdbcTemplate.queryForList(sql, fInicio, fFin, doc, doc);
                    } else {
                        throw ex;
                    }
                }
            }

            Map<String, Map<String, Object>> agrupados = new java.util.LinkedHashMap<>();
            for (Map<String, Object> r : rows) {
                String d = String.valueOf(r.get("Documento") != null ? r.get("Documento") : "").trim();
                String fecha = String.valueOf(r.get("Fecha") != null ? r.get("Fecha") : "").trim();
                String hora = String.valueOf(r.get("Hora") != null ? r.get("Hora") : "").trim();
                String nombre = String.valueOf(r.get("Nombre") != null ? r.get("Nombre") : "").replaceAll("\\s+", " ").trim();

                if (d.isEmpty() || fecha.isEmpty()) continue;

                String clave = d + "_" + fecha;
                agrupados.computeIfAbsent(clave, k -> {
                    Map<String, Object> item = new java.util.HashMap<>();
                    item.put("documento", d);
                    item.put("nombre", nombre);
                    item.put("fecha", fecha);
                    item.put("horas", new java.util.ArrayList<String>());
                    item.put("totalEntradas", 0);
                    return item;
                });

                @SuppressWarnings("unchecked")
                List<String> horasList = (List<String>) agrupados.get(clave).get("horas");
                if (hora != null && !hora.isEmpty()) {
                    horasList.add(hora);
                }
                agrupados.get(clave).put("totalEntradas", horasList.size());
            }

            List<Map<String, Object>> resultado = new java.util.ArrayList<>();
            for (Map<String, Object> entry : agrupados.values()) {
                int total = (int) entry.get("totalEntradas");
                if (total >= 2) {
                    resultado.add(entry);
                }
            }

            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            System.err.println("Error en PresentismoController.getMarcacionesErroneas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error al consultar marcaciones erroneas: " + e.getMessage());
        }
    }

    @Autowired(required = false)
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.username:notificacionesbgreennet@bgreen.com.co}")
    private String mailFrom;

    private void asegurarTablaTiempoExtra() {
        try {
            String ddl = """
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='solicitud_tiempo_extra' AND xtype='U')
                BEGIN
                    CREATE TABLE solicitud_tiempo_extra (
                        id VARCHAR(60) PRIMARY KEY,
                        fecha_key VARCHAR(10) NOT NULL,
                        cedula_colaborador VARCHAR(30) NOT NULL,
                        nombre_colaborador VARCHAR(150) NOT NULL,
                        horas DECIMAL(4, 2) NOT NULL,
                        horas_texto VARCHAR(50),
                        descripcion NVARCHAR(500),
                        estado VARCHAR(20) DEFAULT 'PENDIENTE',
                        fecha_solicitud DATETIME DEFAULT GETDATE(),
                        aprobador_asignado VARCHAR(150),
                        correo_aprobador VARCHAR(150),
                        aprobado_por VARCHAR(150),
                        fecha_respuesta DATETIME,
                        motivo_respuesta NVARCHAR(500)
                    )
                END
            """;
            jdbcTemplate.execute(ddl);
        } catch (Exception e) {
            System.err.println("⚠️ Nota al verificar/crear tabla solicitud_tiempo_extra: " + e.getMessage());
        }
    }

    @GetMapping("/tiempo-extra")
    public ResponseEntity<?> getSolicitudesTiempoExtra(
            @RequestParam(value = "fechaKey", required = false) String fechaKey,
            @RequestParam(value = "cedula", required = false) String cedula) {
        asegurarTablaTiempoExtra();
        try {
            StringBuilder sql = new StringBuilder("SELECT * FROM solicitud_tiempo_extra WHERE 1=1 ");
            java.util.List<Object> params = new java.util.ArrayList<>();
            if (fechaKey != null && !fechaKey.trim().isEmpty()) {
                sql.append(" AND fecha_key = ? ");
                params.add(fechaKey.trim());
            }
            if (cedula != null && !cedula.trim().isEmpty()) {
                sql.append(" AND cedula_colaborador = ? ");
                params.add(cedula.trim());
            }
            sql.append(" ORDER BY fecha_solicitud DESC");

            List<Map<String, Object>> lista = jdbcTemplate.queryForList(sql.toString(), params.toArray());
            return ResponseEntity.ok(lista);
        } catch (Exception e) {
            System.err.println("❌ Error en getSolicitudesTiempoExtra: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error al consultar solicitudes: " + e.getMessage());
        }
    }

    @PostMapping("/tiempo-extra")
    public ResponseEntity<?> crearSolicitudTiempoExtra(@RequestBody Map<String, Object> body) {
        asegurarTablaTiempoExtra();
        try {
            String id = (String) body.get("id");
            if (id == null || id.trim().isEmpty()) {
                id = "te_" + System.currentTimeMillis();
            }
            String fechaKey = (String) body.getOrDefault("fechaKey", "");
            String cedulaColab = (String) body.getOrDefault("cedulaColaborador", "");
            String nombreColab = (String) body.getOrDefault("nombreColaborador", "Colaborador");
            Number horasNum = (Number) body.getOrDefault("horas", 2);
            double horas = horasNum.doubleValue();
            String horasTexto = (String) body.getOrDefault("horasTexto", horas + " horas");
            String descripcion = (String) body.getOrDefault("descripcion", "");
            String estado = (String) body.getOrDefault("estado", "PENDIENTE");
            String aprobadorAsignado = (String) body.getOrDefault("aprobadorAsignado", "Líder / Jefe de Área");
            String correoAprobador = (String) body.getOrDefault("correoAprobador", "");

            String insertSql = """
                INSERT INTO solicitud_tiempo_extra (
                    id, fecha_key, cedula_colaborador, nombre_colaborador,
                    horas, horas_texto, descripcion, estado, fecha_solicitud,
                    aprobador_asignado, correo_aprobador
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), ?, ?)
            """;

            jdbcTemplate.update(insertSql, id, fechaKey, cedulaColab, nombreColab, horas, horasTexto, descripcion, estado, aprobadorAsignado, correoAprobador);

            // Enviar notificación por correo al aprobador si tiene correo configurado
            if (correoAprobador != null && correoAprobador.contains("@") && mailSender != null) {
                enviarCorreoNotificacionAprobador(correoAprobador, aprobadorAsignado, nombreColab, cedulaColab, fechaKey, horas, descripcion);
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "id", id,
                "mensaje", "Solicitud de tiempo extra guardada correctamente en base de datos."
            ));
        } catch (Exception e) {
            System.err.println("❌ Error en crearSolicitudTiempoExtra: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error al guardar solicitud de tiempo extra: " + e.getMessage());
        }
    }

    @PutMapping("/tiempo-extra/{id}/aprobar")
    public ResponseEntity<?> aprobarSolicitudTiempoExtra(
            @PathVariable("id") String id,
            @RequestBody(required = false) Map<String, Object> body) {
        asegurarTablaTiempoExtra();
        try {
            String aprobadoPor = body != null && body.containsKey("aprobadoPor") ? (String) body.get("aprobadoPor") : "Líder / Supervisor";
            String updateSql = "UPDATE solicitud_tiempo_extra SET estado = 'APROBADO', aprobado_por = ?, fecha_respuesta = GETDATE() WHERE id = ?";
            jdbcTemplate.update(updateSql, aprobadoPor, id);
            return ResponseEntity.ok(Map.of("success", true, "mensaje", "Solicitud aprobada con éxito."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al aprobar solicitud: " + e.getMessage());
        }
    }

    @PutMapping("/tiempo-extra/{id}/rechazar")
    public ResponseEntity<?> rechazarSolicitudTiempoExtra(
            @PathVariable("id") String id,
            @RequestBody(required = false) Map<String, Object> body) {
        asegurarTablaTiempoExtra();
        try {
            String aprobadoPor = body != null && body.containsKey("aprobadoPor") ? (String) body.get("aprobadoPor") : "Líder / Supervisor";
            String motivo = body != null && body.containsKey("motivo") ? (String) body.get("motivo") : "No autorizado";
            String updateSql = "UPDATE solicitud_tiempo_extra SET estado = 'RECHAZADO', aprobado_por = ?, motivo_respuesta = ?, fecha_respuesta = GETDATE() WHERE id = ?";
            jdbcTemplate.update(updateSql, aprobadoPor, motivo, id);
            return ResponseEntity.ok(Map.of("success", true, "mensaje", "Solicitud rechazada."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al rechazar solicitud: " + e.getMessage());
        }
    }

    @DeleteMapping("/tiempo-extra/{id}")
    public ResponseEntity<?> eliminarSolicitudTiempoExtra(@PathVariable("id") String id) {
        asegurarTablaTiempoExtra();
        try {
            jdbcTemplate.update("DELETE FROM solicitud_tiempo_extra WHERE id = ?", id);
            return ResponseEntity.ok(Map.of("success", true, "mensaje", "Solicitud eliminada."));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al eliminar solicitud: " + e.getMessage());
        }
    }

    private void enviarCorreoNotificacionAprobador(
            String correoDestino, String nombreAprobador,
            String nombreColaborador, String cedula,
            String fechaKey, double horas, String descripcion) {
        new Thread(() -> {
            try {
                jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
                org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(mailFrom);
                helper.setTo(correoDestino.trim());
                helper.setSubject("⏰ Solicitud de Tiempo Extra - " + nombreColaborador + " (+" + horas + "h)");

                String html = """
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0ece5; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                      <div style="background: linear-gradient(135deg, #006c2c, #16a34a); padding: 22px; color: #ffffff; text-align: center;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">Solicitud de Tiempo Extra</h2>
                        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Control de Asistencia & Presentismo · BgreenNet</p>
                      </div>
                      <div style="padding: 24px 28px; background: #ffffff;">
                        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">
                          Estimado(a) <strong>%s</strong>,
                        </p>
                        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
                          El colaborador <strong>%s</strong> (C.C. %s) ha registrado una solicitud de permanencia adicional / tiempo extra que requiere tu revisión y aprobación:
                        </p>
                        <table style="width: 100%%; border-collapse: collapse; margin: 18px 0; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13.5px;">
                          <tr>
                            <td style="padding: 10px 14px; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0; width: 38%%;">Fecha del Turno:</td>
                            <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">%s</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 14px; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0;">Tiempo Adicional:</td>
                            <td style="padding: 10px 14px; color: #006c2c; font-weight: bold; border-bottom: 1px solid #e2e8f0;">+%.1f horas extra</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 14px; font-weight: bold; color: #334155; border-bottom: 1px solid #e2e8f0;">Motivo / Justificación:</td>
                            <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">%s</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px 14px; font-weight: bold; color: #334155;">Estado Actual:</td>
                            <td style="padding: 10px 14px; color: #d97706; font-weight: bold;">⏳ Pendiente de Aprobación</td>
                          </tr>
                        </table>
                        <p style="font-size: 13px; color: #64748b; margin-bottom: 0; line-height: 1.4;">
                          Por favor ingresa a la plataforma <strong>BgreenNet</strong> en el módulo de <em>Control de Asistencia & Presentismo</em> para aprobar o rechazar esta solicitud.
                        </p>
                      </div>
                      <div style="background: #f1f5f9; padding: 14px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                        Mensaje automático generado por la plataforma BgreenNet. Por favor no respondas directamente a este correo.
                      </div>
                    </div>
                """.formatted(
                    nombreAprobador != null ? nombreAprobador : "Líder de Área",
                    nombreColaborador,
                    cedula != null ? cedula : "N/A",
                    fechaKey,
                    horas,
                    descripcion != null ? descripcion : "Sin descripción"
                );

                helper.setText(html, true);
                mailSender.send(message);
                System.out.println("✅ [TiempoExtra] Notificación enviada al aprobador: " + correoDestino);
            } catch (Exception e) {
                System.err.println("⚠️ [TiempoExtra] No se pudo enviar el correo de notificación: " + e.getMessage());
            }
        }).start();
    }

    private String normalizarFecha(String f) {
        if (f == null) return "";
        f = f.trim();
        if (f.length() == 8 && !f.contains("-")) {
            return f.substring(0, 4) + "-" + f.substring(4, 6) + "-" + f.substring(6, 8);
        }
        return f;
    }
}
