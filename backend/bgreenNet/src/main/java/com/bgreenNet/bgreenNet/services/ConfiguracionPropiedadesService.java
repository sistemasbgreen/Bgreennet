package com.bgreenNet.bgreenNet.services;

import java.lang.management.ManagementFactory;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.PropiedadesServidorDTO;
import com.bgreenNet.bgreenNet.dto.PropiedadesServidorDTO.*;

import javax.sql.DataSource;

@Service
public class ConfiguracionPropiedadesService {

    private static final Logger log = LoggerFactory.getLogger(ConfiguracionPropiedadesService.class);

    @Autowired
    private Environment env;

    @Autowired(required = false)
    @Qualifier("primaryDataSource")
    private DataSource primaryDataSource;

    @Autowired(required = false)
    @Qualifier("siesaDataSource")
    private DataSource siesaDataSource;

    @Autowired(required = false)
    @Qualifier("plcDataSource")
    private DataSource plcDataSource;

    // ─────────────────────────────────────────────────────────────
    // ENTRY POINT
    // ─────────────────────────────────────────────────────────────
    public PropiedadesServidorDTO obtenerPropiedadesServidor() {
        PropiedadesServidorDTO dto = new PropiedadesServidorDTO();
        try { dto.setServidor(obtenerInfoServidor()); }
        catch (Exception e) { log.error("Error en obtenerInfoServidor: {}", e.getMessage(), e); }

        try { dto.setBasesDatos(obtenerInfoBasesDatos()); }
        catch (Exception e) {
            log.error("Error en obtenerInfoBasesDatos: {}", e.getMessage(), e);
            dto.setBasesDatos(new ArrayList<>());
        }

        try { dto.setCorreo(obtenerInfoCorreo()); }
        catch (Exception e) { log.error("Error en obtenerInfoCorreo: {}", e.getMessage(), e); }

        try { dto.setAlmacenamiento(obtenerInfoAlmacenamiento()); }
        catch (Exception e) { log.error("Error en obtenerInfoAlmacenamiento: {}", e.getMessage(), e); }

        try { dto.setSeguridadJpa(obtenerInfoSeguridadJpa()); }
        catch (Exception e) { log.error("Error en obtenerInfoSeguridadJpa: {}", e.getMessage(), e); }

        return dto;
    }

    // ─────────────────────────────────────────────────────────────
    // SERVIDOR
    // ─────────────────────────────────────────────────────────────
    private InfoServidorDTO obtenerInfoServidor() {
        InfoServidorDTO s = new InfoServidorDTO();
        s.setAppName(safeEnv("spring.application.name", "bgreenNet"));
        s.setServerPort(safeEnv("server.port", "8081"));

        try {
            String[] profiles = env.getActiveProfiles();
            s.setActiveProfile(profiles != null && profiles.length > 0
                ? String.join(", ", profiles)
                : "default (desarrollo)");
        } catch (Exception e) { s.setActiveProfile("default"); }

        try { s.setJavaVersion(System.getProperty("java.version", "—")); }
        catch (Exception e) { s.setJavaVersion("—"); }

        try {
            s.setOsName(System.getProperty("os.name", "—")
                + " (" + System.getProperty("os.arch", "—") + ")");
        } catch (Exception e) { s.setOsName("—"); }

        try {
            long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
            s.setUptime(formatearUptime(uptimeMs));
        } catch (Exception e) { s.setUptime("—"); }

        s.setTomcatMaxThreads(safeEnv("server.tomcat.threads.max", "50"));
        s.setTomcatMinSpareThreads(safeEnv("server.tomcat.threads.min-spare", "5"));
        s.setTomcatConnectionTimeout(safeEnv("server.tomcat.connection-timeout", "60000") + " ms");
        s.setForwardHeaders(safeEnv("server.forward-headers-strategy", "native"));
        return s;
    }

