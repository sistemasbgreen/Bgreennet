package com.bgreenNet.bgreenNet.services;

import com.bgreenNet.bgreenNet.dto.DetalleInsumoDTO;
import com.bgreenNet.bgreenNet.dto.ResumenCostosDTO;
import com.bgreenNet.bgreenNet.dto.ReporteProduccionDTO;
import com.bgreenNet.bgreenNet.repository.EmailReportesRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;


@Service
public class EmailReporteService {

    @Autowired private EmailReportesRepository repository;
    @Autowired private JavaMailSender          mailSender;
    @Autowired private org.springframework.jdbc.core.JdbcTemplate appJdbcTemplate;

    @Value("${report.email.from}") private String emailFrom;
    @Value("${report.email.to}")   private String emailTo;

    private static final DateTimeFormatter FMT_DISPLAY = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ── Envío para una fecha específica (invocado desde API) ─────────────
public void enviarReporteParaFecha(String fechaStr) {
    // fechaStr viene como "YYYY-MM-DD"
    LocalDate ref = LocalDate.parse(fechaStr.substring(0, 10));
    LocalDate fechaInicio = ref;
    LocalDate fechaFin    = ref.plusDays(1); 
    
    System.out.println("[EmailReporte] Envío manual solicitado para fecha: " + fechaStr + " (Día único: " + ref + ")");
    ejecutarEnvioParaRango(fechaInicio, fechaFin, true);
}

// ── Núcleo del proceso de envío ───────────────────────────────────────
private void ejecutarEnvioParaRango(LocalDate fechaInicio, LocalDate fechaFin, boolean esDiaUnico) {
    ReporteProduccionDTO datos = obtenerDatosReporte(fechaInicio, fechaFin);
    
    if (datos.getCostos() == null && datos.getItemsBiodiesel().isEmpty() && datos.getItemsGlicerina().isEmpty()) {
        System.err.println("[EmailReporte] ⚠️ No hay datos para enviar en el rango.");
        return;
    }

    try {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(emailFrom);
        helper.setTo(obtenerReceptoresConfigurados().split(","));
        
        String subject = esDiaUnico 
            ? "Reporte de Producción BGREEN · Día " + fechaInicio.format(FMT_DISPLAY)
            : "Reporte BGREEN SAS · ÚLTIMOS 15 DÍAS";
        
        helper.setSubject(subject);
        helper.setText(construirHtml(datos.getCostos(), datos.getItemsBiodiesel(), datos.getItemsGlicerina(), fechaInicio, fechaFin, esDiaUnico, datos.getIdOrden()), true);

        mailSender.send(message);
        registrarLogEnvio(fechaInicio, fechaFin);
        System.out.println("[EmailReporte] ✅ Correo enviado correctamente.");

    } catch (MessagingException e) {
        System.err.println("[EmailReporte] ❌ Error enviando correo: " + e.getMessage());
        throw new RuntimeException("Error al enviar correo: " + e.getMessage());
    }
}

public ReporteProduccionDTO obtenerDatosReporte(LocalDate inicio, LocalDate fin) {
    ResumenCostosDTO resumen = repository.obtenerResumenCostos(inicio, fin);
    List<DetalleInsumoDTO> detalles = repository.obtenerDetalleInsumos(inicio, fin);

    java.util.Set<String> idsBio = new java.util.HashSet<>(java.util.Arrays.asList("8", "7309", "10", "13", "12", "26"));
    java.util.Set<String> idsGli = new java.util.HashSet<>(java.util.Arrays.asList("34", "15", "2549", "32"));

    List<DetalleInsumoDTO> grupoB = new java.util.ArrayList<>();
    List<DetalleInsumoDTO> grupoG = new java.util.ArrayList<>();

    if (detalles != null) {
        for (DetalleInsumoDTO det : detalles) {
            String it = det.getItem() != null ? det.getItem().trim() : "";
            if (idsBio.contains(it))      grupoB.add(det);
            else if (idsGli.contains(it)) grupoG.add(det);
        }
    }

    ReporteProduccionDTO dto = new ReporteProduccionDTO();
    dto.setFecha(inicio);
    dto.setItemsBiodiesel(grupoB);
    dto.setItemsGlicerina(grupoG);
    dto.setCostos(resumen);

    // Obtener idOrden del primer item que lo tenga
    if (!grupoB.isEmpty()) dto.setIdOrden(grupoB.get(0).getOrdenProduccion());
    else if (!grupoG.isEmpty()) dto.setIdOrden(grupoG.get(0).getOrdenProduccion());

    return dto;
}

