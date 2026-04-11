package com.bgreenNet.bgreenNet.dto;

import java.time.LocalDate;

public class OpDoctoDTO {
    
    private String op;
    private String item;
    private String descripcion;
    private LocalDate fecha;
    private Double cantidadConsumida;
    
    // Cost fields
    private Double totalPurificacionGlicerina;
    private Double totalManoObra;
    private Double totalOtrosCostos;

    public String getOp() {
        return op;
    }

    public void setOp(String op) {
        this.op = op;
    }

    public String getItem() {
        return item;
    }

    public void setItem(String item) {
        this.item = item;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public Double getCantidadConsumida() {
        return cantidadConsumida;
    }

    public void setCantidadConsumida(Double cantidadConsumida) {
        this.cantidadConsumida = cantidadConsumida;
    }

    public Double getTotalPurificacionGlicerina() {
        return totalPurificacionGlicerina;
    }

    public void setTotalPurificacionGlicerina(Double totalPurificacionGlicerina) {
        this.totalPurificacionGlicerina = totalPurificacionGlicerina;
    }

    public Double getTotalManoObra() {
        return totalManoObra;
    }

    public void setTotalManoObra(Double totalManoObra) {
        this.totalManoObra = totalManoObra;
    }

    public Double getTotalOtrosCostos() {
        return totalOtrosCostos;
    }

    public void setTotalOtrosCostos(Double totalOtrosCostos) {
        this.totalOtrosCostos = totalOtrosCostos;
    }
}
