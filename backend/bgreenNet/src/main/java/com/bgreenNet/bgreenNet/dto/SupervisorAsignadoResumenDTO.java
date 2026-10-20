package com.bgreenNet.bgreenNet.dto;

import java.util.ArrayList;
import java.util.List;

public class SupervisorAsignadoResumenDTO {
    private Integer idSupervisor;
    private String cedulaSupervisor;
    private String nombreSupervisor;
    private String cargoSupervisor;
    private String areaSupervisor;
    private String tipoAlcance; // 'GLOBAL', 'AREA', 'COLABORADOR', 'MIXTO'
    private int totalAreas;
    private int totalColaboradores;
    private List<String> areasNombres = new ArrayList<>();
    private List<String> colaboradoresNombres = new ArrayList<>();
    private Boolean puedeAprobarHorasExtra;
    private Boolean activo;
    private String observacion;
    private List<SupervisionAsistenciaDTO> reglas = new ArrayList<>();

    public SupervisorAsignadoResumenDTO() {
    }

    public SupervisorAsignadoResumenDTO(Integer idSupervisor, String cedulaSupervisor, String nombreSupervisor,
            String cargoSupervisor, String areaSupervisor, String tipoAlcance, int totalAreas,
            int totalColaboradores, List<String> areasNombres, List<String> colaboradoresNombres,
            Boolean puedeAprobarHorasExtra, Boolean activo, String observacion,
            List<SupervisionAsistenciaDTO> reglas) {
        this.idSupervisor = idSupervisor;
        this.cedulaSupervisor = cedulaSupervisor;
        this.nombreSupervisor = nombreSupervisor;
        this.cargoSupervisor = cargoSupervisor;
        this.areaSupervisor = areaSupervisor;
        this.tipoAlcance = tipoAlcance;
        this.totalAreas = totalAreas;
        this.totalColaboradores = totalColaboradores;
        this.areasNombres = areasNombres != null ? areasNombres : new ArrayList<>();
        this.colaboradoresNombres = colaboradoresNombres != null ? colaboradoresNombres : new ArrayList<>();
        this.puedeAprobarHorasExtra = puedeAprobarHorasExtra;
        this.activo = activo;
        this.observacion = observacion;
        this.reglas = reglas != null ? reglas : new ArrayList<>();
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

    public String getCargoSupervisor() {
        return cargoSupervisor;
    }

    public void setCargoSupervisor(String cargoSupervisor) {
        this.cargoSupervisor = cargoSupervisor;
    }

    public String getAreaSupervisor() {
        return areaSupervisor;
    }

    public void setAreaSupervisor(String areaSupervisor) {
        this.areaSupervisor = areaSupervisor;
    }

    public String getTipoAlcance() {
        return tipoAlcance;
    }

    public void setTipoAlcance(String tipoAlcance) {
        this.tipoAlcance = tipoAlcance;
    }

    public int getTotalAreas() {
        return totalAreas;
    }

    public void setTotalAreas(int totalAreas) {
        this.totalAreas = totalAreas;
    }

    public int getTotalColaboradores() {
        return totalColaboradores;
    }

    public void setTotalColaboradores(int totalColaboradores) {
        this.totalColaboradores = totalColaboradores;
    }

    public List<String> getAreasNombres() {
        return areasNombres;
    }

    public void setAreasNombres(List<String> areasNombres) {
        this.areasNombres = areasNombres;
    }

    public List<String> getColaboradoresNombres() {
        return colaboradoresNombres;
    }

    public void setColaboradoresNombres(List<String> colaboradoresNombres) {
        this.colaboradoresNombres = colaboradoresNombres;
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

    public List<SupervisionAsistenciaDTO> getReglas() {
        return reglas;
    }

    public void setReglas(List<SupervisionAsistenciaDTO> reglas) {
        this.reglas = reglas;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Integer idSupervisor;
        private String cedulaSupervisor;
        private String nombreSupervisor;
        private String cargoSupervisor;
        private String areaSupervisor;
        private String tipoAlcance;
        private int totalAreas;
        private int totalColaboradores;
        private List<String> areasNombres = new ArrayList<>();
        private List<String> colaboradoresNombres = new ArrayList<>();
        private Boolean puedeAprobarHorasExtra;
        private Boolean activo;
        private String observacion;
        private List<SupervisionAsistenciaDTO> reglas = new ArrayList<>();

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

        public Builder cargoSupervisor(String cargoSupervisor) {
            this.cargoSupervisor = cargoSupervisor;
            return this;
        }

        public Builder areaSupervisor(String areaSupervisor) {
            this.areaSupervisor = areaSupervisor;
            return this;
        }

        public Builder tipoAlcance(String tipoAlcance) {
            this.tipoAlcance = tipoAlcance;
            return this;
        }

        public Builder totalAreas(int totalAreas) {
            this.totalAreas = totalAreas;
            return this;
        }

        public Builder totalColaboradores(int totalColaboradores) {
            this.totalColaboradores = totalColaboradores;
            return this;
        }

        public Builder areasNombres(List<String> areasNombres) {
            this.areasNombres = areasNombres;
            return this;
        }

        public Builder colaboradoresNombres(List<String> colaboradoresNombres) {
            this.colaboradoresNombres = colaboradoresNombres;
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

        public Builder reglas(List<SupervisionAsistenciaDTO> reglas) {
            this.reglas = reglas;
            return this;
        }

        public SupervisorAsignadoResumenDTO build() {
            return new SupervisorAsignadoResumenDTO(
                    idSupervisor, cedulaSupervisor, nombreSupervisor, cargoSupervisor,
                    areaSupervisor, tipoAlcance, totalAreas, totalColaboradores,
                    areasNombres, colaboradoresNombres, puedeAprobarHorasExtra,
                    activo, observacion, reglas
            );
        }
    }
}