    public String obtenerReceptoresConfigurados() {
        try {
            asegurarTablaConfig();
            return appJdbcTemplate.queryForObject("SELECT destinatarios FROM config_receptores_reporte WHERE id = 1", String.class);
        } catch (Exception e) {
            return emailTo; // Fallback a properties
        }
    }

    public void guardarReceptores(String nuevosDestinatarios) {
        asegurarTablaConfig();
        int rows = appJdbcTemplate.update(
            "UPDATE config_receptores_reporte SET destinatarios = ? WHERE id = 1",
            nuevosDestinatarios);

        // Si no existía la fila, insertarla
        if (rows == 0) {
            appJdbcTemplate.update(
                "INSERT INTO config_receptores_reporte (id, destinatarios) VALUES (1, ?)",
                nuevosDestinatarios);
        }
    }

    private void asegurarTablaConfig() {
        appJdbcTemplate.execute("""
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[config_receptores_reporte]') AND type in (N'U'))
            BEGIN
                CREATE TABLE [dbo].[config_receptores_reporte](
                    [id] [int] PRIMARY KEY,
                    [destinatarios] [varchar](MAX) NOT NULL
                )
                INSERT INTO [dbo].[config_receptores_reporte] (id, destinatarios) VALUES (1, '""" + emailTo + """
                ')
            END
        """);
    }

    private void registrarLogEnvio(LocalDate inicio, LocalDate fin) {
        try {
            // Asegurar que la tabla existe
            appJdbcTemplate.execute("""
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[log_envio_reportes]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE [dbo].[log_envio_reportes](
                        [id] [int] IDENTITY(1,1) PRIMARY KEY,
                        [fecha_inicio] [date] NOT NULL,
                        [fecha_fin] [date] NOT NULL,
                        [fecha_registro] [datetime] DEFAULT GETDATE()
                    )
                END
            """);

            appJdbcTemplate.update("INSERT INTO log_envio_reportes (fecha_inicio, fecha_fin) VALUES (?, ?)",
                java.sql.Date.valueOf(inicio), java.sql.Date.valueOf(fin));
        } catch (Exception e) {
            System.err.println("[EmailReporte] Error registrando log: " + e.getMessage());
        }
    }

