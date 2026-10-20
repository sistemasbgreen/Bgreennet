package com.bgreenNet.bgreenNet.dto;

import java.util.List;

public class GuardarSupervisionDTO {
    private Integer idSupervisor;
    private String cedulaSupervisor;
    private String nombreSupervisor;
    private String tipoAlcance; // "GLOBAL", "AREA", "COLABORADOR"

    // Si tipoAlcance == 'AREA'
    private List<AreaAsignacion> areas;

    // Si tipoAlcance == 'COLABORADOR'
    private List<ColaboradorAsignacion> colaboradores;

    private Boolean puedeAprobarHorasExtra;
    private Boolean activo;
    private String observacion;

    public GuardarSupervisionDTO() {
    }

    public GuardarSupervisionDTO(Integer idSupervisor, String cedulaSupervisor, String nombreSupervisor,
            String tipoAlcance, List<AreaAsignacion> areas, List<ColaboradorAsignacion> colaboradores,
            Boolean puedeAprobarHorasExtra, Boolean activo, String observacion) {
        this.idSupervisor = idSupervisor;
        this.cedulaSupervisor = cedulaSupervisor;
        this.nombreSupervisor = nombreSupervisor;
        this.tipoAlcance = tipoAlcance;
        this.areas = areas;
        this.colaboradores = colaboradores;
        this.puedeAprobarHorasExtra = puedeAprobarHorasExtra;
        this.activo = activo;
        this.observacion = observacion;
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

    public List<AreaAsignacion> getAreas() {
        return areas;
    }

    public void setAreas(List<AreaAsignacion> areas) {
        this.areas = areas;
    }

    public List<ColaboradorAsignacion> getColaboradores() {
        return colaboradores;
    }

    public void setColaboradores(List<ColaboradorAsignacion> colaboradores) {
        this.colaboradores = colaboradores;
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

    public static class AreaAsignacion {
        private Integer idArea;
        private String nombreArea;

        public AreaAsignacion() {
        }

        public AreaAsignacion(Integer idArea, String nombreArea) {
            this.idArea = idArea;
            this.nombreArea = nombreArea;
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
    }

    public static class ColaboradorAsignacion {
        private String cedula;
        private String nombre;
        private Integer idArea;
        private String nombreArea;

        public ColaboradorAsignacion() {
        }

        public ColaboradorAsignacion(String cedula, String nombre, Integer idArea, String nombreArea) {
            this.cedula = cedula;
            this.nombre = nombre;
            this.idArea = idArea;
            this.nombreArea = nombreArea;
        }

        public String getCedula() {
            return cedula;
        }

        public void setCedula(String cedula) {
            this.cedula = cedula;
        }

        public String getNombre() {
            return nombre;
        }

        public void setNombre(String nombre) {
            this.nombre = nombre;
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
    }
}