    // ─────────────────────────────────────────────────────────────
    // BASES DE DATOS
    // ─────────────────────────────────────────────────────────────
    private List<InfoBaseDatosDTO> obtenerInfoBasesDatos() {
        List<InfoBaseDatosDTO> list = new ArrayList<>();

        list.add(construirInfoBaseDatos(
            "principal", "BgreenNet (Principal)",
            primaryDataSource,
            new String[]{"spring.datasource.jdbc-url", "spring.datasource.url"},
            "spring.datasource.username",
            "spring.datasource.driver-class-name",
            "spring.datasource.password",
            "spring.datasource.hikari.maximum-pool-size",
            "spring.datasource.hikari.minimum-idle",
            "spring.datasource.hikari.connection-timeout",
            5, 2, 30000));

        list.add(construirInfoBaseDatos(
            "siesa", "SIESA (ERP)",
            siesaDataSource,
            new String[]{"siesa.datasource.jdbc-url", "siesa.datasource.url"},
            "siesa.datasource.username",
            "siesa.datasource.driver-class-name",
            "siesa.datasource.password",
            "siesa.datasource.hikari.maximum-pool-size",
            "siesa.datasource.hikari.minimum-idle",
            "siesa.datasource.hikari.connection-timeout",
            3, 1, 30000));

        list.add(construirInfoBaseDatos(
            "plc", "PLC (Process Data)",
            plcDataSource,
            new String[]{"plc.datasource.jdbc-url", "plc.datasource.url"},
            "plc.datasource.username",
            "plc.datasource.driver-class-name",
            "plc.datasource.password",
            "plc.datasource.hikari.maximum-pool-size",
            "plc.datasource.hikari.minimum-idle",
            "plc.datasource.hikari.connection-timeout",
            15, 2, 60000));

        return list;
    }

    private InfoBaseDatosDTO construirInfoBaseDatos(
            String id, String nombre,
            DataSource ds,
            String[] urlKeys,
            String userKey, String driverKey, String passwordKey,
            String maxPoolKey, String minPoolKey, String timeoutKey,
            int defMax, int defMin, int defTimeout) {

        InfoBaseDatosDTO dto = new InfoBaseDatosDTO();
        dto.setId(id);
        dto.setNombre(nombre);

        String url    = null;
        String user   = null;
        String driver = null;
        int maxPool   = defMax;
        int minPool   = defMin;
        int timeout   = defTimeout;
        boolean hasPassword = false;

        // Intentar leer desde el HikariDataSource activo o sus proxies
        if (ds != null && ds.getClass().getName().contains("HikariDataSource")) {
            try {
                // Cast by reflection or just assume it is the class. To be safer without importing, use reflection:
                Class<?> hikariClass = ds.getClass();
                try { url = (String) hikariClass.getMethod("getJdbcUrl").invoke(ds); } catch (Exception e) { log.warn("No se pudo leer jdbcUrl de {}: {}", id, e.getMessage()); }
                try { user = (String) hikariClass.getMethod("getUsername").invoke(ds); } catch (Exception e) { log.warn("No se pudo leer username de {}: {}", id, e.getMessage()); }
                try { driver = (String) hikariClass.getMethod("getDriverClassName").invoke(ds); } catch (Exception e) { log.warn("No se pudo leer driver de {}: {}", id, e.getMessage()); }
                try { maxPool = (int) hikariClass.getMethod("getMaximumPoolSize").invoke(ds); } catch (Exception e) { /* usar default */ }
                try { minPool = (int) hikariClass.getMethod("getMinimumIdle").invoke(ds); } catch (Exception e) { /* usar default */ }
                try { timeout = (int) ((long) hikariClass.getMethod("getConnectionTimeout").invoke(ds)); } catch (Exception e) { /* usar default */ }
                try {
                    String p = (String) hikariClass.getMethod("getPassword").invoke(ds);
                    hasPassword = p != null && !p.isEmpty();
                } catch (Exception e) { /* usar default */ }
            } catch (Exception e) {
                log.warn("Error al extraer info de HikariDataSource: {}", e.getMessage());
            }
        }

        // Fallback a application.properties si el bean no tiene datos
        if (url == null || url.trim().isEmpty()) {
            for (String k : urlKeys) {
                String val = safeEnv(k, null);
                if (val != null && !val.trim().isEmpty()) { url = val.trim(); break; }
            }
        }
        if (user == null || user.trim().isEmpty())   { user   = safeEnv(userKey,   null); }
        if (driver == null || driver.trim().isEmpty()) { driver = safeEnv(driverKey, null); }
        if (!hasPassword) { hasPassword = esPropiedadPresente(passwordKey); }

        dto.setUrl(url != null ? url : "No configurada");
        dto.setUsuario(user != null ? user : "—");
        dto.setDriver(driver != null ? driver : "—");
        dto.setHost(extraerHost(url));
        dto.setDatabaseName(extraerDatabase(url));
        dto.setPoolMax(getIntegerProperty(maxPoolKey, maxPool));
        dto.setPoolMin(getIntegerProperty(minPoolKey, minPool));
        dto.setConnectionTimeout(getIntegerProperty(timeoutKey, timeout));
        dto.setPasswordConfigurada(hasPassword);
        return dto;
    }