    private String construirHtml(ResumenCostosDTO resumen,
            List<DetalleInsumoDTO> grupoB,
            List<DetalleInsumoDTO> grupoG,
            LocalDate fechaInicio, LocalDate fechaFin,
            boolean esDiaUnico, String idOrden) {

BigDecimal totalGlicerina = nvl(resumen.getTotalPurificacionGlicerina());
BigDecimal totalMod       = nvl(resumen.getTotalManoObra());
BigDecimal totalOtros     = nvl(resumen.getTotalOtrosCostos());

StringBuilder sb = new StringBuilder();

// ── HEAD ──────────────────────────────────────────────────────────
sb.append("<!DOCTYPE html>")
.append("<html lang='es'><head><meta charset='UTF-8'>")
.append("<meta name='viewport' content='width=device-width,initial-scale=1'>")
.append("<title>Reporte BGREEN</title><style>")
.append("body{font-family:Segoe UI,Arial,sans-serif;background:#f0f4f0;margin:0;padding:20px;color:#333}")
.append(".wrap{max-width:680px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden}")
.append(".hdr{text-align:center;padding:22px 20px 16px;background:#fff;border-bottom:1px solid #e0e0e0}")
.append(".logo{width:52px;height:52px;background:#2e7d32;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;letter-spacing:1px}")
.append(".brand{font-size:15px;font-weight:700;color:#2e7d32;letter-spacing:1px;margin:4px 0 0}")
.append(".sub{font-size:11px;color:#888;margin:2px 0 0;text-transform:uppercase;letter-spacing:.5px}")
.append(".fecha{font-size:13px;color:#555;margin:6px 0 0}")
.append(".sec-hdr{background:#e8f5e9;padding:9px 18px;font-weight:700;font-size:12px;color:#1b5e20;text-transform:uppercase;letter-spacing:.5px;border-top:2px solid #a5d6a7}")
.append("table{width:100%;border-collapse:collapse;font-size:13px}")
.append("th{background:#f1f8e9;color:#33691e;font-size:11px;font-weight:600;text-transform:uppercase;padding:7px 18px;text-align:left;letter-spacing:.3px}")
.append("th.r{text-align:right}")
.append("td{padding:4px 18px;border-bottom:1px solid #f5f5f5;color:#444}")
.append("td.r{text-align:right;font-variant-numeric:tabular-nums;color:#2e7d32;font-weight:500}")
.append("tr:last-child td{border-bottom:none}")
.append(".res-wrap{padding:18px 18px 10px;border-top:2px solid #c8e6c9}")
.append(".res-title{font-size:13px;font-weight:700;color:#2e7d32;margin:0 0 10px}")
.append(".total-row td{background:#2e7d32 !important;color:#fff !important;font-weight:700;font-size:14px}")
.append(".ftr{text-align:center;padding:12px;font-size:11px;color:#aaa;background:#fafafa;border-top:1px solid #eee}")
.append("</style></head><body><div class='wrap'>")

// ── HEADER ────────────────────────────────────────────────────
        .append("<div class='hdr'>")
        .append("<img src='https://bgreen.com.co/Img/bgreen_Logo.png' width='50' height='50' style='object-fit:contain' alt='Bgreen'>")
        .append("<p class='sub'>Reporte de Producción").append(esDiaUnico ? "" : " (Últimos 15 días)").append("</p>");
        
        if (esDiaUnico && idOrden != null) {
            sb.append("<p class='fecha'>🆔&nbsp; <b>ID Orden: ").append(idOrden).append("</b></p>");
        }

        sb.append("<p class='fecha'>&#128197;&nbsp; ");
        
        if (esDiaUnico) {
            sb.append(fechaInicio.format(FMT_DISPLAY));
        } else {
            sb.append(fechaInicio.format(FMT_DISPLAY)).append(" - ").append(fechaFin.minusDays(1).format(FMT_DISPLAY));
        }
        
        sb.append("</p></div>");

// ── SORTING Y SEPARACION DE PRODUCTOS ────────────────────────
        DetalleInsumoDTO prodB = null;
        List<DetalleInsumoDTO> insumosB = new java.util.ArrayList<>();
        for (DetalleInsumoDTO d : grupoB) {
            String desc = d.getDescripcion() != null ? d.getDescripcion().toLowerCase() : "";
            if (desc.contains("biodi") || desc.contains("destilado")) prodB = d;
            else insumosB.add(d);
        }
        
        List<String> orderB = java.util.Arrays.asList("aceite", "estearina", "metanol", "metilato", "fosforico");
        insumosB.sort((a, b) -> {
            String aDesc = a.getDescripcion() != null ? a.getDescripcion().toLowerCase() : "";
            String bDesc = b.getDescripcion() != null ? b.getDescripcion().toLowerCase() : "";
            int idxA = 999, idxB = 999;
            for (int i=0; i<orderB.size(); i++) if (aDesc.contains(orderB.get(i))) { idxA = i; break; }
            for (int i=0; i<orderB.size(); i++) if (bDesc.contains(orderB.get(i))) { idxB = i; break; }
            return Integer.compare(idxA, idxB);
        });

        DetalleInsumoDTO prodG = null;
        List<DetalleInsumoDTO> insumosG = new java.util.ArrayList<>();
        for (DetalleInsumoDTO d : grupoG) {
            String desc = d.getDescripcion() != null ? d.getDescripcion().toLowerCase() : "";
            if (desc.contains("cruda")) prodG = d;
            else insumosG.add(d);
        }

        List<String> orderG = java.util.Arrays.asList("impura", "clorhidrico", "soda");
        insumosG.sort((a, b) -> {
            String aDesc = a.getDescripcion() != null ? a.getDescripcion().toLowerCase() : "";
            String bDesc = b.getDescripcion() != null ? b.getDescripcion().toLowerCase() : "";
            int idxA = 999, idxB = 999;
            for (int i=0; i<orderG.size(); i++) if (aDesc.contains(orderG.get(i))) { idxA = i; break; }
            for (int i=0; i<orderG.size(); i++) if (bDesc.contains(orderG.get(i))) { idxB = i; break; }
            return Integer.compare(idxA, idxB);
        });

//── BLOQUE BIODIESEL ──────────────────────────────────────────
if (!insumosB.isEmpty() || prodB != null) {
    sb.append("<div class='sec-hdr'>Biodiesel Destilado</div>");
    sb.append(construirTablaGrupo(insumosB, prodB, resumen.getTotalOtrosCostos(), resumen.getTotalManoObra(), true));
}

//── BLOQUE GLICERINA ──────────────────────────────────────────
if (!insumosG.isEmpty() || prodG != null) {
    sb.append("<div class='sec-hdr'>Glicerina Cruda</div>");
    sb.append(construirTablaGrupo(insumosG, prodG, resumen.getTotalPurificacionGlicerina(), null, false));
}





return sb.toString();
}

//── Tabla de insumos por grupo ────────────────────────────────────────────
private String construirTablaGrupo(List<DetalleInsumoDTO> items, DetalleInsumoDTO producto, BigDecimal otrosCostos, BigDecimal manoObra,
		boolean mostrarManoObra) {
	StringBuilder sb = new StringBuilder();
	sb.append("<table><thead><tr>").append("<th>Materia Prima / Insumo</th><th class='r'>Cantidad</th>")
			.append("</tr></thead><tbody>");

	for (DetalleInsumoDTO det : items) {
		String cant;
		if (det.getCantidadConsumida() != null) {
		    BigDecimal val = det.getCantidadConsumida().stripTrailingZeros();
		    int decimales = Math.max(0, val.scale());
		    cant = String.format("%,." + decimales + "f kg", det.getCantidadConsumida());
		} else {
		    cant = "—";
		}
		sb.append("<tr>").append("<td>").append(esc(det.getDescripcion())).append("</td>").append("<td class='r'>")
				.append(cant).append("</td>").append("</tr>");
	}

// Fila otros costos
	String valorOtros = otrosCostos != null ? "$ " + String.format("%,.0f", otrosCostos) : "$ 0";
	sb.append("<tr>")
	  .append("<td style='font-weight:700;color:#555'>Otros costos y gastos</td>")
	  .append("<td class='r' style='font-weight:700;color:#2e7d32'>").append(valorOtros).append("</td>")
	  .append("</tr>");

// Fila mano de obra (solo Biodiesel)
	if (mostrarManoObra) {
		String valorMod = manoObra != null ? "$ " + String.format("%,.0f", manoObra) : "$ 0";
		sb.append("<tr>")
		  .append("<td style='font-weight:700;color:#555'>Mano de obra</td>")
		  .append("<td class='r' style='font-weight:700;color:#2e7d32'>").append(valorMod).append("</td>")
		  .append("</tr>");
	}

    if (producto != null) {
        String cant;
        if (producto.getCantidadConsumida() != null) {
            BigDecimal val = producto.getCantidadConsumida().stripTrailingZeros();
            int decimales = Math.max(0, val.scale());
            cant = String.format("%,." + decimales + "f kg", producto.getCantidadConsumida());
        } else {
            cant = "—";
        }
        sb.append("<tr style='background-color: #f1f8e9;'>")
          .append("<td style='font-weight:700;color:#1b5e20'>").append(esc(producto.getDescripcion())).append("</td>")
          .append("<td class='r' style='font-weight:700;color:#1b5e20'>").append(cant).append("</td>")
          .append("</tr>");
    }

	sb.append("</tbody></table>");
	return sb.toString();
}

