package com.bgreenNet.bgreenNet.dto;

public class ProveedorAvanceDTO {
    private String nit;
    private String nombre;
    private Double toneladasMes;
    private Double porcentajeMes;
    private Double toneladasAcumuladas;
    private Double porcentajeAcumulado;
    private Double participacionDonaPorcentaje;

    public ProveedorAvanceDTO() {}

    public ProveedorAvanceDTO(String nit, String nombre, Double toneladasMes, Double porcentajeMes, Double toneladasAcumuladas, Double porcentajeAcumulado, Double participacionDonaPorcentaje) {
        this.nit = nit;
        this.nombre = nombre;
        this.toneladasMes = toneladasMes;
        this.porcentajeMes = porcentajeMes;
        this.toneladasAcumuladas = toneladasAcumuladas;
        this.porcentajeAcumulado = porcentajeAcumulado;
        this.participacionDonaPorcentaje = participacionDonaPorcentaje;
    }

    public String getNit() {
        return nit;
    }

    public void setNit(String nit) {
        this.nit = nit;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Double getToneladasMes() {
        return toneladasMes;
    }

    public void setToneladasMes(Double toneladasMes) {
        this.toneladasMes = toneladasMes;
    }

    public Double getPorcentajeMes() {
        return porcentajeMes;
    }

    public void setPorcentajeMes(Double porcentajeMes) {
        this.porcentajeMes = porcentajeMes;
    }

    public Double getToneladasAcumuladas() {
        return toneladasAcumuladas;
    }

    public void setToneladasAcumuladas(Double toneladasAcumuladas) {
        this.toneladasAcumuladas = toneladasAcumuladas;
    }

    public Double getPorcentajeAcumulado() {
        return porcentajeAcumulado;
    }

    public void setPorcentajeAcumulado(Double porcentajeAcumulado) {
        this.porcentajeAcumulado = porcentajeAcumulado;
    }

    public Double getParticipacionDonaPorcentaje() {
        return participacionDonaPorcentaje;
    }

    public void setParticipacionDonaPorcentaje(Double participacionDonaPorcentaje) {
        this.participacionDonaPorcentaje = participacionDonaPorcentaje;
    }
}