    // ─────────────────────────────────────────────────────────────
    // CORREO
    // ─────────────────────────────────────────────────────────────
    private InfoCorreoDTO obtenerInfoCorreo() {
        InfoCorreoDTO m = new InfoCorreoDTO();
        m.setHost(safeEnv("spring.mail.host", "smtp.office365.com"));
        m.setPuerto(safeEnv("spring.mail.port", "587"));
        m.setUsuario(safeEnv("spring.mail.username", "—"));
        m.setReporteEmailFrom(safeEnv("report.email.from", m.getUsuario()));
        m.setReporteEmailTo(safeEnv("report.email.to", "—"));
        m.setAuth(safeEnv("spring.mail.properties.mail.smtp.auth", "true"));
        m.setStarttls(safeEnv("spring.mail.properties.mail.smtp.starttls.enable", "true"));
        m.setPasswordConfigurada(esPropiedadPresente("spring.mail.password"));
        return m;
    }

    // ─────────────────────────────────────────────────────────────
    // ALMACENAMIENTO
    // ─────────────────────────────────────────────────────────────
    private InfoAlmacenamientoDTO obtenerInfoAlmacenamiento() {
        InfoAlmacenamientoDTO a = new InfoAlmacenamientoDTO();
        a.setRutaUpload(safeEnv("upload.path", "C:/inetpub/Bgreen/Imagenes/Img"));
        a.setMaxFileSize(safeEnv("spring.servlet.multipart.max-file-size", "5MB"));
        a.setMaxRequestSize(safeEnv("spring.servlet.multipart.max-request-size", "5MB"));
        a.setStaticLocations(safeEnv("spring.web.resources.static-locations", "—"));
        calcularEstadoDirectorio(a);
        return a;
    }

