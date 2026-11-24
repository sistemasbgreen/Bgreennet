package com.bgreenNet.bgreenNet.dto;

import java.math.BigDecimal;

/**
 * DTO que representa las existencias de inventario en Siesa para la API compartida de Svision.
 */
public class InventarioSvisionDTO {

    private BigDecimal cantidadExistente;
    private BigDecimal costoPromedio;
    private String items;
    private String descripcion;
    private String und;
    private String tipoInventario;
    private String descripcionCorta;
    private String bodega;
    private String descripcionBodega;
    private String descripcionTipoInventario;

    public BigDecimal getCantidadExistente() {
        return cantidadExistente;
    }

    public void setCantidadExistente(BigDecimal cantidadExistente) {
        this.cantidadExistente = cantidadExistente;
    }

    public BigDecimal getCostoPromedio() {
        return costoPromedio;
    }

    public void setCostoPromedio(BigDecimal costoPromedio) {
        this.costoPromedio = costoPromedio;
    }

    public String getItems() {
        return items;
    }

    public void setItems(String items) {
        this.items = items;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getUnd() {
        return und;
    }

    public void setUnd(String und) {
        this.und = und;
    }

    public String getTipoInventario() {
        return tipoInventario;
    }

    public void setTipoInventario(String tipoInventario) {
        this.tipoInventario = tipoInventario;
    }

    public String getDescripcionCorta() {
        return descripcionCorta;
    }

    public void setDescripcionCorta(String descripcionCorta) {
        this.descripcionCorta = descripcionCorta;
    }

    public String getBodega() {
        return bodega;
    }

    public void setBodega(String bodega) {
        this.bodega = bodega;
    }

    public String getDescripcionBodega() {
        return descripcionBodega;
    }

    public void setDescripcionBodega(String descripcionBodega) {
        this.descripcionBodega = descripcionBodega;
    }

    public String getDescripcionTipoInventario() {
        return descripcionTipoInventario;
    }

    public void setDescripcionTipoInventario(String descripcionTipoInventario) {
        this.descripcionTipoInventario = descripcionTipoInventario;
    }
}
