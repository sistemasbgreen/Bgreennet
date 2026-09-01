package com.bgreenNet.bgreenNet.dto;

import java.util.List;

public class PropiedadesServidorDTO {

    private InfoServidorDTO servidor;
    private List<InfoBaseDatosDTO> basesDatos;
    private InfoCorreoDTO correo;
    private InfoAlmacenamientoDTO almacenamiento;
    private InfoSeguridadJpaDTO seguridadJpa;

    public InfoServidorDTO getServidor() { return servidor; }
    public void setServidor(InfoServidorDTO servidor) { this.servidor = servidor; }

    public List<InfoBaseDatosDTO> getBasesDatos() { return basesDatos; }
    public void setBasesDatos(List<InfoBaseDatosDTO> basesDatos) { this.basesDatos = basesDatos; }

    public InfoCorreoDTO getCorreo() { return correo; }
    public void setCorreo(InfoCorreoDTO correo) { this.correo = correo; }

    public InfoAlmacenamientoDTO getAlmacenamiento() { return almacenamiento; }
    public void setAlmacenamiento(InfoAlmacenamientoDTO almacenamiento) { this.almacenamiento = almacenamiento; }

    public InfoSeguridadJpaDTO getSeguridadJpa() { return seguridadJpa; }
    public void setSeguridadJpa(InfoSeguridadJpaDTO seguridadJpa) { this.seguridadJpa = seguridadJpa; }

    // ─────────────────────────────────────────────────────────────
    public static class InfoServidorDTO {
        private String appName;
        private String serverPort;
        private String activeProfile;
        private String javaVersion;
        private String osName;
        private String uptime;
        private String jvmMemory;
        private String tomcatMaxThreads;
        private String tomcatMinSpareThreads;
        private String tomcatConnectionTimeout;
        private String forwardHeaders;

        public String getAppName() { return appName; }
        public void setAppName(String appName) { this.appName = appName; }

        public String getServerPort() { return serverPort; }
        public void setServerPort(String serverPort) { this.serverPort = serverPort; }

        public String getActiveProfile() { return activeProfile; }
        public void setActiveProfile(String activeProfile) { this.activeProfile = activeProfile; }

        public String getJavaVersion() { return javaVersion; }
        public void setJavaVersion(String javaVersion) { this.javaVersion = javaVersion; }

        public String getOsName() { return osName; }
        public void setOsName(String osName) { this.osName = osName; }

        public String getUptime() { return uptime; }
        public void setUptime(String uptime) { this.uptime = uptime; }

        public String getJvmMemory() { return jvmMemory; }
        public void setJvmMemory(String jvmMemory) { this.jvmMemory = jvmMemory; }

        public String getTomcatMaxThreads() { return tomcatMaxThreads; }
        public void setTomcatMaxThreads(String tomcatMaxThreads) { this.tomcatMaxThreads = tomcatMaxThreads; }

        public String getTomcatMinSpareThreads() { return tomcatMinSpareThreads; }
        public void setTomcatMinSpareThreads(String tomcatMinSpareThreads) { this.tomcatMinSpareThreads = tomcatMinSpareThreads; }

        public String getTomcatConnectionTimeout() { return tomcatConnectionTimeout; }
        public void setTomcatConnectionTimeout(String tomcatConnectionTimeout) { this.tomcatConnectionTimeout = tomcatConnectionTimeout; }

        public String getForwardHeaders() { return forwardHeaders; }
        public void setForwardHeaders(String forwardHeaders) { this.forwardHeaders = forwardHeaders; }
    }

    // ─────────────────────────────────────────────────────────────
    public static class InfoBaseDatosDTO {
        private String id;
        private String nombre;
        private String url;
        private String usuario;
        private String driver;
        private String databaseName;
        private String host;
        private Integer poolMax;
        private Integer poolMin;
        private Integer connectionTimeout;
        private boolean passwordConfigurada;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }

        public String getUsuario() { return usuario; }
        public void setUsuario(String usuario) { this.usuario = usuario; }

        public String getDriver() { return driver; }
        public void setDriver(String driver) { this.driver = driver; }

        public String getDatabaseName() { return databaseName; }
        public void setDatabaseName(String databaseName) { this.databaseName = databaseName; }

        public String getHost() { return host; }
        public void setHost(String host) { this.host = host; }

        public Integer getPoolMax() { return poolMax; }
        public void setPoolMax(Integer poolMax) { this.poolMax = poolMax; }

        public Integer getPoolMin() { return poolMin; }
        public void setPoolMin(Integer poolMin) { this.poolMin = poolMin; }

        public Integer getConnectionTimeout() { return connectionTimeout; }
        public void setConnectionTimeout(Integer connectionTimeout) { this.connectionTimeout = connectionTimeout; }

