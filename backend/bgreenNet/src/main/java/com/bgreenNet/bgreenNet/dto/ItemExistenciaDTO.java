package com.bgreenNet.bgreenNet.dto;

public class ItemExistenciaDTO {

    private Integer cia;
    private String itemId;
    private String descripcion;
    private String descripcionCorta;
    private String unidadInventario;
    private String tipoInvServ;
    private String descTipoInvServ;
    private String bodega;
    private String nombreBodega;
    private Double stockActual;
    private Double costoPromedio;
    private Double valorTotalInventario;

    public ItemExistenciaDTO() {
    }

    public ItemExistenciaDTO(Integer cia, String itemId, String descripcion, String descripcionCorta,
                             String unidadInventario, String tipoInvServ, String descTipoInvServ,
                             String bodega, String nombreBodega, Double stockActual,
                             Double costoPromedio, Double valorTotalInventario) {
        this.cia = cia;
        this.itemId = itemId;
        this.descripcion = descripcion;
        this.descripcionCorta = descripcionCorta;
        this.unidadInventario = unidadInventario;
        this.tipoInvServ = tipoInvServ;
        this.descTipoInvServ = descTipoInvServ;
        this.bodega = bodega;
        this.nombreBodega = nombreBodega;
        this.stockActual = stockActual;
        this.costoPromedio = costoPromedio;
        this.valorTotalInventario = valorTotalInventario;
    }

    public Integer getCia() {
        return cia;
    }

    public void setCia(Integer cia) {
        this.cia = cia;
    }

    public String getItemId() {
        return itemId;
    }

    public void setItemId(String itemId) {
        this.itemId = itemId;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getDescripcionCorta() {
        return descripcionCorta;
    }

    public void setDescripcionCorta(String descripcionCorta) {
        this.descripcionCorta = descripcionCorta;
    }

    public String getUnidadInventario() {
        return unidadInventario;
    }

    public void setUnidadInventario(String unidadInventario) {
        this.unidadInventario = unidadInventario;
    }

    public String getTipoInvServ() {
        return tipoInvServ;
    }

    public void setTipoInvServ(String tipoInvServ) {
        this.tipoInvServ = tipoInvServ;
    }

    public String getDescTipoInvServ() {
        return descTipoInvServ;
    }

    public void setDescTipoInvServ(String descTipoInvServ) {
        this.descTipoInvServ = descTipoInvServ;
    }

    public String getBodega() {
        return bodega;
    }

    public void setBodega(String bodega) {
        this.bodega = bodega;
    }

    public String getNombreBodega() {
        return nombreBodega;
    }

    public void setNombreBodega(String nombreBodega) {
        this.nombreBodega = nombreBodega;
    }

    public Double getStockActual() {
        return stockActual;
    }

    public void setStockActual(Double stockActual) {
        this.stockActual = stockActual;
    }

    public Double getCostoPromedio() {
        return costoPromedio;
    }

    public void setCostoPromedio(Double costoPromedio) {
        this.costoPromedio = costoPromedio;
    }

    public Double getValorTotalInventario() {
        return valorTotalInventario;
    }

    public void setValorTotalInventario(Double valorTotalInventario) {
        this.valorTotalInventario = valorTotalInventario;
    }
}
