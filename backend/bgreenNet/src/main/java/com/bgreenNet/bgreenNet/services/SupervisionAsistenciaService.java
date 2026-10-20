package com.bgreenNet.bgreenNet.services;

import com.bgreenNet.bgreenNet.dto.*;
import com.bgreenNet.bgreenNet.models.SupervisionAsistencia;
import com.bgreenNet.bgreenNet.repository.SupervisionAsistenciaRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SupervisionAsistenciaService {

    private static final Logger log = LoggerFactory.getLogger(SupervisionAsistenciaService.class);

    @Autowired
    private SupervisionAsistenciaRepository repository;

    @Autowired
    @Qualifier("primaryJdbcTemplate")
    private JdbcTemplate jdbcTemplate;

    @Autowired(required = false)
    private UsuarioServices usuarioServices;

    @PostConstruct
    public void init() {
        try {
            String ddl = """
                IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[configuracion_supervision_asistencia]') AND type in (N'U'))
                BEGIN
                    CREATE TABLE [dbo].[configuracion_supervision_asistencia] (
                        id_supervision INT IDENTITY(1,1) PRIMARY KEY,
                        id_supervisor INT NOT NULL,
                        cedula_supervisor VARCHAR(50) NOT NULL,
                        nombre_supervisor VARCHAR(200) NOT NULL,
                        tipo_alcance VARCHAR(30) NOT NULL,
                        id_area INT NULL,
                        nombre_area VARCHAR(150) NULL,
                        cedula_colaborador VARCHAR(50) NULL,
                        nombre_colaborador VARCHAR(200) NULL,
                        puede_aprobar_horas_extra BIT NOT NULL DEFAULT 1,
                        activo BIT NOT NULL DEFAULT 1,
                        observacion VARCHAR(300) NULL,
                        date_create DATETIME NOT NULL DEFAULT GETDATE(),
                        date_modify DATETIME NOT NULL DEFAULT GETDATE()
                    );
                    CREATE NONCLUSTERED INDEX IX_supervision_supervisor ON [dbo].[configuracion_supervision_asistencia] (id_supervisor, activo);
                    CREATE NONCLUSTERED INDEX IX_supervision_cedula_sup ON [dbo].[configuracion_supervision_asistencia] (cedula_supervisor, activo);
                END
            """;
            jdbcTemplate.execute(ddl);
            log.info("✅ Tabla configuracion_supervision_asistencia verificada/creada correctamente.");
        } catch (Exception e) {
            log.warn("⚠️ Advertencia al verificar/crear tabla configuracion_supervision_asistencia: {}", e.getMessage());
        }
    }

    public List<SupervisionAsistenciaDTO> listarTodas() {
        return repository.findAllByOrderByDateCreateDesc().stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public List<SupervisorAsignadoResumenDTO> listarAgrupadas() {
        List<SupervisionAsistencia> todas = repository.findAllByOrderByDateCreateDesc();
        if (todas.isEmpty()) {
            return Collections.emptyList();
        }

        // Cargar mapa de usuarios para obtener info enriquecida (cargo, área) si está disponible
        Map<Integer, UsuarioCompletoDTO> mapaUsuarios = new HashMap<>();
        try {
            if (usuarioServices != null) {
                List<UsuarioCompletoDTO> uList = usuarioServices.listarUsuarios();
                for (UsuarioCompletoDTO u : uList) {
                    if (u.getIdUsuario() != null) {
                        mapaUsuarios.put(u.getIdUsuario(), u);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("No se pudieron cargar usuarios para enriquecer supervisores: {}", e.getMessage());
        }

        Map<Integer, List<SupervisionAsistencia>> agrupadosPorSupervisor = todas.stream()
                .collect(Collectors.groupingBy(SupervisionAsistencia::getIdSupervisor, LinkedHashMap::new, Collectors.toList()));

        List<SupervisorAsignadoResumenDTO> resultado = new ArrayList<>();

        for (Map.Entry<Integer, List<SupervisionAsistencia>> entry : agrupadosPorSupervisor.entrySet()) {
            List<SupervisionAsistencia> reglas = entry.getValue();
            SupervisionAsistencia primera = reglas.get(0);
            Integer idSup = entry.getKey();
            UsuarioCompletoDTO uInfo = mapaUsuarios.get(idSup);

            Set<String> tipos = reglas.stream().map(SupervisionAsistencia::getTipoAlcance).collect(Collectors.toSet());
            String tipoAlcance;
            if (tipos.size() > 1) {
                tipoAlcance = "MIXTO";
            } else if (tipos.contains("GLOBAL")) {
                tipoAlcance = "GLOBAL";
            } else if (tipos.contains("AREA")) {
                tipoAlcance = "AREA";
            } else {
                tipoAlcance = "COLABORADOR";
            }

            List<String> areasNombres = reglas.stream()
                    .map(SupervisionAsistencia::getNombreArea)
                    .filter(Objects::nonNull)
                    .filter(s -> !s.trim().isEmpty())
                    .distinct()
                    .collect(Collectors.toList());

            List<String> colaboradoresNombres = reglas.stream()
                    .map(SupervisionAsistencia::getNombreColaborador)
                    .filter(Objects::nonNull)
                    .filter(s -> !s.trim().isEmpty())
                    .distinct()
                    .collect(Collectors.toList());

            boolean algunoActivo = reglas.stream().anyMatch(r -> Boolean.TRUE.equals(r.getActivo()));
            boolean puedeAprobar = reglas.stream().anyMatch(r -> Boolean.TRUE.equals(r.getPuedeAprobarHorasExtra()));

            SupervisorAsignadoResumenDTO resumen = SupervisorAsignadoResumenDTO.builder()
                    .idSupervisor(idSup)
                    .cedulaSupervisor(primera.getCedulaSupervisor())
                    .nombreSupervisor(primera.getNombreSupervisor())
                    .cargoSupervisor(uInfo != null ? uInfo.getDescripcionCargo() : null)
                    .areaSupervisor(uInfo != null ? uInfo.getDescripcionArea() : null)
                    .tipoAlcance(tipoAlcance)
                    .totalAreas(areasNombres.size())
                    .totalColaboradores(colaboradoresNombres.size())
                    .areasNombres(areasNombres)
                    .colaboradoresNombres(colaboradoresNombres)
                    .puedeAprobarHorasExtra(puedeAprobar)
                    .activo(algunoActivo)
                    .observacion(primera.getObservacion())
                    .reglas(reglas.stream().map(this::convertirADTO).collect(Collectors.toList()))
                    .build();

            resultado.add(resumen);
        }

        return resultado;
    }

    @Transactional
    public void guardarAsignacion(GuardarSupervisionDTO dto) {
        if (dto.getIdSupervisor() == null) {
            throw new IllegalArgumentException("El supervisor es obligatorio.");
        }

        String tipo = dto.getTipoAlcance() != null ? dto.getTipoAlcance().toUpperCase().trim() : "AREA";
        boolean activo = dto.getActivo() != null ? dto.getActivo() : true;
        boolean puedeAprobar = dto.getPuedeAprobarHorasExtra() != null ? dto.getPuedeAprobarHorasExtra() : true;
        String obs = dto.getObservacion();
        LocalDateTime now = LocalDateTime.now();

        List<SupervisionAsistencia> aGuardar = new ArrayList<>();

        if ("GLOBAL".equals(tipo)) {
            SupervisionAsistencia regla = SupervisionAsistencia.builder()
                    .idSupervisor(dto.getIdSupervisor())
                    .cedulaSupervisor(dto.getCedulaSupervisor())
                    .nombreSupervisor(dto.getNombreSupervisor())
                    .tipoAlcance("GLOBAL")
                    .puedeAprobarHorasExtra(puedeAprobar)
                    .activo(activo)
                    .observacion(obs)
                    .dateCreate(now)
                    .dateModify(now)
                    .build();
            aGuardar.add(regla);
        } else if ("AREA".equals(tipo)) {
            if (dto.getAreas() == null || dto.getAreas().isEmpty()) {
                throw new IllegalArgumentException("Debe seleccionar al menos una Área para el supervisor.");
            }
            for (GuardarSupervisionDTO.AreaAsignacion area : dto.getAreas()) {
                SupervisionAsistencia regla = SupervisionAsistencia.builder()
                        .idSupervisor(dto.getIdSupervisor())
                        .cedulaSupervisor(dto.getCedulaSupervisor())
                        .nombreSupervisor(dto.getNombreSupervisor())
                        .tipoAlcance("AREA")
                        .idArea(area.getIdArea())
                        .nombreArea(area.getNombreArea())
                        .puedeAprobarHorasExtra(puedeAprobar)
                        .activo(activo)
                        .observacion(obs)
                        .dateCreate(now)
                        .dateModify(now)
                        .build();
                aGuardar.add(regla);
            }
        } else if ("COLABORADOR".equals(tipo)) {
            if (dto.getColaboradores() == null || dto.getColaboradores().isEmpty()) {
                throw new IllegalArgumentException("Debe seleccionar al menos un Colaborador para el supervisor.");
            }
            for (GuardarSupervisionDTO.ColaboradorAsignacion colab : dto.getColaboradores()) {
                SupervisionAsistencia regla = SupervisionAsistencia.builder()
                        .idSupervisor(dto.getIdSupervisor())
                        .cedulaSupervisor(dto.getCedulaSupervisor())
                        .nombreSupervisor(dto.getNombreSupervisor())
                        .tipoAlcance("COLABORADOR")
                        .idArea(colab.getIdArea())
                        .nombreArea(colab.getNombreArea())
                        .cedulaColaborador(colab.getCedula())
                        .nombreColaborador(colab.getNombre())
                        .puedeAprobarHorasExtra(puedeAprobar)
                        .activo(activo)
                        .observacion(obs)
                        .dateCreate(now)
                        .dateModify(now)
                        .build();
                aGuardar.add(regla);
            }
        } else if ("MIXTO".equals(tipo)) {
            if (dto.getAreas() != null) {
                for (GuardarSupervisionDTO.AreaAsignacion area : dto.getAreas()) {
                    SupervisionAsistencia regla = SupervisionAsistencia.builder()
                            .idSupervisor(dto.getIdSupervisor())
                            .cedulaSupervisor(dto.getCedulaSupervisor())
                            .nombreSupervisor(dto.getNombreSupervisor())
                            .tipoAlcance("AREA")
                            .idArea(area.getIdArea())
                            .nombreArea(area.getNombreArea())
                            .puedeAprobarHorasExtra(puedeAprobar)
                            .activo(activo)
                            .observacion(obs)
                            .dateCreate(now)
                            .dateModify(now)
                            .build();
                    aGuardar.add(regla);
                }
            }
            if (dto.getColaboradores() != null) {
                for (GuardarSupervisionDTO.ColaboradorAsignacion colab : dto.getColaboradores()) {
                    SupervisionAsistencia regla = SupervisionAsistencia.builder()
                            .idSupervisor(dto.getIdSupervisor())
                            .cedulaSupervisor(dto.getCedulaSupervisor())
                            .nombreSupervisor(dto.getNombreSupervisor())
                            .tipoAlcance("COLABORADOR")
                            .idArea(colab.getIdArea())
                            .nombreArea(colab.getNombreArea())
                            .cedulaColaborador(colab.getCedula())
                            .nombreColaborador(colab.getNombre())
                            .puedeAprobarHorasExtra(puedeAprobar)
                            .activo(activo)
                            .observacion(obs)
                            .dateCreate(now)
                            .dateModify(now)
                            .build();
                    aGuardar.add(regla);
                }
            }
            if (aGuardar.isEmpty()) {
                throw new IllegalArgumentException("Debe seleccionar al menos una Área o Colaborador.");
            }
        }

        // Eliminar configuraciones previas del supervisor para reemplazar limpiamente
        repository.deleteByIdSupervisor(dto.getIdSupervisor());
        repository.flush();

        if (!aGuardar.isEmpty()) {
            repository.saveAll(aGuardar);
        }
    }

    @Transactional
    public void toggleActivo(Integer id) {
        SupervisionAsistencia regla = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Regla de supervisión no encontrada"));
        regla.setActivo(!Boolean.TRUE.equals(regla.getActivo()));
        regla.setDateModify(LocalDateTime.now());
        repository.save(regla);
    }

    @Transactional
    public void toggleActivoSupervisor(Integer idSupervisor, boolean activo) {
        List<SupervisionAsistencia> reglas = repository.findByIdSupervisor(idSupervisor);
        for (SupervisionAsistencia r : reglas) {
            r.setActivo(activo);
            r.setDateModify(LocalDateTime.now());
        }
        repository.saveAll(reglas);
    }

    @Transactional
    public void eliminarRegla(Integer id) {
        repository.deleteById(id);
    }

    @Transactional
    public void eliminarPorSupervisor(Integer idSupervisor) {
        repository.deleteByIdSupervisor(idSupervisor);
        repository.flush();
    }

    public PermisosVisibilidadAsistenciaDTO obtenerMisPermisos(String cedula, Integer idUsuario) {
        List<SupervisionAsistencia> activas = new ArrayList<>();
        Set<Integer> idsVistos = new HashSet<>();

        if (idUsuario != null && idUsuario > 0) {
            List<SupervisionAsistencia> porId = repository.findByIdSupervisorAndActivoTrue(idUsuario);
            for (SupervisionAsistencia r : porId) {
                if (r.getIdSupervision() != null && idsVistos.add(r.getIdSupervision())) {
                    activas.add(r);
                }
            }
        }

        if (cedula != null && !cedula.trim().isEmpty()) {
            List<SupervisionAsistencia> porCedula = repository.findByCedulaSupervisorAndActivoTrue(cedula.trim());
            for (SupervisionAsistencia r : porCedula) {
                if (r.getIdSupervision() != null && idsVistos.add(r.getIdSupervision())) {
                    activas.add(r);
                }
            }
        }

        if (activas.isEmpty()) {
            return PermisosVisibilidadAsistenciaDTO.builder()
                    .esSupervisorConfigurado(false)
                    .accesoGlobal(false)
                    .areasPermitidas(Collections.emptyList())
                    .nombresAreasPermitidas(Collections.emptyList())
                    .cedulasPermitidas(Collections.emptyList())
                    .nombresColaboradoresPermitidos(Collections.emptyList())
                    .puedeAprobarHorasExtra(false)
                    .reglas(Collections.emptyList())
                    .build();
        }

        boolean global = activas.stream().anyMatch(r -> "GLOBAL".equalsIgnoreCase(r.getTipoAlcance()));
        boolean puedeAprobar = activas.stream().anyMatch(r -> Boolean.TRUE.equals(r.getPuedeAprobarHorasExtra()));

        List<Integer> areas = activas.stream()
                .map(SupervisionAsistencia::getIdArea)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        List<String> nombresAreas = activas.stream()
                .map(SupervisionAsistencia::getNombreArea)
                .filter(Objects::nonNull)
                .filter(s -> !s.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());

        List<String> cedulas = activas.stream()
                .map(SupervisionAsistencia::getCedulaColaborador)
                .filter(Objects::nonNull)
                .filter(s -> !s.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());

        List<String> nombresColaboradores = activas.stream()
                .map(SupervisionAsistencia::getNombreColaborador)
                .filter(Objects::nonNull)
                .filter(s -> !s.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());

        return PermisosVisibilidadAsistenciaDTO.builder()
                .esSupervisorConfigurado(true)
                .accesoGlobal(global)
                .areasPermitidas(areas)
                .nombresAreasPermitidas(nombresAreas)
                .cedulasPermitidas(cedulas)
                .nombresColaboradoresPermitidos(nombresColaboradores)
                .puedeAprobarHorasExtra(puedeAprobar)
                .reglas(activas.stream().map(this::convertirADTO).collect(Collectors.toList()))
                .build();
    }

    private SupervisionAsistenciaDTO convertirADTO(SupervisionAsistencia e) {
        return SupervisionAsistenciaDTO.builder()
                .idSupervision(e.getIdSupervision())
                .idSupervisor(e.getIdSupervisor())
                .cedulaSupervisor(e.getCedulaSupervisor())
                .nombreSupervisor(e.getNombreSupervisor())
                .tipoAlcance(e.getTipoAlcance())
                .idArea(e.getIdArea())
                .nombreArea(e.getNombreArea())
                .cedulaColaborador(e.getCedulaColaborador())
                .nombreColaborador(e.getNombreColaborador())
                .puedeAprobarHorasExtra(e.getPuedeAprobarHorasExtra())
                .activo(e.getActivo())
                .observacion(e.getObservacion())
                .dateCreate(e.getDateCreate())
                .dateModify(e.getDateModify())
                .build();
    }
}
