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
    
    private boolean schemaChecked = false;

    private void ensureSchema() {
        if (schemaChecked) return;
        try {
            // Intentar añadir columnas si no existen (SQL Server syntax)
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'sentido_meta') " +
                                 "ALTER TABLE productos ADD sentido_meta BIT DEFAULT 1");
            
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'usa_suma') " +
                                 "ALTER TABLE productos ADD usa_suma BIT DEFAULT 0");

            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'mostrar_cmi') " +
                                 "ALTER TABLE productos ADD mostrar_cmi BIT DEFAULT 1");

            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'produccion_base_id') " +
                                 "ALTER TABLE productos ADD produccion_base_id VARCHAR(50) DEFAULT '26'");

            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'date_create') " +
                                 "ALTER TABLE productos ADD date_create DATETIME DEFAULT GETDATE()");

            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'meta_diaria_manual') " +
                                 "ALTER TABLE productos ADD meta_diaria_manual BIT DEFAULT 0");

            // Garantizar tabla de componentes y sus columnas
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('producto_componentes') AND type in ('U')) " +
                                 "CREATE TABLE producto_componentes (id INT IDENTITY(1,1), producto_padre_id VARCHAR(50), producto_hijo_siesa_id VARCHAR(50), usa_suma BIT, activo BIT DEFAULT 1)");

            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('producto_componentes') AND name = 'activo') " +
                                 "ALTER TABLE producto_componentes ADD activo BIT DEFAULT 1");
            
            // Garantizar tabla de mapeos ERP (productos_tbs)
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('productos_tbs') AND type in ('U')) " +
                                 "CREATE TABLE productos_tbs (" +
                                 "  id INT IDENTITY(1,1) PRIMARY KEY, " +
                                 "  id_tbs_producto INT NOT NULL, " +
                                 "  id_producto_tbs VARCHAR(50) NOT NULL, " +
                                 "  descripcion VARCHAR(255), " +
                                 "  id_tbs_tipodoc VARCHAR(20), " +
                                 "  datecreate DATETIME DEFAULT GETDATE(), " +
                                 "  datemodify DATETIME DEFAULT GETDATE(), " +
                                 "  usuario_creacion VARCHAR(100), " +
                                 "  estado BIT DEFAULT 1, " +
                                 "  CONSTRAINT FK_productos_tbs_productos FOREIGN KEY (id_tbs_producto) REFERENCES productos(id))");

            // Garantizar tabla de secciones y campos en productos
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('secciones_reporte') AND type in ('U')) " +
                                 "BEGIN " +
                                 "  CREATE TABLE secciones_reporte (id INT PRIMARY KEY, nombre VARCHAR(100)); " +
                                 "  INSERT INTO secciones_reporte (id, nombre) VALUES (1, 'Biodiesel'), (2, 'Glicerina'); " +
                                 "END");

            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'seccion_id') " +
                                 "ALTER TABLE productos ADD seccion_id INT NULL, CONSTRAINT FK_productos_seccion FOREIGN KEY (seccion_id) REFERENCES secciones_reporte(id)");

            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'orden_reporte') " +
                                 "ALTER TABLE productos ADD orden_reporte INT NULL");

            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('productos') AND name = 'formula_operadores') " +
                                 "ALTER TABLE productos ADD formula_operadores VARCHAR(50)");

        } catch (Exception e) {
        }
        schemaChecked = true;
    }

    public List<ProductoDTO> obtenerProductos() {
        ensureSchema();
        
        // 1. Cargar lista base de productos con sus mapeos ERP
        String sql = "SELECT p.id, p.nombre, p.id_producto_siesa, p.sentido_meta, p.usa_suma, p.mostrar_cmi, p.produccion_base_id, p.meta_diaria_manual, " +
                     "p.formula_operadores, p.seccion_id, p.orden_reporte, sr.nombre as seccion_nombre, " +
                     "tbs.id_producto_tbs, tbs.id_tbs_tipodoc, tbs.descripcion as tbs_desc " +
                     "FROM productos p " +
                     "LEFT JOIN secciones_reporte sr ON p.seccion_id = sr.id " +
                     "LEFT JOIN productos_tbs tbs ON TRY_CAST(p.id AS INT) = tbs.id_tbs_producto AND tbs.estado = 1 " +
                     "WHERE p.activo = 1 ORDER BY p.nombre";
        List<Map<String, Object>> productRows = jdbcTemplate.queryForList(sql);

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
                p.setConsumptionDocOrden(new ArrayList<>());
                p.setProductionDocOrden(new ArrayList<>());
                p.setConsumptionDocOrigenIds(new ArrayList<>());
                p.setProductionDocOrigenIds(new ArrayList<>());
                p.setMetaActual(0.0);
                
                // Cargar usa_suma del producto base
                Object usaSumaObj = row.get("usa_suma");
                if (usaSumaObj instanceof Boolean) {
                    p.setUsaSuma((Boolean) usaSumaObj);
                } else if (usaSumaObj instanceof Number) {
                    p.setUsaSuma(((Number) usaSumaObj).intValue() == 1);
                } else {
                    p.setUsaSuma(false);
                }

                // Cargar sentido_meta
                Object sentidoMetaObj = row.get("sentido_meta");
                if (sentidoMetaObj instanceof Boolean) {
                    p.setSentidoMeta((Boolean) sentidoMetaObj);
                } else if (sentidoMetaObj instanceof Number) {
                    p.setSentidoMeta(((Number) sentidoMetaObj).intValue() == 1);
                } else {
                    p.setSentidoMeta(true); // Default Ascending
                }

                // Cargar mostrar_cmi
                Object mostrarCmiObj = row.get("mostrar_cmi");
                if (mostrarCmiObj instanceof Boolean) {
                    p.setMostrarCmi((Boolean) mostrarCmiObj);
                } else if (mostrarCmiObj instanceof Number) {
                    p.setMostrarCmi(((Number) mostrarCmiObj).intValue() == 1);
                } else {
                    p.setMostrarCmi(true); // Default Visible
                }
                
                Object prodBaseIdObj = row.get("produccion_base_id");
                p.setProduccionBaseId(prodBaseIdObj != null ? String.valueOf(prodBaseIdObj) : "26");
                
                // Cargar meta_diaria_manual
                Object mdmObj = row.get("meta_diaria_manual");
                p.setMetaDiariaManual(mdmObj instanceof Boolean ? (Boolean) mdmObj : (mdmObj instanceof Number ? ((Number) mdmObj).intValue() == 1 : false));
                
                // Cargar formula_operadores
                Object formulaOpsObj = row.get("formula_operadores");
                if (formulaOpsObj != null) {
                    String opsStr = String.valueOf(formulaOpsObj);
                    p.setFormulaOperadores(java.util.Arrays.asList(opsStr.split(",")));
                } else {
                    p.setFormulaOperadores(java.util.Arrays.asList("+", "+", "+", "+"));
                }
                
                // Mapeos ERP
                p.setIdProductoTbs(row.get("id_producto_tbs") != null ? String.valueOf(row.get("id_producto_tbs")) : null);
                p.setIdTbsTipoDoc(row.get("id_tbs_tipodoc") != null ? String.valueOf(row.get("id_tbs_tipodoc")) : null);
                p.setTbsDescripcion(row.get("tbs_desc") != null ? String.valueOf(row.get("tbs_desc")) : null);
                
                // Seccion y Orden
                p.setSeccionId(row.get("seccion_id") != null ? ((Number) row.get("seccion_id")).intValue() : null);
                p.setSeccionNombre(row.get("seccion_nombre") != null ? String.valueOf(row.get("seccion_nombre")) : null);
                p.setOrdenReporte(row.get("orden_reporte") != null ? ((Number) row.get("orden_reporte")).intValue() : null);
                
                productosMap.put(id, p);
            }
        }

        // 2. Cargar TODAS las vinculaciones de documentos de forma directa
        String sqlDocs = "SELECT ptd.producto_id, tm.codigo as tipo_mov, td.id as doc_id, td.codigo as doc_cod, ptd.orden as doc_orden, ptd.producto_origen_id " +
                        "FROM producto_tipos_documento ptd " +
                        "JOIN tipo_movimiento tm ON ptd.tipo_movimiento_id = tm.id " +
                        "JOIN tipos_documento td ON ptd.tipo_documento_id = td.id " +
                        "ORDER BY ptd.producto_id, tm.codigo, ptd.orden ASC";
        
        List<Map<String, Object>> docRows = jdbcTemplate.queryForList(sqlDocs);
        for (Map<String, Object> row : docRows) {
            String prodId = String.valueOf(row.get("producto_id"));
            ProductoDTO p = productosMap.get(prodId);
            if (p != null) {
                String tipoMov = String.valueOf(row.get("tipo_mov"));
                String docCod = String.valueOf(row.get("doc_cod"));
                Integer docId = ((Number) row.get("doc_id")).intValue();
                Integer docOrden = row.get("doc_orden") != null ? ((Number) row.get("doc_orden")).intValue() : 0;
                String docOrigen = row.get("producto_origen_id") != null ? String.valueOf(row.get("producto_origen_id")) : null;

                if ("CONSUMO".equals(tipoMov)) {
                    p.getConsumptionDocTypes().add(docCod);
                    p.getConsumptionDocIds().add(docId);
                    p.getConsumptionDocOrden().add(docOrden);
                    p.getConsumptionDocOrigenIds().add(docOrigen);
                } else if ("PRODUCCION".equals(tipoMov)) {
                    p.getProductionDocTypes().add(docCod);
                    p.getProductionDocIds().add(docId);
                    p.getProductionDocOrden().add(docOrden);
                    p.getProductionDocOrigenIds().add(docOrigen);
                }
            }
        }

        // 3. Cargar meta del mes actual
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
        // 4. Cargar componentes de productos compuestos
        try {
            // Usamos OR activo IS NULL para asegurar que no se pierdan datos si la columna se acaba de crear
            String sqlComp = "SELECT producto_padre_id, producto_hijo_siesa_id, usa_suma FROM producto_componentes WHERE activo = 1 OR activo IS NULL";
            List<Map<String, Object>> compRows = jdbcTemplate.queryForList(sqlComp);
            
            for (Map<String, Object> row : compRows) {
                String padreId = String.valueOf(row.get("producto_padre_id"));
                ProductoDTO p = productosMap.get(padreId);
                if (p != null) {
                    if (p.getComponenteSiesaIds() == null) {
                        p.setComponenteSiesaIds(new ArrayList<>());
                    }
                    p.getComponenteSiesaIds().add(String.valueOf(row.get("producto_hijo_siesa_id")));
                    p.setEsCompuesto(true);
                    // El flag usaSuma ahora se carga globalmente desde la tabla productos en el paso 1
                }
            }
        } catch (Exception e) {
            // No bloqueamos la carga de productos si fallan los componentes
        }
        
        // Mark products without components
        for (ProductoDTO p : productosMap.values()) {
            if (p.getEsCompuesto() == null) {
                p.setEsCompuesto(false);
                p.setComponenteSiesaIds(new ArrayList<>());
                // p.setUsaSuma se mantiene como venga de la tabla productos
            }
        }

        return new ArrayList<>(productosMap.values());
    }
    
    
    
    
    public List<MetaDetalleDTO> obtenerMetas(String productoId, int anio) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "EXEC sp_meta_mensual_consultar ?, ?",
            productoId, anio
        );

        List<MetaDetalleDTO> metas = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            int mes = (int) row.get("mes");
            double valor = ((Number) row.get("valor")).doubleValue();
            
            Timestamp tsCreate = (Timestamp) row.get("date_create");
            Timestamp tsModify = (Timestamp) row.get("date_Modify");
            String usuario = (String) row.get("creado_por");
            
            LocalDateTime dateCreate = (tsCreate != null) ? tsCreate.toLocalDateTime() : null;
            LocalDateTime dateModify = (tsModify != null) ? tsModify.toLocalDateTime() : null;

            metas.add(new MetaDetalleDTO(mes, valor, dateCreate, dateModify, usuario));
        }

        return metas;
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

        List<MetaDetalleDTO> metas = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            int mes = (int) row.get("mes");
            double valor = ((Number) row.get("valor")).doubleValue();
            
            Timestamp tsCreate = (Timestamp) row.get("date_create");
            Timestamp tsModify = (Timestamp) row.get("date_Modify");
            String usuario = (String) row.get("creado_por");
            
            LocalDateTime dateCreate = (tsCreate != null) ? tsCreate.toLocalDateTime() : null;
            LocalDateTime dateModify = (tsModify != null) ? tsModify.toLocalDateTime() : null;

            metas.add(new MetaDetalleDTO(mes, valor, dateCreate, dateModify, usuario));
        }

        return metas;
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
        ensureSchema();
        // La columna 'id' NO es IDENTITY — se calcula manualmente como MAX(id) + 1.
        // ISNULL maneja el caso de tabla vacía (devuelve 0, por lo que el primer id será 1).
        Integer nextId = jdbcTemplate.queryForObject(
            "SELECT ISNULL(MAX(TRY_CAST(id AS INT)), 0) + 1 FROM productos",
            Integer.class
        );

        // idProductoSiesa puede llegar como Integer o String desde el frontend
        String idSiesa = producto.getIdProductoSiesa() != null
            ? producto.getIdProductoSiesa().toString()
            : null;

        String sql = "INSERT INTO productos (id, nombre, id_producto_siesa, activo, usa_suma, sentido_meta, mostrar_cmi, produccion_base_id, meta_diaria_manual, formula_operadores, seccion_id, orden_reporte, date_create, date_Modify) " +
                     "VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())";

        jdbcTemplate.update(
            sql,
            nextId,
            producto.getNombre(),
            idSiesa,
            producto.getUsaSuma() != null && producto.getUsaSuma() ? 1 : 0,
            producto.getSentidoMeta() != null && producto.getSentidoMeta() ? 1 : 0,
            producto.getMostrarCmi() != null && producto.getMostrarCmi() ? 1 : 0,
            producto.getProduccionBaseId() != null && !producto.getProduccionBaseId().trim().isEmpty() ? producto.getProduccionBaseId() : null,
            producto.getMetaDiariaManual() != null && producto.getMetaDiariaManual() ? 1 : 0,
            producto.getFormulaOperadores() != null ? String.join(",", producto.getFormulaOperadores()) : "+,+,+,+",
            producto.getSeccionId(),
            producto.getOrdenReporte()
        );

        // Insertar mapeo ERP si existe
        if (producto.getIdProductoTbs() != null && !producto.getIdProductoTbs().isEmpty()) {
            String desc = (producto.getTbsDescripcion() != null && !producto.getTbsDescripcion().isEmpty()) 
                ? producto.getTbsDescripcion() 
                : producto.getNombre();

            jdbcTemplate.update(
                "INSERT INTO productos_tbs (id_tbs_producto, id_producto_tbs, id_tbs_tipodoc, descripcion, datecreate, datemodify, estado) " +
                "VALUES (?, ?, ?, ?, GETDATE(), GETDATE(), 1)",
                nextId, producto.getIdProductoTbs(), producto.getIdTbsTipoDoc(), desc
            );
        }

        return nextId;
    }

    public void actualizarProducto(ProductoDTO producto) {
        ensureSchema();
        try {
            String sql = "UPDATE productos SET nombre = ?, id_producto_siesa = ?, usa_suma = ?, sentido_meta = ?, mostrar_cmi = ?, produccion_base_id = ?, meta_diaria_manual = ?, formula_operadores = ?, seccion_id = ?, orden_reporte = ?, date_Modify = GETDATE() " +
                         "WHERE id = ?";

            String idSiesa = producto.getIdProductoSiesa() != null
                ? producto.getIdProductoSiesa().toString()
                : null;
            
            jdbcTemplate.update(
                sql,
                producto.getNombre(),
                idSiesa,
                producto.getUsaSuma() != null ? producto.getUsaSuma() : false,
                producto.getSentidoMeta() != null ? producto.getSentidoMeta() : true,
                producto.getMostrarCmi() != null ? producto.getMostrarCmi() : true,
                producto.getProduccionBaseId() != null && !producto.getProduccionBaseId().trim().isEmpty() ? producto.getProduccionBaseId() : null,
                producto.getMetaDiariaManual() != null ? producto.getMetaDiariaManual() : false,
                producto.getFormulaOperadores() != null ? String.join(",", producto.getFormulaOperadores()) : "+,+,+,+",
                producto.getSeccionId(),
                producto.getOrdenReporte(),
                producto.getId()
            );

            // Actualizar mapeo ERP
            if (producto.getIdProductoTbs() != null) {
                // Primero desactivar mapeos anteriores
                jdbcTemplate.update("UPDATE productos_tbs SET estado = 0 WHERE id_tbs_producto = ?", producto.getId());
                
                // Insertar nuevo si no está vacío
                if (!producto.getIdProductoTbs().isEmpty()) {
                    String desc = (producto.getTbsDescripcion() != null && !producto.getTbsDescripcion().isEmpty()) 
                        ? producto.getTbsDescripcion() 
                        : producto.getNombre();

                    jdbcTemplate.update(
                        "INSERT INTO productos_tbs (id_tbs_producto, id_producto_tbs, id_tbs_tipodoc, descripcion, datecreate, datemodify, estado) " +
                        "VALUES (?, ?, ?, ?, GETDATE(), GETDATE(), 1)",
                        producto.getId(), producto.getIdProductoTbs(), producto.getIdTbsTipoDoc(), desc
                    );
                }
            }
        } catch (Exception e) {
            throw e; // Relanzar para que el Controller devuelva 500
        }
    }

    public void eliminarTiposDocumentoPorProducto(String productoId) {
        String sql = "DELETE FROM producto_tipos_documento WHERE producto_id = ?";
        jdbcTemplate.update(sql, productoId);
    }

 
        // According to user provided SQL, the SP name is sp_producto_tipo_doc_insertar
    public void insertarTipoDocumento(String productoId, String tipoMov, String tipoDoc, int orden, String productoOrigenId) {
        String sql = "INSERT INTO producto_tipos_documento (producto_id, tipo_movimiento_id, tipo_documento_id, orden, producto_origen_id) " +
                     "VALUES (?, ?, ?, ?, ?)";
        
        jdbcTemplate.update(
            sql,
            new Object[]{ productoId, tipoMov, tipoDoc, orden, productoOrigenId },
            new int[]{ java.sql.Types.VARCHAR, java.sql.Types.VARCHAR, java.sql.Types.VARCHAR, java.sql.Types.INTEGER, java.sql.Types.VARCHAR }
        );
    }

    // =============================
    // CATALOGOS
    // =============================
    public List<Map<String, Object>> obtenerTiposDocumento() {
        return jdbcTemplate.queryForList("SELECT id, codigo, descripcion, estado FROM tipos_documento ORDER BY codigo");
    }

    public void guardarTipoDocumento(Integer id, String codigo, String descripcion, String estado) {
        if (estado == null || estado.isEmpty()) {
            estado = "Activo"; // Default
        }
        if (id == null) {
            jdbcTemplate.update("INSERT INTO tipos_documento (codigo, descripcion, estado) VALUES (?, ?, ?)", codigo, descripcion, estado);
        } else {
            jdbcTemplate.update("UPDATE tipos_documento SET codigo = ?, descripcion = ?, estado = ? WHERE id = ?", codigo, descripcion, estado, id);
        }
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

    // =============================
    // COMPONENTES DE PRODUCTOS
    // =============================
    public List<Map<String, Object>> obtenerComponentes(String productoId) {
        String sql = "SELECT id, producto_hijo_siesa_id, usa_suma FROM producto_componentes WHERE producto_padre_id = ? AND activo = 1";
        return jdbcTemplate.queryForList(sql, productoId);
    }

    public void eliminarComponentes(String productoId) {
        jdbcTemplate.update("DELETE FROM producto_componentes WHERE producto_padre_id = ?", productoId);
    }

    public void insertarComponente(String padreId, String hijoSiesaId, boolean usaSuma) {
        String sql = "INSERT INTO producto_componentes (producto_padre_id, producto_hijo_siesa_id, usa_suma, activo) VALUES (?, ?, ?, 1)";
        jdbcTemplate.update(sql, padreId, hijoSiesaId, usaSuma ? 1 : 0);
    }

    public List<Map<String, Object>> obtenerSecciones() {
        return jdbcTemplate.queryForList("SELECT id, nombre FROM secciones_reporte ORDER BY id");
    }
}