    private String construirFilaInsumo(DetalleInsumoDTO det) {
        String fecha = det.getFecha() != null ? det.getFecha().format(FMT_DISPLAY) : "—";
        String cant  = det.getCantidadConsumida() != null
                       ? String.format("%,.4f", det.getCantidadConsumida()) : "—";
        return "<tr>"
             + "<td><span class='badge'>" + esc(det.getItem()) + "</span></td>"
             + "<td>" + esc(det.getDescripcion()) + "</td>"
             + "<td>" + fecha + "</td>"
             + "<td class='num'>" + cant + "</td>"
             + "</tr>";
    }

    private String construirFilaCosto(String etiqueta, BigDecimal valor, boolean esTotal) {
        String valorFmt = valor != null ? "$ " + String.format("%,.0f", valor) : "$ 0";
        return "<tr class='" + (esTotal ? "total-row" : "") + "'>"
             + "<td>" + esc(etiqueta) + "</td>"
             + "<td class='num'>" + valorFmt + "</td>"
             + "</tr>";
    }

    private String construirFilaCosto(String etiqueta, BigDecimal valor) {
        return construirFilaCosto(etiqueta, valor, false);
    }

    private BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private String esc(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;").replace("<", "&lt;")
                   .replace(">", "&gt;").replace("\"", "&quot;");
    }
}