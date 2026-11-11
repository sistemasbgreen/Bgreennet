package com.bgreenNet.bgreenNet.dto;

/**
 * DTO de entrada para consultar requisiciones en el módulo de firmas digitales
 * por rango de fechas y filtros opcionales en el cuerpo de la petición.
 */
public class FirmaDigitalRequisicionRequestDTO {

    private String fechaInicio;
    private String fechaFin;
    private Integer consecDocto;
    private Integer idCia;
    private String tipoDocto;

    public String getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(String fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public String getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(String fechaFin) {
        this.fechaFin = fechaFin;
    }

    public Integer getConsecDocto() {
        return consecDocto;
    }

    public void setConsecDocto(Integer consecDocto) {
        this.consecDocto = consecDocto;
    }

    public Integer getIdCia() {
        return idCia;
    }

    public void setIdCia(Integer idCia) {
        this.idCia = idCia;
    }

    public String getTipoDocto() {
        return tipoDocto;
    }

    public void setTipoDocto(String tipoDocto) {
        this.tipoDocto = tipoDocto;
    }
}
