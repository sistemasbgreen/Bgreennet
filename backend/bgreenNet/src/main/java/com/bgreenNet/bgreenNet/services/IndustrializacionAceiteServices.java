package com.bgreenNet.bgreenNet.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.IndustrializacionDetalleDTO;
import com.bgreenNet.bgreenNet.dto.IndustrializacionProveedorConfigDTO;
import com.bgreenNet.bgreenNet.dto.ProveedorAvanceDTO;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class IndustrializacionAceiteServices {

    @Autowired
    private JdbcTemplate jdbcTemplate; // Primary DB for configuration tables

    private final JdbcTemplate siesaJdbcTemplate; // SIESA DB

    private boolean schemaChecked = false;

    private static final String[] MESES_NOMBRES = {
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    };

    public IndustrializacionAceiteServices(@Qualifier("siesaJdbcTemplate") JdbcTemplate siesaJdbcTemplate) {
        this.siesaJdbcTemplate = siesaJdbcTemplate;
    }

    private synchronized void ensureSchema() {
        if (schemaChecked) return;
        try {
            if (jdbcTemplate != null) {
                // Table for general config
                jdbcTemplate.execute(
                    "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('cmi_industrializacion_config') AND type in ('U')) " +
                    "CREATE TABLE cmi_industrializacion_config (" +
                    "   id INT IDENTITY(1,1) PRIMARY KEY," +
                    "   meta_anual DECIMAL(18,2) DEFAULT 150000.0," +
                    "   date_update DATETIME DEFAULT GETDATE()" +
                    ")"
                );

                // Insert default config if empty
                Integer countConfig = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM cmi_industrializacion_config", Integer.class);
                if (countConfig == null || countConfig == 0) {
                    jdbcTemplate.execute("INSERT INTO cmi_industrializacion_config (meta_anual) VALUES (150000.0)");
                }

                // Table for configured suppliers
                jdbcTemplate.execute(
                    "IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID('cmi_industrializacion_proveedores') AND type in ('U')) " +
                    "CREATE TABLE cmi_industrializacion_proveedores (" +
                    "   id INT IDENTITY(1,1) PRIMARY KEY," +
                    "   nit VARCHAR(50) NOT NULL UNIQUE," +
                    "   nombre VARCHAR(150) NOT NULL," +
                    "   activo BIT DEFAULT 1," +
                    "   orden INT DEFAULT 0," +
                    "   date_create DATETIME DEFAULT GETDATE()" +
                    ")"
                );

                // Insert default suppliers if empty
                Integer countProv = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM cmi_industrializacion_proveedores", Integer.class);
                if (countProv == null || countProv == 0) {
                    jdbcTemplate.update("INSERT INTO cmi_industrializacion_proveedores (nit, nombre, activo, orden) VALUES (?, ?, 1, 1)", "900012728", "Palmaceite SA");
                    jdbcTemplate.update("INSERT INTO cmi_industrializacion_proveedores (nit, nombre, activo, orden) VALUES (?, ?, 1, 2)", "824006708", "Palmagro SA");
                    jdbcTemplate.update("INSERT INTO cmi_industrializacion_proveedores (nit, nombre, activo, orden) VALUES (?, ?, 1, 3)", "900486803", "Palmicultores del Norte");
                    jdbcTemplate.update("INSERT INTO cmi_industrializacion_proveedores (nit, nombre, activo, orden) VALUES (?, ?, 1, 4)", "901047298", "Vadaga SAS");
                    jdbcTemplate.update("INSERT INTO cmi_industrializacion_proveedores (nit, nombre, activo, orden) VALUES (?, ?, 1, 5)", "802005075", "Proveedor 802005075");
                }
            }
            schemaChecked = true;
        } catch (Exception e) {
            System.err.println("⚠ [IndustrializacionAceite] Error asegurando esquema: " + e.getMessage());
        }
    }

    public Double obtenerMetaAnual() {
        ensureSchema();
        try {
            Double meta = jdbcTemplate.queryForObject("SELECT TOP 1 meta_anual FROM cmi_industrializacion_config ORDER BY id DESC", Double.class);
            return meta != null ? meta : 150000.0;
        } catch (Exception e) {
            return 150000.0;
        }
    }

    public List<IndustrializacionProveedorConfigDTO> obtenerProveedoresConfigured(boolean soloActivos) {
        ensureSchema();
        try {
            String sql = "SELECT id, nit, nombre, activo, orden FROM cmi_industrializacion_proveedores " +
                         (soloActivos ? "WHERE activo = 1 " : "") +
                         "ORDER BY orden ASC, nombre ASC";
            return jdbcTemplate.query(sql, (rs, rowNum) -> new IndustrializacionProveedorConfigDTO(
                rs.getInt("id"),
                rs.getString("nit"),
                rs.getString("nombre"),
                rs.getBoolean("activo"),
                rs.getInt("orden")
            ));
        } catch (Exception e) {
            System.err.println("⚠ [IndustrializacionAceite] Error obteniendo proveedores config: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public IndustrializacionDetalleDTO obtenerIndicadorDetalle(Integer year, Integer month) {
        ensureSchema();

        if (year == null || year <= 0) year = Calendar.getInstance().get(Calendar.YEAR);
        if (month == null || month < 1 || month > 12) month = Calendar.getInstance().get(Calendar.MONTH) + 1;

        Double metaAnual = obtenerMetaAnual();
        Double metaMensual = metaAnual / 12.0;

        List<IndustrializacionProveedorConfigDTO> proveedoresConfig = obtenerProveedoresConfigured(true);
        List<String> nitsActivos = proveedoresConfig.stream().map(IndustrializacionProveedorConfigDTO::getNit).collect(Collectors.toList());

        Map<String, String> nombrePorNitMap = new HashMap<>();
        for (IndustrializacionProveedorConfigDTO p : proveedoresConfig) {
            nombrePorNitMap.put(p.getNit().trim(), p.getNombre());
        }

        IndustrializacionDetalleDTO dto = new IndustrializacionDetalleDTO();
        dto.setAnio(year);
        dto.setMes(month);
        dto.setNombreMes(month >= 1 && month <= 12 ? MESES_NOMBRES[month] : "");
        dto.setMetaAnual(metaAnual);
        dto.setMetaMensual(metaMensual);
        dto.setMesesTranscurridos(month);

        if (nitsActivos.isEmpty()) {
            dto.setToneladasMes(0.0);
            dto.setAvanceMesPorcentaje(0.0);
            dto.setPendienteMes(metaMensual);
            dto.setToneladasAcumuladasYTD(0.0);
            dto.setAvanceAnualPorcentaje(0.0);
            dto.setPendienteAnual(metaAnual);
            dto.setResultado(0.0);
            return dto;
        }

        String fechaInicio = year + "-01-01";
        String fechaFin = (year + 1) + "-01-01";

        // Query SIESA suministrada por el usuario
        String inSql = String.join(",", Collections.nCopies(nitsActivos.size(), "?"));
        String sql = String.format("""
            SELECT 
                ter.f200_nit AS f200_nit,
                ter.f200_razon_social AS f200_razon_social,
                MONTH(doc.f350_fecha) AS Mes,
                SUM(mov.f470_cant_base) AS Total_Cantidad
            FROM [t124_mc_items_referencias]
            LEFT JOIN [t120_mc_items] item
                ON f120_rowid = f124_rowid_item
            INNER JOIN [t121_mc_items_extensiones]
                ON f121_rowid_item = f120_rowid
            INNER JOIN [t470_cm_movto_invent] mov
                ON mov.f470_rowid_item_ext = f121_rowid
            INNER JOIN [t350_co_docto_contable] doc
                ON doc.f350_rowid = mov.f470_rowid_docto
            INNER JOIN [t150_mc_bodegas] bod
                ON bod.f150_rowid = mov.f470_rowid_bodega
            INNER JOIN t200_mm_terceros ter
                ON ter.f200_rowid = doc.f350_rowid_tercero
            WHERE 
                f120_id_cia = 2
                AND f200_nit IN (%s)
                AND f350_ind_estado = 1
                AND f120_id IN ('8')
                AND f350_id_tipo_docto IN ('EC','AC')
                AND YEAR(doc.f350_fecha) = ?
            GROUP BY 
                ter.f200_nit,
                ter.f200_razon_social,
                MONTH(doc.f350_fecha)
            ORDER BY 
                ter.f200_nit,
                Mes
        """, inSql);

        List<Object> params = new ArrayList<>(nitsActivos);
        params.add(year);

        Map<String, Map<Integer, Double>> toneladasPorNitYMes = new HashMap<>();

        try {
            List<Map<String, Object>> rows = siesaJdbcTemplate.queryForList(sql, params.toArray());
            for (Map<String, Object> r : rows) {
                String nit = r.get("f200_nit") != null ? r.get("f200_nit").toString().trim() : "";
                String razonSocial = r.get("f200_razon_social") != null ? r.get("f200_razon_social").toString().trim() : nit;
                int mNum = r.get("Mes") != null ? ((Number) r.get("Mes")).intValue() : 0;
                double valCant = r.get("Total_Cantidad") != null ? ((Number) r.get("Total_Cantidad")).doubleValue() : 0.0;

                // Si la cantidad viene en Kilogramos (ej. 5.082.000 Kg), la convertimos a Toneladas (/ 1000)
                double tons = valCant > 500000.0 ? (valCant / 1000.0) : valCant;

                if (!nombrePorNitMap.containsKey(nit) || "Proveedor".equals(nombrePorNitMap.get(nit)) || nombrePorNitMap.get(nit).startsWith("Proveedor ")) {
                    nombrePorNitMap.put(nit, razonSocial);
                }

                toneladasPorNitYMes.computeIfAbsent(nit, k -> new HashMap<>()).put(mNum, tons);
            }
        } catch (Exception e) {
            System.err.println("⚠ [IndustrializacionAceite] Error al consultar SIESA: " + e.getMessage());
        }

        double totalTonMes = 0.0;
        double totalTonAcumYTD = 0.0;

        Map<String, Double> nitTonMesMap = new HashMap<>();
        Map<String, Double> nitTonAcumMap = new HashMap<>();

        for (String nit : nitsActivos) {
            Map<Integer, Double> mesMap = toneladasPorNitYMes.getOrDefault(nit, Collections.emptyMap());
            double tMes = mesMap.getOrDefault(month, 0.0);
            double tAcum = 0.0;
            for (int m = 1; m <= month; m++) {
                tAcum += mesMap.getOrDefault(m, 0.0);
            }

            nitTonMesMap.put(nit, tMes);
            nitTonAcumMap.put(nit, tAcum);

            totalTonMes += tMes;
            totalTonAcumYTD += tAcum;
        }

        List<ProveedorAvanceDTO> provList = new ArrayList<>();
        for (IndustrializacionProveedorConfigDTO pConfig : proveedoresConfig) {
            String nit = pConfig.getNit().trim();
            String nombre = nombrePorNitMap.getOrDefault(nit, pConfig.getNombre());
            double tMes = nitTonMesMap.getOrDefault(nit, 0.0);
            double tAcum = nitTonAcumMap.getOrDefault(nit, 0.0);

            double pctMes = (tMes / metaAnual) * 100.0;
            double pctAcum = (tAcum / metaAnual) * 100.0;
            double pctDona = (totalTonAcumYTD > 0) ? (tAcum / totalTonAcumYTD) * 100.0 : 0.0;

            ProveedorAvanceDTO pDto = new ProveedorAvanceDTO(
                nit, nombre,
                Math.round(tMes * 100.0) / 100.0,
                Math.round(pctMes * 100.0) / 100.0,
                Math.round(tAcum * 100.0) / 100.0,
                Math.round(pctAcum * 100.0) / 100.0,
                Math.round(pctDona * 10.0) / 10.0
            );
            provList.add(pDto);
        }

        double avanceMesPct = (totalTonMes / metaAnual) * 100.0;
        double avanceAnualPct = (totalTonAcumYTD / metaAnual) * 100.0;
        double pendMes = metaMensual - totalTonMes;
        double pendAnual = metaAnual - totalTonAcumYTD;

        dto.setToneladasMes(Math.round(totalTonMes * 100.0) / 100.0);
        dto.setAvanceMesPorcentaje(Math.round(avanceMesPct * 100.0) / 100.0);
        dto.setPendienteMes(Math.round((pendMes > 0 ? pendMes : 0.0) * 100.0) / 100.0);

        dto.setToneladasAcumuladasYTD(Math.round(totalTonAcumYTD * 100.0) / 100.0);
        dto.setAvanceAnualPorcentaje(Math.round(avanceAnualPct * 100.0) / 100.0);
        dto.setPendienteAnual(Math.round((pendAnual > 0 ? pendAnual : 0.0) * 100.0) / 100.0);

        dto.setResultado(dto.getAvanceAnualPorcentaje());
        dto.setProveedores(provList);

        return dto;
    }

    // =============================
    // CRUD PARAMETRIZACION
    // =============================

    public Map<String, Object> buscarProveedorEnSiesa(String nit) {
        Map<String, Object> resp = new HashMap<>();
        resp.put("nit", nit);
        try {
            String sql = "SELECT TOP 1 ter.f200_nit AS nit, ter.f200_razon_social AS nombre " +
                         "FROM t200_mm_terceros ter WHERE ter.f200_nit = ?";
            List<Map<String, Object>> list = siesaJdbcTemplate.queryForList(sql, nit);
            if (!list.isEmpty()) {
                resp.put("encontrado", true);
                resp.put("nombre", list.get(0).get("nombre"));
            } else {
                resp.put("encontrado", false);
                resp.put("nombre", "Proveedor " + nit);
            }
        } catch (Exception e) {
            resp.put("encontrado", false);
            resp.put("nombre", "Proveedor " + nit);
        }
        return resp;
    }

    public void agregarProveedor(String nit, String nombre) {
        ensureSchema();
        String nitClean = nit.trim();
        String nombreFinal = (nombre != null && !nombre.trim().isEmpty()) ? nombre.trim() : null;

        if (nombreFinal == null) {
            Map<String, Object> siesaResult = buscarProveedorEnSiesa(nitClean);
            nombreFinal = siesaResult.get("nombre") != null ? siesaResult.get("nombre").toString() : "Proveedor " + nitClean;
        }

        Integer maxOrden = jdbcTemplate.queryForObject("SELECT ISNULL(MAX(orden), 0) FROM cmi_industrializacion_proveedores", Integer.class);
        int nextOrden = (maxOrden != null ? maxOrden : 0) + 1;

        String sql = "IF EXISTS (SELECT 1 FROM cmi_industrializacion_proveedores WHERE nit = ?) " +
                     "   UPDATE cmi_industrializacion_proveedores SET nombre = ?, activo = 1 WHERE nit = ? " +
                     "ELSE " +
                     "   INSERT INTO cmi_industrializacion_proveedores (nit, nombre, activo, orden) VALUES (?, ?, 1, ?)";

        jdbcTemplate.update(sql, nitClean, nombreFinal, nitClean, nitClean, nombreFinal, nextOrden);
    }

    public void toggleProveedor(Integer id, Boolean activo) {
        ensureSchema();
        jdbcTemplate.update("UPDATE cmi_industrializacion_proveedores SET activo = ? WHERE id = ?", activo ? 1 : 0, id);
    }

    public void eliminarProveedor(Integer id) {
        ensureSchema();
        jdbcTemplate.update("DELETE FROM cmi_industrializacion_proveedores WHERE id = ?", id);
    }

    public void actualizarMetaAnual(Double metaAnual) {
        ensureSchema();
        jdbcTemplate.update("UPDATE cmi_industrializacion_config SET meta_anual = ?, date_update = GETDATE() WHERE id = (SELECT TOP 1 id FROM cmi_industrializacion_config ORDER BY id DESC)", metaAnual);
    }
}
