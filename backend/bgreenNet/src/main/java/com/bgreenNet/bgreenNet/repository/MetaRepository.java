package com.bgreenNet.bgreenNet.repository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.dto.MetaDetalleDTO;
import com.bgreenNet.bgreenNet.dto.ProductoDTO;
import java.time.LocalDateTime;
import java.sql.Timestamp;

@Repository
public class MetaRepository {
	
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MetaRepository.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    @Qualifier("siesaJdbcTemplate")
    private JdbcTemplate siesaJdbcTemplate;
    
    public List<ProductoDTO> obtenerProductos() {
        log.info(">>> Iniciando carga robusta de productos...");
        
        // 1. Cargar lista base de productos
        List<Map<String, Object>> productRows = jdbcTemplate.queryForList("EXEC sp_producto_configuracion");
        Map<String, ProductoDTO> productosMap = new HashMap<>();

        for (Map<String, Object> row : productRows) {
            Object rawId = row.get("id");
            if (rawId == null) continue;
            String id = String.valueOf(rawId);

            if (!productosMap.containsKey(id)) {
                ProductoDTO p = new ProductoDTO();
                p.setId(id);
                p.setNombre(row.get("nombre") != null ? String.valueOf(row.get("nombre")) : "Sin nombre");
                p.setIdProductoSiesa(row.get("id_producto_siesa"));
                p.setConsumptionDocTypes(new ArrayList<>());
                p.setProductionDocTypes(new ArrayList<>());
                p.setConsumptionDocIds(new ArrayList<>());
                p.setProductionDocIds(new ArrayList<>());
                p.setMetaActual(0.0);
                productosMap.put(id, p);
            }
        }

        // 2. Cargar TODAS las vinculaciones de documentos de forma directa
        log.info(">>> Cargando vinculaciones de documentos directas...");
        String sqlDocs = "SELECT ptd.producto_id, tm.codigo as tipo_mov, td.id as doc_id, td.codigo as doc_cod " +
                        "FROM producto_tipos_documento ptd " +
                        "JOIN tipo_movimiento tm ON ptd.tipo_movimiento_id = tm.id " +
                        "JOIN tipos_documento td ON ptd.tipo_documento_id = td.id";
        
        List<Map<String, Object>> docRows = jdbcTemplate.queryForList(sqlDocs);
        for (Map<String, Object> row : docRows) {
            String prodId = String.valueOf(row.get("producto_id"));
            ProductoDTO p = productosMap.get(prodId);
            if (p != null) {
                String tipoMov = String.valueOf(row.get("tipo_mov"));
                String docCod = String.valueOf(row.get("doc_cod"));
                Integer docId = ((Number) row.get("doc_id")).intValue();

                if ("CONSUMO".equals(tipoMov)) {
                    if (!p.getConsumptionDocTypes().contains(docCod)) p.getConsumptionDocTypes().add(docCod);
                    if (!p.getConsumptionDocIds().contains(docId)) p.getConsumptionDocIds().add(docId);
                } else if ("PRODUCCION".equals(tipoMov)) {
                    if (!p.getProductionDocTypes().contains(docCod)) p.getProductionDocTypes().add(docCod);
                    if (!p.getProductionDocIds().contains(docId)) p.getProductionDocIds().add(docId);
                }
            }
        }

        // 3. Cargar meta del mes actual
        log.info(">>> Cargando metas del mes actual...");
        int mesActual = LocalDateTime.now().getMonthValue();
        int anioActual = LocalDateTime.now().getYear();
        
        String sqlMetas = "SELECT producto_id, valor FROM metas_mensuales WHERE anio = ? AND mes = ?";
        List<Map<String, Object>> metaRows = jdbcTemplate.queryForList(sqlMetas, anioActual, mesActual);
        
        for (Map<String, Object> row : metaRows) {
            String prodId = String.valueOf(row.get("producto_id"));
            ProductoDTO p = productosMap.get(prodId);
            if (p != null) {
                p.setMetaActual(((Number) row.get("valor")).doubleValue());
            }
        }

        log.info(">>> Carga finalizada. Productos: {}", productosMap.size());
        return new ArrayList<>(productosMap.values());
    }
    
    
    
    
    public List<MetaDetalleDTO> obtenerMetas(String productoId, int anio) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "EXEC sp_meta_mensual_consultar ?, ?",
            productoId, anio
        );

        MetaDetalleDTO[] meses = new MetaDetalleDTO[12];
        for (int i = 0; i < 12; i++) {
            meses[i] = new MetaDetalleDTO(0.0, null, null, null);
        }

        for (Map<String, Object> row : rows) {
            int mes = (int) row.get("mes");
            double valor = ((Number) row.get("valor")).doubleValue();
            
            Timestamp tsCreate = (Timestamp) row.get("date_create");
            Timestamp tsModify = (Timestamp) row.get("date_Modify");
            String usuario = (String) row.get("creado_por");
            
            LocalDateTime dateCreate = (tsCreate != null) ? tsCreate.toLocalDateTime() : null;
            LocalDateTime dateModify = (tsModify != null) ? tsModify.toLocalDateTime() : null;

            meses[mes - 1] = new MetaDetalleDTO(valor, dateCreate, dateModify, usuario);
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
            meses[i] = new MetaDetalleDTO(0.0, null, null, null);
        }

        for (Map<String, Object> row : rows) {
            int mes = (int) row.get("mes");
            double valor = ((Number) row.get("valor")).doubleValue();
            
            Timestamp tsCreate = (Timestamp) row.get("date_create");
            Timestamp tsModify = (Timestamp) row.get("date_Modify");
            String usuario = (String) row.get("creado_por");
            
            LocalDateTime dateCreate = (tsCreate != null) ? tsCreate.toLocalDateTime() : null;
            LocalDateTime dateModify = (tsModify != null) ? tsModify.toLocalDateTime() : null;

            meses[mes - 1] = new MetaDetalleDTO(valor, dateCreate, dateModify, usuario);
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
    public int insertarProducto(ProductoDTO producto) {
        // La columna 'id' NO es IDENTITY — se calcula manualmente como MAX(id) + 1.
        // ISNULL maneja el caso de tabla vacía (devuelve 0, por lo que el primer id será 1).
        Integer nextId = jdbcTemplate.queryForObject(
            "SELECT ISNULL(MAX(id), 0) + 1 FROM productos",
            Integer.class
        );

        // idProductoSiesa puede llegar como Integer o String desde el frontend
        String idSiesa = producto.getIdProductoSiesa() != null
            ? producto.getIdProductoSiesa().toString()
            : null;

        String sql = "INSERT INTO productos (id, nombre, id_producto_siesa, activo, date_create, date_Modify) " +
                     "VALUES (?, ?, ?, 1, GETDATE(), GETDATE())";

        jdbcTemplate.update(
            sql,
            nextId,
            producto.getNombre(),
            idSiesa
        );

        return nextId;
    }

    public void actualizarProducto(ProductoDTO producto) {
        String sql = "UPDATE productos SET nombre = ?, id_producto_siesa = ?, date_Modify = GETDATE() " +
                     "WHERE id = ?";

        String idSiesa = producto.getIdProductoSiesa() != null
            ? producto.getIdProductoSiesa().toString()
            : null;
        
        jdbcTemplate.update(
            sql,
            producto.getNombre(),
            idSiesa,
            producto.getId()
        );
    }

    public void eliminarTiposDocumentoPorProducto(String productoId) {
        String sql = "DELETE FROM producto_tipos_documento WHERE producto_id = ?";
        jdbcTemplate.update(sql, productoId);
    }

 
        // According to user provided SQL, the SP name is sp_producto_tipo_doc_insertar
    public void insertarTipoDocumento(String productoId, String tipoMov, String tipoDoc) {
        String sql = "INSERT INTO producto_tipos_documento (producto_id, tipo_movimiento_id, tipo_documento_id) " +
                     "VALUES (?, ?, ?)";
        
        jdbcTemplate.update(
            sql,
            productoId,
            tipoMov,
            tipoDoc
        );
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

    // =============================
    // VALIDACION SIESA
    // =============================
    public Map<String, Object> validarProductoEnSiesa(String idProductoSiesa) {
        String sql = "SELECT f120_id as id, f120_descripcion as nombre FROM t120_mc_items WHERE f120_id_cia = 2 AND f120_id = ?";
        List<Map<String, Object>> results = siesaJdbcTemplate.queryForList(sql, idProductoSiesa);
        
        return results.isEmpty() ? null : results.get(0);
    }
}
