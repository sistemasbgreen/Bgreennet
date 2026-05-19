package com.bgreenNet.bgreenNet.controller;

import java.util.List;
import java.util.Map;
import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.DetalleInsumoDTO;
import com.bgreenNet.bgreenNet.dto.ItemErpDTO;
import com.bgreenNet.bgreenNet.dto.OpDoctoDTO;
import com.bgreenNet.bgreenNet.dto.ReporteProduccionDTO;
import com.bgreenNet.bgreenNet.repository.OpDoctoRepository;
import com.bgreenNet.bgreenNet.services.MetaService;




@RestController
@RequestMapping({"/api/op-docto" , "/op-docto"})
@CrossOrigin(origins = "*") 


public class OpDoctoController {

	 @Autowired
	    private OpDoctoRepository repository;

    @Autowired
    private MetaService metaService;

	 @Autowired
	    private com.bgreenNet.bgreenNet.services.EmailReporteService emailService;

	    @GetMapping
	    public ResponseEntity<?> listarDocumentos() {
	        try {
	            List<OpDoctoDTO> documentos = repository.findAll();
	            return ResponseEntity.ok(documentos);
	        } catch (Exception e) {
	            System.err.println("Error en OpDoctoController.listarDocumentos: " + e.getMessage());
	            e.printStackTrace();
	            return ResponseEntity.status(500).body("Error interno: " + e.getMessage());
	        }
	    }

		@GetMapping("/por-fechas")
		public ResponseEntity<List<OpDoctoDTO>> listarPorFechas(
				@RequestParam String fechaInicio,
				@RequestParam String fechaFin) {
			try {
				LocalDate inicio = LocalDate.parse(fechaInicio);
				LocalDate fin    = LocalDate.parse(fechaFin);
				if (fin.isBefore(inicio)) {
					return ResponseEntity.badRequest().body(null);
				}
				List<OpDoctoDTO> documentos = repository.findByRangoFechas(inicio, fin);
				return ResponseEntity.ok(documentos);
			} catch (Exception e) {
				return ResponseEntity.status(500).body(null);
			}
		}

		@GetMapping("/receptores")
		public ResponseEntity<String> obtenerReceptores() {
			return ResponseEntity.ok(emailService.obtenerReceptoresConfigurados());
		}

		@org.springframework.web.bind.annotation.PutMapping(value = "/receptores", consumes = "text/plain;charset=UTF-8")
		public ResponseEntity<String> actualizarReceptores(
				@org.springframework.web.bind.annotation.RequestBody String nuevosDestinatarios) {
			try {
				emailService.guardarReceptores(nuevosDestinatarios.trim());
				return ResponseEntity.ok("Receptores actualizados");
			} catch (Exception e) {
				return ResponseEntity.status(500).body("Error al guardar receptores: " + e.getMessage());
			}
		}

		@org.springframework.web.bind.annotation.GetMapping("/datos-erp")
		public ResponseEntity<java.util.List<ItemErpDTO>> obtenerDatosERP(@org.springframework.web.bind.annotation.RequestParam String fecha) {
			try {
				java.time.LocalDate ref = java.time.LocalDate.parse(fecha.substring(0, 10));
				ReporteProduccionDTO datos = emailService.obtenerDatosReporte(ref, ref.plusDays(1));
				
				java.util.List<ItemErpDTO> itemsErp = new java.util.ArrayList<>();
				
				// Combinar Biodiesel y Glicerina en una sola lista para el ERP
				java.util.List<DetalleInsumoDTO> todos = new java.util.ArrayList<>();
				if (datos.getItemsBiodiesel() != null) todos.addAll(datos.getItemsBiodiesel());
				if (datos.getItemsGlicerina() != null) todos.addAll(datos.getItemsGlicerina());
				
				// Mapeos ERP desde Base de Datos
				Map<String, Map<String, String>> dbMapeos = metaService.getMapeosERP();

				for (DetalleInsumoDTO det : todos) {
					String idInterno = det.getItem() != null ? det.getItem().trim() : "";
					Map<String, String> mapping = dbMapeos.get(idInterno);
					
					if (mapping == null) continue; // Solo procesar si hay mapeo en DB
					
					String idErp = mapping.get("erp");
					String bwart = mapping.get("bwart") != null ? mapping.get("bwart") : "101";
					
					ItemErpDTO item = new ItemErpDTO();
					item.setMatnr(idErp); // Usar ID mapeado para MATNR
					item.setBwart(bwart); // Asignar BWART mapeado
					item.setMaktx(det.getDescripcion());
					item.setAufnr(det.getOrdenProduccion()); // Usar ID secuencial para AUFNR
					
					java.math.BigDecimal cant = det.getCantidadConsumida() != null ? det.getCantidadConsumida() : java.math.BigDecimal.ZERO;
					
					// Requerimiento especial para Metanol (Item 10): Si es negativo, enviar 0
					if ("10".equals(idInterno) && cant.compareTo(java.math.BigDecimal.ZERO) < 0) {
						cant = java.math.BigDecimal.ZERO;
					}
					
					item.setMenge(String.format("%.3f", cant));
					
					itemsErp.add(item);
				}
				
				return ResponseEntity.ok(itemsErp);
			} catch (Exception e) {
				return ResponseEntity.status(500).body(null);
			}
		}

		@org.springframework.web.bind.annotation.PostMapping("/enviar-reporte")
		public ResponseEntity<String> enviarReporte(@org.springframework.web.bind.annotation.RequestBody java.util.Map<String, String> payload) {
			try {
				String fecha = payload.get("fecha");
				if (fecha == null || fecha.isEmpty()) {
					return ResponseEntity.badRequest().body("Falta el parámetro 'fecha'");
				}
				emailService.enviarReporteParaFecha(fecha);
				return ResponseEntity.ok("Reporte enviado correctamente");
			} catch (Exception e) {
				return ResponseEntity.status(500).body("Error al enviar el reporte: " + e.getMessage());
			}
		}
}
