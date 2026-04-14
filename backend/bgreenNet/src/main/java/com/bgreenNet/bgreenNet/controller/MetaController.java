package com.bgreenNet.bgreenNet.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
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
@RequestMapping("/api")
@CrossOrigin("*")
public class MetaController {
	
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
    public void guardarMeta(@RequestBody Map<String, Object> body) {
        service.guardarMeta(
            (String) body.get("productoId"),
            (int) body.get("anio"),
            (int) body.get("mes"),
            Double.parseDouble(body.get("valor").toString()),
            (String) body.get("usuario")
        );
    }

    // =============================
    // COSTO DIRECTO
    // =============================
    @GetMapping("/metas/consultar_costo-directo")
    public MetaResponseDTO getCosto(@RequestParam int anio) {
        return service.getCostoDirecto(anio);
    }

    @PostMapping("/metas/agregar_costo-directo")
    public void guardarCosto(@RequestBody Map<String, Object> body) {
        service.guardarCosto(
            (int) body.get("anio"),
            (int) body.get("mes"),
            Double.parseDouble(body.get("valor").toString()),
            (String) body.get("usuario")
        );
    }

    // =============================
    // GESTION PRODUCTOS
    // =============================
    @PostMapping("/productos/insertar")
    public void insertarProducto(@RequestBody ProductoDTO producto) {
        service.insertarProducto(producto);
    }

    @PostMapping("/productos/actualizar")
    public void actualizarProducto(@RequestBody ProductoDTO producto) {
        service.actualizarProducto(producto);
    }

    @PostMapping("/productos/tipo-documento")
    public void insertarTipoDocumento(@RequestBody Map<String, Object> body) {
        service.insertarTipoDocumento(
            (String) body.get("productoId"),
            (String) body.get("tipoMovimiento"),
            (String) body.get("tipoDocumento")
        );
    }

    // =============================
    // CATALOGOS
    // =============================
    @GetMapping("/catalogos/tipos-documento")
    public List<Map<String, Object>> getTiposDocumento() {
        return service.getTiposDocumento();
    }

    @GetMapping("/catalogos/tipos-movimiento")
    public List<Map<String, Object>> getTiposMovimiento() {
        return service.getTiposMovimiento();
    }

}
