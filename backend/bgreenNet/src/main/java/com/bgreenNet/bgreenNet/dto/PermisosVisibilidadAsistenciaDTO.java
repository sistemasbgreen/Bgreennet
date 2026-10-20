package com.bgreenNet.bgreenNet.dto;

import java.util.ArrayList;
import java.util.List;

public class PermisosVisibilidadAsistenciaDTO {
    private Boolean esSupervisorConfigurado = false;
    private Boolean accesoGlobal = false;
    private List<Integer> areasPermitidas = new ArrayList<>();
    private List<String> nombresAreasPermitidas = new ArrayList<>();
    private List<String> cedulasPermitidas = new ArrayList<>();
    private List<String> nombresColaboradoresPermitidos = new ArrayList<>();
    private Boolean puedeAprobarHorasExtra = false;
    private List<SupervisionAsistenciaDTO> reglas = new ArrayList<>();

    public PermisosVisibilidadAsistenciaDTO() {
    }

    public PermisosVisibilidadAsistenciaDTO(Boolean esSupervisorConfigurado, Boolean accesoGlobal,
            List<Integer> areasPermitidas, List<String> nombresAreasPermitidas,
            List<String> cedulasPermitidas, List<String> nombresColaboradoresPermitidos,
            Boolean puedeAprobarHorasExtra, List<SupervisionAsistenciaDTO> reglas) {
        this.esSupervisorConfigurado = esSupervisorConfigurado != null ? esSupervisorConfigurado : false;
        this.accesoGlobal = accesoGlobal != null ? accesoGlobal : false;
        this.areasPermitidas = areasPermitidas != null ? areasPermitidas : new ArrayList<>();
        this.nombresAreasPermitidas = nombresAreasPermitidas != null ? nombresAreasPermitidas : new ArrayList<>();
        this.cedulasPermitidas = cedulasPermitidas != null ? cedulasPermitidas : new ArrayList<>();
        this.nombresColaboradoresPermitidos = nombresColaboradoresPermitidos != null ? nombresColaboradoresPermitidos : new ArrayList<>();
        this.puedeAprobarHorasExtra = puedeAprobarHorasExtra != null ? puedeAprobarHorasExtra : false;
        this.reglas = reglas != null ? reglas : new ArrayList<>();
    }

    public Boolean getEsSupervisorConfigurado() {
        return esSupervisorConfigurado;
    }

    public void setEsSupervisorConfigurado(Boolean esSupervisorConfigurado) {
        this.esSupervisorConfigurado = esSupervisorConfigurado;
    }

    public Boolean getAccesoGlobal() {
        return accesoGlobal;
    }

    public void setAccesoGlobal(Boolean accesoGlobal) {
        this.accesoGlobal = accesoGlobal;
    }

    public List<Integer> getAreasPermitidas() {
        return areasPermitidas;
    }

    public void setAreasPermitidas(List<Integer> areasPermitidas) {
        this.areasPermitidas = areasPermitidas;
    }

    public List<String> getNombresAreasPermitidas() {
        return nombresAreasPermitidas;
    }

    public void setNombresAreasPermitidas(List<String> nombresAreasPermitidas) {
        this.nombresAreasPermitidas = nombresAreasPermitidas;
    }

    public List<String> getCedulasPermitidas() {
        return cedulasPermitidas;
    }

    public void setCedulasPermitidas(List<String> cedulasPermitidas) {
        this.cedulasPermitidas = cedulasPermitidas;
    }

    public List<String> getNombresColaboradoresPermitidos() {
        return nombresColaboradoresPermitidos;
    }

    public void setNombresColaboradoresPermitidos(List<String> nombresColaboradoresPermitidos) {
        this.nombresColaboradoresPermitidos = nombresColaboradoresPermitidos;
    }

    public Boolean getPuedeAprobarHorasExtra() {
        return puedeAprobarHorasExtra;
    }

    public void setPuedeAprobarHorasExtra(Boolean puedeAprobarHorasExtra) {
        this.puedeAprobarHorasExtra = puedeAprobarHorasExtra;
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
        private Boolean esSupervisorConfigurado = false;
        private Boolean accesoGlobal = false;
        private List<Integer> areasPermitidas = new ArrayList<>();
        private List<String> nombresAreasPermitidas = new ArrayList<>();
        private List<String> cedulasPermitidas = new ArrayList<>();
        private List<String> nombresColaboradoresPermitidos = new ArrayList<>();
        private Boolean puedeAprobarHorasExtra = false;
        private List<SupervisionAsistenciaDTO> reglas = new ArrayList<>();

        public Builder esSupervisorConfigurado(Boolean esSupervisorConfigurado) {
            this.esSupervisorConfigurado = esSupervisorConfigurado;
            return this;
        }

        public Builder accesoGlobal(Boolean accesoGlobal) {
            this.accesoGlobal = accesoGlobal;
            return this;
        }

        public Builder areasPermitidas(List<Integer> areasPermitidas) {
            this.areasPermitidas = areasPermitidas;
            return this;
        }

        public Builder nombresAreasPermitidas(List<String> nombresAreasPermitidas) {
            this.nombresAreasPermitidas = nombresAreasPermitidas;
            return this;
        }

        public Builder cedulasPermitidas(List<String> cedulasPermitidas) {
            this.cedulasPermitidas = cedulasPermitidas;
            return this;
        }

        public Builder nombresColaboradoresPermitidos(List<String> nombresColaboradoresPermitidos) {
            this.nombresColaboradoresPermitidos = nombresColaboradoresPermitidos;
            return this;
        }

        public Builder puedeAprobarHorasExtra(Boolean puedeAprobarHorasExtra) {
            this.puedeAprobarHorasExtra = puedeAprobarHorasExtra;
            return this;
        }

        public Builder reglas(List<SupervisionAsistenciaDTO> reglas) {
            this.reglas = reglas;
            return this;
        }

        public PermisosVisibilidadAsistenciaDTO build() {
            return new PermisosVisibilidadAsistenciaDTO(
                    esSupervisorConfigurado, accesoGlobal, areasPermitidas,
                    nombresAreasPermitidas, cedulasPermitidas,
                    nombresColaboradoresPermitidos, puedeAprobarHorasExtra, reglas
            );
        }
    }
}
