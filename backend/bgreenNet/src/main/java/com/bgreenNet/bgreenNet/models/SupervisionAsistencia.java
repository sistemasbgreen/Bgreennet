package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "configuracion_supervision_asistencia")
public class SupervisionAsistencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_supervision")
    private Integer idSupervision;

    @Column(name = "id_supervisor", nullable = false)
    private Integer idSupervisor;

    @Column(name = "cedula_supervisor", length = 50, nullable = false)
    private String cedulaSupervisor;

    @Column(name = "nombre_supervisor", length = 200, nullable = false)
    private String nombreSupervisor;

    @Column(name = "tipo_alcance", length = 30, nullable = false)
    private String tipoAlcance; // "GLOBAL", "AREA", "COLABORADOR"

    @Column(name = "id_area")
    private Integer idArea;

    @Column(name = "nombre_area", length = 150)
    private String nombreArea;

    @Column(name = "cedula_colaborador", length = 50)
    private String cedulaColaborador;

    @Column(name = "nombre_colaborador", length = 200)
    private String nombreColaborador;

    @Column(name = "puede_aprobar_horas_extra", nullable = false)
    private Boolean puedeAprobarHorasExtra = true;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "observacion", length = 300)
    private String observacion;

    @Column(name = "date_create", nullable = false, updatable = false)
    private LocalDateTime dateCreate;

    @Column(name = "date_modify", nullable = false)
    private LocalDateTime dateModify;

    public SupervisionAsistencia() {
    }

    public SupervisionAsistencia(Integer idSupervision, Integer idSupervisor, String cedulaSupervisor,
            String nombreSupervisor, String tipoAlcance, Integer idArea, String nombreArea,
            String cedulaColaborador, String nombreColaborador, Boolean puedeAprobarHorasExtra,
            Boolean activo, String observacion, LocalDateTime dateCreate, LocalDateTime dateModify) {
        this.idSupervision = idSupervision;
        this.idSupervisor = idSupervisor;
        this.cedulaSupervisor = cedulaSupervisor;
        this.nombreSupervisor = nombreSupervisor;
        this.tipoAlcance = tipoAlcance;
        this.idArea = idArea;
        this.nombreArea = nombreArea;
        this.cedulaColaborador = cedulaColaborador;
        this.nombreColaborador = nombreColaborador;
        this.puedeAprobarHorasExtra = puedeAprobarHorasExtra != null ? puedeAprobarHorasExtra : true;
        this.activo = activo != null ? activo : true;
        this.observacion = observacion;
        this.dateCreate = dateCreate;
        this.dateModify = dateModify;
    }

    @PrePersist
    protected void onCreate() {
        if (dateCreate == null) {
            dateCreate = LocalDateTime.now();
        }
        if (dateModify == null) {
            dateModify = LocalDateTime.now();
        }
        if (activo == null) {
            activo = true;
        }
        if (puedeAprobarHorasExtra == null) {
            puedeAprobarHorasExtra = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        dateModify = LocalDateTime.now();
    }

    public Integer getIdSupervision() {
        return idSupervision;
    }

    public void setIdSupervision(Integer idSupervision) {
        this.idSupervision = idSupervision;
    }

    public Integer getIdSupervisor() {
        return idSupervisor;
    }

    public void setIdSupervisor(Integer idSupervisor) {
        this.idSupervisor = idSupervisor;
    }

    public String getCedulaSupervisor() {
        return cedulaSupervisor;
    }

    public void setCedulaSupervisor(String cedulaSupervisor) {
        this.cedulaSupervisor = cedulaSupervisor;
    }

    public String getNombreSupervisor() {
        return nombreSupervisor;
    }

    public void setNombreSupervisor(String nombreSupervisor) {
        this.nombreSupervisor = nombreSupervisor;
    }

    public String getTipoAlcance() {
        return tipoAlcance;
    }

    public void setTipoAlcance(String tipoAlcance) {
        this.tipoAlcance = tipoAlcance;
    }

    public Integer getIdArea() {
        return idArea;
    }

    public void setIdArea(Integer idArea) {
        this.idArea = idArea;
    }

    public String getNombreArea() {
        return nombreArea;
    }

    public void setNombreArea(String nombreArea) {
        this.nombreArea = nombreArea;
    }

    public String getCedulaColaborador() {
        return cedulaColaborador;
    }

    public void setCedulaColaborador(String cedulaColaborador) {
        this.cedulaColaborador = cedulaColaborador;
    }

    public String getNombreColaborador() {
        return nombreColaborador;
    }

    public void setNombreColaborador(String nombreColaborador) {
        this.nombreColaborador = nombreColaborador;
    }

    public Boolean getPuedeAprobarHorasExtra() {
        return puedeAprobarHorasExtra;
    }

    public void setPuedeAprobarHorasExtra(Boolean puedeAprobarHorasExtra) {
        this.puedeAprobarHorasExtra = puedeAprobarHorasExtra;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public String getObservacion() {
        return observacion;
    }

    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }

    public LocalDateTime getDateCreate() {
        return dateCreate;
    }

    public void setDateCreate(LocalDateTime dateCreate) {
        this.dateCreate = dateCreate;
    }

    public LocalDateTime getDateModify() {
        return dateModify;
    }

    public void setDateModify(LocalDateTime dateModify) {
        this.dateModify = dateModify;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Integer idSupervision;
        private Integer idSupervisor;
        private String cedulaSupervisor;
        private String nombreSupervisor;
        private String tipoAlcance;
        private Integer idArea;
        private String nombreArea;
        private String cedulaColaborador;
        private String nombreColaborador;
        private Boolean puedeAprobarHorasExtra = true;
        private Boolean activo = true;
        private String observacion;
        private LocalDateTime dateCreate;
        private LocalDateTime dateModify;

        public Builder idSupervision(Integer idSupervision) {
            this.idSupervision = idSupervision;
            return this;
        }

        public Builder idSupervisor(Integer idSupervisor) {
            this.idSupervisor = idSupervisor;
            return this;
        }

        public Builder cedulaSupervisor(String cedulaSupervisor) {
            this.cedulaSupervisor = cedulaSupervisor;
            return this;
        }

        public Builder nombreSupervisor(String nombreSupervisor) {
            this.nombreSupervisor = nombreSupervisor;
            return this;
        }

        public Builder tipoAlcance(String tipoAlcance) {
            this.tipoAlcance = tipoAlcance;
            return this;
        }

        public Builder idArea(Integer idArea) {
            this.idArea = idArea;
            return this;
        }

        public Builder nombreArea(String nombreArea) {
            this.nombreArea = nombreArea;
            return this;
        }

        public Builder cedulaColaborador(String cedulaColaborador) {
            this.cedulaColaborador = cedulaColaborador;
            return this;
        }

        public Builder nombreColaborador(String nombreColaborador) {
            this.nombreColaborador = nombreColaborador;
            return this;
        }

        public Builder puedeAprobarHorasExtra(Boolean puedeAprobarHorasExtra) {
            this.puedeAprobarHorasExtra = puedeAprobarHorasExtra;
            return this;
        }

        public Builder activo(Boolean activo) {
            this.activo = activo;
            return this;
        }

        public Builder observacion(String observacion) {
            this.observacion = observacion;
            return this;
        }

        public Builder dateCreate(LocalDateTime dateCreate) {
            this.dateCreate = dateCreate;
            return this;
        }

        public Builder dateModify(LocalDateTime dateModify) {
            this.dateModify = dateModify;
            return this;
        }

        public SupervisionAsistencia build() {
            return new SupervisionAsistencia(
                    idSupervision, idSupervisor, cedulaSupervisor, nombreSupervisor,
                    tipoAlcance, idArea, nombreArea, cedulaColaborador, nombreColaborador,
                    puedeAprobarHorasExtra, activo, observacion, dateCreate, dateModify
            );
        }
    }
}