        public boolean isPasswordConfigurada() { return passwordConfigurada; }
        public void setPasswordConfigurada(boolean passwordConfigurada) { this.passwordConfigurada = passwordConfigurada; }
    }

    // ─────────────────────────────────────────────────────────────
    public static class InfoCorreoDTO {
        private String host;
        private String puerto;
        private String usuario;
        private String reporteEmailTo;
        private String reporteEmailFrom;
        private String auth;
        private String starttls;
        private boolean passwordConfigurada;

        public String getHost() { return host; }
        public void setHost(String host) { this.host = host; }

        public String getPuerto() { return puerto; }
        public void setPuerto(String puerto) { this.puerto = puerto; }

        public String getUsuario() { return usuario; }
        public void setUsuario(String usuario) { this.usuario = usuario; }

        public String getReporteEmailTo() { return reporteEmailTo; }
        public void setReporteEmailTo(String reporteEmailTo) { this.reporteEmailTo = reporteEmailTo; }

        public String getReporteEmailFrom() { return reporteEmailFrom; }
        public void setReporteEmailFrom(String reporteEmailFrom) { this.reporteEmailFrom = reporteEmailFrom; }

        public String getAuth() { return auth; }
        public void setAuth(String auth) { this.auth = auth; }

        public String getStarttls() { return starttls; }
        public void setStarttls(String starttls) { this.starttls = starttls; }

        public boolean isPasswordConfigurada() { return passwordConfigurada; }
        public void setPasswordConfigurada(boolean passwordConfigurada) { this.passwordConfigurada = passwordConfigurada; }
    }

    // ─────────────────────────────────────────────────────────────
    public static class InfoAlmacenamientoDTO {
        private String rutaUpload;
        private String maxFileSize;
        private String maxRequestSize;
        private String staticLocations;
        private boolean carpetaExiste;
        private long totalArchivos;
        private long tamanoTotalBytes;
        private String tamanoTotalFormateado;
        private String estadoCarpeta;

        public String getRutaUpload() { return rutaUpload; }
        public void setRutaUpload(String rutaUpload) { this.rutaUpload = rutaUpload; }

        public String getMaxFileSize() { return maxFileSize; }
        public void setMaxFileSize(String maxFileSize) { this.maxFileSize = maxFileSize; }

        public String getMaxRequestSize() { return maxRequestSize; }
        public void setMaxRequestSize(String maxRequestSize) { this.maxRequestSize = maxRequestSize; }

        public String getStaticLocations() { return staticLocations; }
        public void setStaticLocations(String staticLocations) { this.staticLocations = staticLocations; }

        public boolean isCarpetaExiste() { return carpetaExiste; }
        public void setCarpetaExiste(boolean carpetaExiste) { this.carpetaExiste = carpetaExiste; }

        public long getTotalArchivos() { return totalArchivos; }
        public void setTotalArchivos(long totalArchivos) { this.totalArchivos = totalArchivos; }

        public long getTamanoTotalBytes() { return tamanoTotalBytes; }
        public void setTamanoTotalBytes(long tamanoTotalBytes) { this.tamanoTotalBytes = tamanoTotalBytes; }

        public String getTamanoTotalFormateado() { return tamanoTotalFormateado; }
        public void setTamanoTotalFormateado(String tamanoTotalFormateado) { this.tamanoTotalFormateado = tamanoTotalFormateado; }

        public String getEstadoCarpeta() { return estadoCarpeta; }
        public void setEstadoCarpeta(String estadoCarpeta) { this.estadoCarpeta = estadoCarpeta; }
    }

    // ─────────────────────────────────────────────────────────────
    public static class InfoSeguridadJpaDTO {
        private Long jwtExpiracionMs;
        private String jwtExpiracionFormateada;
        private boolean jwtSecretConfigurado;
        private String jpaDialect;
        private String jpaDdlAuto;
        private String jpaTimeZone;

        public Long getJwtExpiracionMs() { return jwtExpiracionMs; }
        public void setJwtExpiracionMs(Long jwtExpiracionMs) { this.jwtExpiracionMs = jwtExpiracionMs; }

        public String getJwtExpiracionFormateada() { return jwtExpiracionFormateada; }
        public void setJwtExpiracionFormateada(String jwtExpiracionFormateada) { this.jwtExpiracionFormateada = jwtExpiracionFormateada; }

        public boolean isJwtSecretConfigurado() { return jwtSecretConfigurado; }
        public void setJwtSecretConfigurado(boolean jwtSecretConfigurado) { this.jwtSecretConfigurado = jwtSecretConfigurado; }

        public String getJpaDialect() { return jpaDialect; }
        public void setJpaDialect(String jpaDialect) { this.jpaDialect = jpaDialect; }

        public String getJpaDdlAuto() { return jpaDdlAuto; }
        public void setJpaDdlAuto(String jpaDdlAuto) { this.jpaDdlAuto = jpaDdlAuto; }

        public String getJpaTimeZone() { return jpaTimeZone; }
        public void setJpaTimeZone(String jpaTimeZone) { this.jpaTimeZone = jpaTimeZone; }
    }
}
