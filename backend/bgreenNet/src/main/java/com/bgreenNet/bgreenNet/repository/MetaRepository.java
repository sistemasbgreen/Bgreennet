package com.bgreenNet.bgreenNet.repository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.dto.MetaDetalleDTO;
import com.bgreenNet.bgreenNet.dto.ProductoDTO;
import java.time.LocalDateTime;
import java.sql.Timestamp;

@Repository
public class MetaRepository {
	

    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    public List<ProductoDTO> obtenerProductos() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList("EXEC sp_producto_configuracion");

        Map<String, ProductoDTO> productosMap = new HashMap<>();

        for (Map<String, Object> row : rows) {
            String id = (String) row.get("id");

            ProductoDTO producto = productosMap.get(id);
            if (producto == null) {
                producto = new ProductoDTO();
                producto.setId(id);
                producto.setNombre((String) row.get("nombre"));
                producto.setIdProductoSiesa((String) row.get("id_producto_siesa"));
                producto.setConsumptionDocTypes(new ArrayList<>());
                producto.setProductionDocTypes(new ArrayList<>());
                productosMap.put(id, producto);
            }

            String tipoMov = (String) row.get("tipo_movimiento");
            String tipoDoc = (String) row.get("tipo_documento");

            if (tipoMov != null && tipoDoc != null) {
                if (tipoMov.equals("CONSUMO")) {
                    producto.getConsumptionDocTypes().add(tipoDoc);
                } else {
                    producto.getProductionDocTypes().add(tipoDoc);
                }
            }

            productosMap.put(id, producto);
        }

        return new ArrayList<>(productosMap.values());
    }
    
    
    
    
    public List<MetaDetalleDTO> obtenerMetas(String productoId, int anio) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "EXEC sp_meta_mensual_consultar ?, ?",
            productoId, anio
        );

        MetaDetalleDTO[] meses = new MetaDetalleDTO[12];
        for (int i = 0; i < 12; i++) {
            meses[i] = new MetaDetalleDTO(0.0, null, null);
        }

        for (Map<String, Object> row : rows) {
            int mes = (int) row.get("mes");
            double valor = ((Number) row.get("valor")).doubleValue();
            
            Timestamp tsCreate = (Timestamp) row.get("date_create");
            Timestamp tsModify = (Timestamp) row.get("date_Modify");
            
            LocalDateTime dateCreate = (tsCreate != null) ? tsCreate.toLocalDateTime() : null;
            LocalDateTime dateModify = (tsModify != null) ? tsModify.toLocalDateTime() : null;

            meses[mes - 1] = new MetaDetalleDTO(valor, dateCreate, dateModify);
        }

        return Arrays.asList(meses);
    }
    
    
    public void guardarMeta(String productoId, int anio, int mes, double valor, String usuario) {
        jdbcTemplate.update(
            "EXEC sp_meta_mensual_guardar ?, ?, ?, ?, ?",
            productoId, anio, mes, valor, usuario
        );
    }
    
    
    public List<MetaDetalleDTO> obtenerCostoDirecto(int anio) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "EXEC sp_meta_costo_consultar ?",
            anio
        );

        MetaDetalleDTO[] meses = new MetaDetalleDTO[12];
        for (int i = 0; i < 12; i++) {
            meses[i] = new MetaDetalleDTO(0.0, null, null);
        }

        for (Map<String, Object> row : rows) {
            int mes = (int) row.get("mes");
            double valor = ((Number) row.get("valor")).doubleValue();
            
            Timestamp tsCreate = (Timestamp) row.get("date_create");
            Timestamp tsModify = (Timestamp) row.get("date_Modify");
            
            LocalDateTime dateCreate = (tsCreate != null) ? tsCreate.toLocalDateTime() : null;
            LocalDateTime dateModify = (tsModify != null) ? tsModify.toLocalDateTime() : null;

            meses[mes - 1] = new MetaDetalleDTO(valor, dateCreate, dateModify);
        }

        return Arrays.asList(meses);
    }

    
    
    public void guardarCosto(int anio, int mes, double valor, String usuario) {
        jdbcTemplate.update(
            "EXEC sp_meta_costo_guardar ?, ?, ?, ?",
            anio, mes, valor, usuario
        );
    }

    // =============================
    // GESTION PRODUCTOS
    // =============================
    public void insertarProducto(ProductoDTO producto) {
        Object idSiesa = (producto.getIdProductoSiesa() != null) ? producto.getIdProductoSiesa() : null;
        jdbcTemplate.update(
            "EXEC sp_productos_insertar ?, ?, ?",
            producto.getNombre(),
            idSiesa,
            "ADMIN"
        );
    }

    public void actualizarProducto(ProductoDTO producto) {
        Object idSiesa = (producto.getIdProductoSiesa() != null) ? producto.getIdProductoSiesa() : null;
        int idInt = Integer.parseInt(producto.getId());
        jdbcTemplate.update(
            "EXEC sp_productos_actualizar ?, ?, ?, ?",
            idInt,
            producto.getNombre(),
            idSiesa,
            "ADMIN"
        );
    }

    public void insertarTipoDocumento(String productoId, String tipoMovimiento, String tipoDocumento) {
        // According to user provided SQL, the SP name is sp_producto_tipo_doc_insertar
        // and expects @producto_id, @tipo_documento_id, @tipo_movimiento_id (all INT)
        
        try {
            Integer idP = (productoId != null && !productoId.isEmpty()) ? Integer.parseInt(productoId) : null;
            Integer idDoc = (tipoDocumento != null && !tipoDocumento.isEmpty()) ? Integer.parseInt(tipoDocumento) : null;
            Integer idMov = (tipoMovimiento != null && !tipoMovimiento.isEmpty()) ? Integer.parseInt(tipoMovimiento) : null;
            
            jdbcTemplate.update(
                "EXEC sp_producto_tipo_doc_insertar ?, ?, ?",
                idP,
                idDoc,
                idMov
            );
        } catch (NumberFormatException e) {
            // Handle cases like 'CostoDirecto' which might not be numeric
            System.err.println("Error parsing IDs to Integer: " + e.getMessage());
            throw e;
        }
    }

    // =============================
    // CATALOGOS
    // =============================
    public List<Map<String, Object>> obtenerTiposDocumento() {
        return jdbcTemplate.queryForList("SELECT id, codigo, descripcion FROM tipos_documento ORDER BY codigo");
    }

    public List<Map<String, Object>> obtenerTiposMovimiento() {
        return jdbcTemplate.queryForList("SELECT id, codigo, descripcion FROM tipo_movimiento ORDER BY codigo");
    }
}
