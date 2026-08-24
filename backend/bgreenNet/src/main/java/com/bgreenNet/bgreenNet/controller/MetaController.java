package com.bgreenNet.bgreenNet.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.bgreenNet.bgreenNet.dto.MetaResponseDTO;
import com.bgreenNet.bgreenNet.dto.ProductoDTO;
import com.bgreenNet.bgreenNet.services.MetaService;

@RestController
@RequestMapping({"/api", ""})
@CrossOrigin("*")
public class MetaController {
	
	private static final Logger log = LoggerFactory.getLogger(MetaController.class);
	
	@Autowired
    private MetaService service;

    // =============================
    // PRODUCTOS
    // =============================
    @GetMapping("/productos")
    public List<ProductoDTO> getProductos() {
        return service.getProductos();
    }

    // =============================
    // METAS
    // =============================
    @GetMapping("/obtener_metas")
    public MetaResponseDTO getMetas(
            @RequestParam String producto,
            @RequestParam int anio) {
        return service.getMetas(producto, anio);
    }

    @PostMapping("/agregar_metas")
    public ResponseEntity<?> guardarMeta(@RequestBody Map<String, Object> body) {
        try {
            service.guardarMeta(
                (String) body.get("productoId"),
                (int) body.get("anio"),
                (int) body.get("mes"),
                Double.parseDouble(body.get("valor").toString()),
                (String) body.get("usuario")
            );
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            log.error("[guardarMeta] ERROR: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // =============================
    // COSTO DIRECTO
    // =============================
    @GetMapping("/metas/consultar_costo-directo")
    public MetaResponseDTO getCosto(@RequestParam int anio) {
        return service.getCostoDirecto(anio);
    }

    @PostMapping("/metas/agregar_costo-directo")
    public ResponseEntity<?> guardarCosto(@RequestBody Map<String, Object> body) {
        try {
            service.guardarCosto(
                (int) body.get("anio"),
                (int) body.get("mes"),
                Double.parseDouble(body.get("valor").toString()),
                (String) body.get("usuario")
            );
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            log.error("[guardarCosto] ERROR: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // =============================
    // GESTION PRODUCTOS
    // =============================
    @PostMapping("/productos/insertar")
    public ResponseEntity<?> insertarProducto(@RequestBody ProductoDTO producto) {
        try {
            log.info("[insertarProducto] Recibido: nombre={}, idSiesa={}", producto.getNombre(), producto.getIdProductoSiesa());
            int newId = service.insertarProducto(producto);
            log.info("[insertarProducto] Creado con id={}", newId);
            return ResponseEntity.ok(Map.of("id", newId));
        } catch (Exception e) {
            log.error("[insertarProducto] ERROR: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/productos/actualizar")
    public ResponseEntity<?> actualizarProducto(@RequestBody ProductoDTO producto) {
        try {
            log.info("[actualizarProducto] Actualizando producto id={}, nombre={}, sentidoMeta={}", 
                producto.getId(), producto.getNombre(), producto.getSentidoMeta());
            service.actualizarProducto(producto);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            log.error("[actualizarProducto] ERROR: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/productos/tipo-documento")
    public ResponseEntity<?> insertarTipoDocumento(@RequestBody Map<String, Object> body) {
        try {
            int orden = body.get("orden") != null ? Integer.parseInt(body.get("orden").toString()) : 0;
            String productoOrigenId = body.get("productoOrigenId") != null ? body.get("productoOrigenId").toString() : null;
            service.insertarTipoDocumento(
                (String) body.get("productoId"),
                (String) body.get("tipoMovimiento"),
                (String) body.get("tipoDocumento"),
                orden,
                productoOrigenId
            );
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            log.error("[insertarTipoDocumento] ERROR: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }

    @DeleteMapping("/productos/tipo-documento")
    public void eliminarTipoDocumento(@RequestParam String productoId) {
        service.eliminarTiposDocumentoPorProducto(productoId);
    }

    // =============================
    // CATALOGOS
    // =============================
    @GetMapping("/catalogos/tipos-documento")
    public List<Map<String, Object>> getTiposDocumento() {
        return service.getTiposDocumento();
    }

    @PostMapping("/catalogos/tipos-documento")
    public ResponseEntity<?> guardarTipoDocumento(@RequestBody Map<String, Object> body) {
        try {
            Integer id = null;
            if (body.get("id") != null && !body.get("id").toString().isEmpty()) {
                id = Integer.parseInt(body.get("id").toString());
            }
            String codigo = (String) body.get("codigo");
            String descripcion = (String) body.get("descripcion");
            String estado = (String) body.get("estado");
            
            service.guardarTipoDocumento(id, codigo, descripcion, estado);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            log.error("[guardarTipoDocumento] ERROR: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/catalogos/tipos-movimiento")
    public List<Map<String, Object>> getTiposMovimiento() {
        return service.getTiposMovimiento();
    }

    @GetMapping("/catalogos/secciones-reporte")
    public List<Map<String, Object>> getSeccionesReporte() {
        return service.getSecciones();
    }

    // =============================
    // VALIDACION SIESA
    // =============================
    @GetMapping("/siesa/validar")
    public Map<String, Object> validarEnSiesa(@RequestParam(required = false) String id) {
        if (id == null || id.isEmpty()) {
            return null;
        }
        return service.validarProductoEnSiesa(id);
    }

    // =============================
    // COMPONENTES DE PRODUCTOS
    // =============================
    @GetMapping("/productos/componentes")
    public List<Map<String, Object>> getComponentes(@RequestParam String productoId) {
        return service.getComponentes(productoId);
    }

    @PostMapping("/productos/componentes")
    public ResponseEntity<?> guardarComponentes(@RequestBody Map<String, Object> body) {
        try {
            String productoId = (String) body.get("productoId");
            @SuppressWarnings("unchecked")
            List<String> componentes = (List<String>) body.get("componentes");
            boolean usaSuma = body.get("usaSuma") != null && (boolean) body.get("usaSuma");

            // Delete-all + re-insert
            service.eliminarComponentes(productoId);
            if (componentes != null) {
                for (String hijoSiesaId : componentes) {
                    service.insertarComponente(productoId, hijoSiesaId, usaSuma);
                }
            }
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            log.error("[guardarComponentes] ERROR: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/productos/componentes")
    public void eliminarComponentes(@RequestParam String productoId) {
        service.eliminarComponentes(productoId);
    }
}
