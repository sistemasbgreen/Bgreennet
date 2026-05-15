package com.bgreenNet.bgreenNet.dto;

import java.time.LocalDate;
import java.util.List;

public class ReporteProduccionDTO {
    private LocalDate fecha;
    private List<DetalleInsumoDTO> itemsBiodiesel;
    private List<DetalleInsumoDTO> itemsGlicerina;
    private ResumenCostosDTO costos;
    private String idOrden;

    // Getters and Setters explicitos para asegurar compatibilidad sin depender de Lombok
    public String getIdOrden() {
        return idOrden;
    }

    public void setIdOrden(String idOrden) {
        this.idOrden = idOrden;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public List<DetalleInsumoDTO> getItemsBiodiesel() {
        return itemsBiodiesel;
    }

    public void setItemsBiodiesel(List<DetalleInsumoDTO> itemsBiodiesel) {
        this.itemsBiodiesel = itemsBiodiesel;
    }

    public List<DetalleInsumoDTO> getItemsGlicerina() {
        return itemsGlicerina;
    }

    public void setItemsGlicerina(List<DetalleInsumoDTO> itemsGlicerina) {
        this.itemsGlicerina = itemsGlicerina;
    }

    public ResumenCostosDTO getCostos() {
        return costos;
    }

    public void setCostos(ResumenCostosDTO costos) {
        this.costos = costos;
    }
}
