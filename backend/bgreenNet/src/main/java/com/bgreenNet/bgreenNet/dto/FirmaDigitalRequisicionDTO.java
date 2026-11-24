package com.bgreenNet.bgreenNet.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO que representa los movimientos de requisición interna, movimientos de inventario,
 * documentos contables, tercero solicitante y centro de costos en Siesa.
 */
public class FirmaDigitalRequisicionDTO {

    private String f470IdUbicacionAux;
    private BigDecimal f470CostoPromTot;
    private LocalDateTime f441FechaEntrega;
    private LocalDateTime f441Ts;
    private Integer f441IdConcepto;
    private String f441IdMotivo;
    private String f441IdUnidadMedida;
    private BigDecimal f441Cant1Consumida;
    private String f150Id;
    private String f010RazonSocial;
    private String f010Nit;
    private String f440IdTipoDocto;
    private Integer f440ConsecDocto;
    private Long f440RowidTercero;
    private String f440Referencia;
    private String f440Notas;
    private String f440UsuarioCreacion;
    private String f440UsuarioAprobacion;
    private String f440UsuarioCumplido;
    private Integer f440IndEstado;
    private Long f440RowidTerceroSol;
    private String f440UsuarioParcial;
    private String f120Id;
    private String f120Descripcion;
    private String f350IdTipoDocto;
    private Integer f350ConsecDocto;
    private LocalDateTime f350Fecha;
    private String f200RazonSocial;
    private String f284Id;

    public String getF470IdUbicacionAux() {
        return f470IdUbicacionAux;
    }

    public void setF470IdUbicacionAux(String f470IdUbicacionAux) {
        this.f470IdUbicacionAux = f470IdUbicacionAux;
    }

    public BigDecimal getF470CostoPromTot() {
        return f470CostoPromTot;
    }

    public void setF470CostoPromTot(BigDecimal f470CostoPromTot) {
        this.f470CostoPromTot = f470CostoPromTot;
    }

    public LocalDateTime getF441FechaEntrega() {
        return f441FechaEntrega;
    }

    public void setF441FechaEntrega(LocalDateTime f441FechaEntrega) {
        this.f441FechaEntrega = f441FechaEntrega;
    }

    public LocalDateTime getF441Ts() {
        return f441Ts;
    }

    public void setF441Ts(LocalDateTime f441Ts) {
        this.f441Ts = f441Ts;
    }

    public Integer getF441IdConcepto() {
        return f441IdConcepto;
    }

    public void setF441IdConcepto(Integer f441IdConcepto) {
        this.f441IdConcepto = f441IdConcepto;
    }

    public String getF441IdMotivo() {
        return f441IdMotivo;
    }

    public void setF441IdMotivo(String f441IdMotivo) {
        this.f441IdMotivo = f441IdMotivo;
    }

    public String getF441IdUnidadMedida() {
        return f441IdUnidadMedida;
    }

    public void setF441IdUnidadMedida(String f441IdUnidadMedida) {
        this.f441IdUnidadMedida = f441IdUnidadMedida;
    }

    public BigDecimal getF441Cant1Consumida() {
        return f441Cant1Consumida;
    }

    public void setF441Cant1Consumida(BigDecimal f441Cant1Consumida) {
        this.f441Cant1Consumida = f441Cant1Consumida;
    }

    public String getF150Id() {
        return f150Id;
    }

    public void setF150Id(String f150Id) {
        this.f150Id = f150Id;
    }

    public String getF010RazonSocial() {
        return f010RazonSocial;
    }

    public void setF010RazonSocial(String f010RazonSocial) {
        this.f010RazonSocial = f010RazonSocial;
    }

    public String getF010Nit() {
        return f010Nit;
    }

    public void setF010Nit(String f010Nit) {
        this.f010Nit = f010Nit;
    }

    public String getF440IdTipoDocto() {
        return f440IdTipoDocto;
    }

    public void setF440IdTipoDocto(String f440IdTipoDocto) {
        this.f440IdTipoDocto = f440IdTipoDocto;
    }

    public Integer getF440ConsecDocto() {
        return f440ConsecDocto;
    }

    public void setF440ConsecDocto(Integer f440ConsecDocto) {
        this.f440ConsecDocto = f440ConsecDocto;
    }

    public Long getF440RowidTercero() {
        return f440RowidTercero;
    }

    public void setF440RowidTercero(Long f440RowidTercero) {
        this.f440RowidTercero = f440RowidTercero;
    }

    public String getF440Referencia() {
        return f440Referencia;
    }

    public void setF440Referencia(String f440Referencia) {
        this.f440Referencia = f440Referencia;
    }

    public String getF440Notas() {
        return f440Notas;
    }

    public void setF440Notas(String f440Notas) {
        this.f440Notas = f440Notas;
    }

    public String getF440UsuarioCreacion() {
        return f440UsuarioCreacion;
    }

    public void setF440UsuarioCreacion(String f440UsuarioCreacion) {
        this.f440UsuarioCreacion = f440UsuarioCreacion;
    }

    public String getF440UsuarioAprobacion() {
        return f440UsuarioAprobacion;
    }

    public void setF440UsuarioAprobacion(String f440UsuarioAprobacion) {
        this.f440UsuarioAprobacion = f440UsuarioAprobacion;
    }

    public String getF440UsuarioCumplido() {
        return f440UsuarioCumplido;
    }

    public void setF440UsuarioCumplido(String f440UsuarioCumplido) {
        this.f440UsuarioCumplido = f440UsuarioCumplido;
    }

    public Integer getF440IndEstado() {
        return f440IndEstado;
    }

    public void setF440IndEstado(Integer f440IndEstado) {
        this.f440IndEstado = f440IndEstado;
    }

    public Long getF440RowidTerceroSol() {
        return f440RowidTerceroSol;
    }

    public void setF440RowidTerceroSol(Long f440RowidTerceroSol) {
        this.f440RowidTerceroSol = f440RowidTerceroSol;
    }

    public String getF440UsuarioParcial() {
        return f440UsuarioParcial;
    }

    public void setF440UsuarioParcial(String f440UsuarioParcial) {
        this.f440UsuarioParcial = f440UsuarioParcial;
    }

    public String getF120Id() {
        return f120Id;
    }

    public void setF120Id(String f120Id) {
        this.f120Id = f120Id;
    }

    public String getF120Descripcion() {
        return f120Descripcion;
    }

    public void setF120Descripcion(String f120Descripcion) {
        this.f120Descripcion = f120Descripcion;
    }

    public String getF350IdTipoDocto() {
        return f350IdTipoDocto;
    }

    public void setF350IdTipoDocto(String f350IdTipoDocto) {
        this.f350IdTipoDocto = f350IdTipoDocto;
    }

    public Integer getF350ConsecDocto() {
        return f350ConsecDocto;
    }

    public void setF350ConsecDocto(Integer f350ConsecDocto) {
        this.f350ConsecDocto = f350ConsecDocto;
    }

    public LocalDateTime getF350Fecha() {
        return f350Fecha;
    }

    public void setF350Fecha(LocalDateTime f350Fecha) {
        this.f350Fecha = f350Fecha;
    }

    public String getF200RazonSocial() {
        return f200RazonSocial;
    }

    public void setF200RazonSocial(String f200RazonSocial) {
        this.f200RazonSocial = f200RazonSocial;
    }

    public String getF284Id() {
        return f284Id;
    }

    public void setF284Id(String f284Id) {
        this.f284Id = f284Id;
    }
}