    private void calcularEstadoDirectorio(InfoAlmacenamientoDTO a) {
        String pathStr = a.getRutaUpload();
        if (pathStr == null || pathStr.trim().isEmpty()) {
            a.setCarpetaExiste(false);
            a.setTotalArchivos(0);
            a.setTamanoTotalBytes(0);
            a.setTamanoTotalFormateado("Ruta no configurada");
            a.setEstadoCarpeta("Sin ruta configurada");
            return;
        }
        try {
            Path dirPath = Paths.get(pathStr.trim());
            if (!Files.exists(dirPath)) {
                a.setCarpetaExiste(false);
                a.setTotalArchivos(0);
                a.setTamanoTotalBytes(0);
                a.setTamanoTotalFormateado("No encontrada");
                a.setEstadoCarpeta("La carpeta no existe: " + pathStr);
                return;
            }
            if (!Files.isDirectory(dirPath)) {
                a.setCarpetaExiste(false);
                a.setTotalArchivos(0);
                a.setTamanoTotalBytes(0);
                a.setTamanoTotalFormateado("No es directorio");
                a.setEstadoCarpeta("La ruta no es un directorio");
                return;
            }

            a.setCarpetaExiste(true);
            AtomicLong totalFiles = new AtomicLong(0);
            AtomicLong totalBytes = new AtomicLong(0);

            try (Stream<Path> stream = Files.walk(dirPath)) {
                stream.filter(Files::isRegularFile).forEach(p -> {
                    totalFiles.incrementAndGet();
                    try { totalBytes.addAndGet(Files.size(p)); } catch (Exception ignored) {}
                });
            }

            a.setTotalArchivos(totalFiles.get());
            a.setTamanoTotalBytes(totalBytes.get());
            a.setTamanoTotalFormateado(formatearBytes(totalBytes.get()));
            a.setEstadoCarpeta(totalFiles.get() == 0
                ? "Carpeta vacía (0 archivos)"
                : totalFiles.get() + " archivos (" + a.getTamanoTotalFormateado() + ")");

        } catch (Exception e) {
            log.error("Error al calcular directorio {}: {}", pathStr, e.getMessage());
            a.setCarpetaExiste(false);
            a.setTotalArchivos(0);
            a.setTamanoTotalBytes(0);
            a.setTamanoTotalFormateado("Error al acceder");
            a.setEstadoCarpeta("Error: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────
    // JWT & JPA
    // ─────────────────────────────────────────────────────────────
    private InfoSeguridadJpaDTO obtenerInfoSeguridadJpa() {
        InfoSeguridadJpaDTO j = new InfoSeguridadJpaDTO();
        String expStr = safeEnv("jwt.expiration", "432000000");
        try {
            long expMs = Long.parseLong(expStr);
            j.setJwtExpiracionMs(expMs);
            long days  = TimeUnit.MILLISECONDS.toDays(expMs);
            long hours = TimeUnit.MILLISECONDS.toHours(expMs);
            j.setJwtExpiracionFormateada(days > 0
                ? days + " días (" + hours + " horas)"
                : hours + " horas");
        } catch (Exception e) {
            j.setJwtExpiracionMs(0L);
            j.setJwtExpiracionFormateada(expStr + " ms");
        }
        j.setJwtSecretConfigurado(esPropiedadPresente("jwt.secret"));
        j.setJpaDialect(safeEnv("spring.jpa.properties.hibernate.dialect", "SQLServerDialect"));
        j.setJpaDdlAuto(safeEnv("spring.jpa.hibernate.ddl-auto", "none"));
        j.setJpaTimeZone(safeEnv("spring.jpa.properties.hibernate.jdbc.time_zone", "UTC"));
        return j;
    }

    // ─────────────────────────────────────────────────────────────
    // UTILS
    // ─────────────────────────────────────────────────────────────
    private String safeEnv(String key, String defaultValue) {
        try {
            String val = env.getProperty(key);
            return (val != null && !val.trim().isEmpty()) ? val.trim() : defaultValue;
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private boolean esPropiedadPresente(String key) {
        try {
            String val = env.getProperty(key);
            return val != null && !val.trim().isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    private Integer getIntegerProperty(String key, int defaultValue) {
        try {
            String val = env.getProperty(key);
            return (val != null) ? Integer.parseInt(val.trim()) : defaultValue;
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private String formatearUptime(long ms) {
        long days    = TimeUnit.MILLISECONDS.toDays(ms);
        long hours   = TimeUnit.MILLISECONDS.toHours(ms) % 24;
        long minutes = TimeUnit.MILLISECONDS.toMinutes(ms) % 60;
        long seconds = TimeUnit.MILLISECONDS.toSeconds(ms) % 60;
        StringBuilder sb = new StringBuilder();
        if (days > 0)           sb.append(days).append("d ");
        if (hours > 0 || days > 0) sb.append(hours).append("h ");
        sb.append(minutes).append("m ").append(seconds).append("s");
        return sb.toString().trim();
    }

    private String formatearBytes(long bytes) {
        if (bytes <= 0) return "0 B";
        String[] units = {"B", "KB", "MB", "GB", "TB"};
        int g = Math.min((int)(Math.log10(bytes) / Math.log10(1024)), units.length - 1);
        return String.format(java.util.Locale.US, "%.2f %s", bytes / Math.pow(1024, g), units[g]);
    }

    private String extraerHost(String url) {
        if (url == null || url.trim().isEmpty()) return "—";
        try {
            Pattern p = Pattern.compile("(?i)sqlserver://([^/;:?\\s]+)");
            Matcher m = p.matcher(url);
            if (m.find()) return m.group(1).trim();
        } catch (Exception ignored) {}
        return "—";
    }

    private String extraerDatabase(String url) {
        if (url == null || url.trim().isEmpty()) return "—";
        try {
            // Buscar databaseName=XXX
            Pattern p1 = Pattern.compile("(?i)databaseName=([^;?&\\s]+)");
            Matcher m1 = p1.matcher(url);
            if (m1.find()) return m1.group(1).trim();

            // Buscar /DBNAME en jtds o sqlserver://HOST/DB
            Pattern p2 = Pattern.compile("(?i)sqlserver://[^/]+/([^;?&\\s]+)");
            Matcher m2 = p2.matcher(url);
            if (m2.find()) return m2.group(1).trim();
        } catch (Exception ignored) {}
        return "—";
    }
}
