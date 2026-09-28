package com.bgreenNet.bgreenNet.dto;

import java.util.ArrayList;
import java.util.List;

public class IndustrializacionDetalleDTO {
    private Integer anio;
    private Integer mes;
    private String nombreMes;
    private Double metaAnual;
    private Double metaMensual;
    private Integer mesesTranscurridos;

    private Double toneladasMes;
    private Double avanceMesPorcentaje;
    private Double pendienteMes;

    private Double toneladasAcumuladasYTD;
    private Double avanceAnualPorcentaje;
    private Double pendienteAnual;

    // Para compatibilidad previa (retorna el avance acumulado %)
    private Double resultado;

    private List<ProveedorAvanceDTO> proveedores = new ArrayList<>();

    public IndustrializacionDetalleDTO() {}

    public Integer getAnio() {
        return anio;
    }

    public void setAnio(Integer anio) {
        this.anio = anio;
    }

    public Integer getMes() {
        return mes;
    }

    public void setMes(Integer mes) {
        this.mes = mes;
    }

    public String getNombreMes() {
        return nombreMes;
    }

    public void setNombreMes(String nombreMes) {
        this.nombreMes = nombreMes;
    }

    public Double getMetaAnual() {
        return metaAnual;
    }

    public void setMetaAnual(Double metaAnual) {
        this.metaAnual = metaAnual;
    }

    public Double getMetaMensual() {
        return metaMensual;
    }

    public void setMetaMensual(Double metaMensual) {
        this.metaMensual = metaMensual;
    }

    public Integer getMesesTranscurridos() {
        return mesesTranscurridos;
    }

    public void setMesesTranscurridos(Integer mesesTranscurridos) {
        this.mesesTranscurridos = mesesTranscurridos;
    }

    public Double getToneladasMes() {
        return toneladasMes;
    }

    public void setToneladasMes(Double toneladasMes) {
        this.toneladasMes = toneladasMes;
    }

    public Double getAvanceMesPorcentaje() {
        return avanceMesPorcentaje;
    }

    public void setAvanceMesPorcentaje(Double avanceMesPorcentaje) {
        this.avanceMesPorcentaje = avanceMesPorcentaje;
    }

    public Double getPendienteMes() {
        return pendienteMes;
    }

    public void setPendienteMes(Double pendienteMes) {
        this.pendienteMes = pendienteMes;
    }

    public Double getToneladasAcumuladasYTD() {
        return toneladasAcumuladasYTD;
    }

    public void setToneladasAcumuladasYTD(Double toneladasAcumuladasYTD) {
        this.toneladasAcumuladasYTD = toneladasAcumuladasYTD;
    }

    public Double getAvanceAnualPorcentaje() {
        return avanceAnualPorcentaje;
    }

    public void setAvanceAnualPorcentaje(Double avanceAnualPorcentaje) {
        this.avanceAnualPorcentaje = avanceAnualPorcentaje;
    }

    public Double getPendienteAnual() {
        return pendienteAnual;
    }

    public void setPendienteAnual(Double pendienteAnual) {
        this.pendienteAnual = pendienteAnual;
    }

    public Double getResultado() {
        return resultado != null ? resultado : avanceAnualPorcentaje;
    }

    public void setResultado(Double resultado) {
        this.resultado = resultado;
    }

    public List<ProveedorAvanceDTO> getProveedores() {
        return proveedores;
    }

    public void setProveedores(List<ProveedorAvanceDTO> proveedores) {
        this.proveedores = proveedores;
    }
}
