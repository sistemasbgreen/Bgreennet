package com.bgreenNet.bgreenNet.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO que representa el detalle de requisiciones internas y movimientos de inventario
 * consultados en Siesa para el módulo de firmas digitales.
 */
public class FirmaDigitalRequisicionDTO {

    private LocalDateTime f441FechaEntrega;
    private LocalDateTime f441Ts;
    private Long f441Rowid;
    private Long f441RowidDoctoReqInt;
    private Integer f441IdCia;
    private Long f441RowidItemExt;
    private Long f441RowidBodega;
    private Integer f441IdConcepto;
    private String f441IdMotivo;
    private String f441IdUnidadMedida;
    private BigDecimal f441Factor;
    private BigDecimal f441Cant1Consumida;
    private String f440IdTipoDocto;
    private Integer f440ConsecDocto;
    private Long f440RowidTercero;
    private String f440Referencia;
    private String f440Notas;
    private String f440UsuarioCreacion;
    private String f440UsuarioAprobacion;
    private String f440UsuarioCumplido;
    private Long f470RowidItemExt;
    private String f470IdUbicacionAux;
    private String f470IdPeriodo;
    private Long f470RowidMovtoReqInt;
    private String f120Descripcion;
    private String f120DescripcionCorta;
    private String f120Id;

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

    public Long getF441Rowid() {
        return f441Rowid;
    }

    public void setF441Rowid(Long f441Rowid) {
        this.f441Rowid = f441Rowid;
    }

    public Long getF441RowidDoctoReqInt() {
        return f441RowidDoctoReqInt;
    }

    public void setF441RowidDoctoReqInt(Long f441RowidDoctoReqInt) {
        this.f441RowidDoctoReqInt = f441RowidDoctoReqInt;
    }

    public Integer getF441IdCia() {
        return f441IdCia;
    }

    public void setF441IdCia(Integer f441IdCia) {
        this.f441IdCia = f441IdCia;
    }

    public Long getF441RowidItemExt() {
        return f441RowidItemExt;
    }

    public void setF441RowidItemExt(Long f441RowidItemExt) {
        this.f441RowidItemExt = f441RowidItemExt;
    }

    public Long getF441RowidBodega() {
        return f441RowidBodega;
    }

    public void setF441RowidBodega(Long f441RowidBodega) {
        this.f441RowidBodega = f441RowidBodega;
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

    public BigDecimal getF441Factor() {
        return f441Factor;
    }

    public void setF441Factor(BigDecimal f441Factor) {
        this.f441Factor = f441Factor;
    }

    public BigDecimal getF441Cant1Consumida() {
        return f441Cant1Consumida;
    }

    public void setF441Cant1Consumida(BigDecimal f441Cant1Consumida) {
        this.f441Cant1Consumida = f441Cant1Consumida;
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

    public Long getF470RowidItemExt() {
        return f470RowidItemExt;
    }

    public void setF470RowidItemExt(Long f470RowidItemExt) {
        this.f470RowidItemExt = f470RowidItemExt;
    }

    public String getF470IdUbicacionAux() {
        return f470IdUbicacionAux;
    }

    public void setF470IdUbicacionAux(String f470IdUbicacionAux) {
        this.f470IdUbicacionAux = f470IdUbicacionAux;
    }

    public String getF470IdPeriodo() {
        return f470IdPeriodo;
    }

    public void setF470IdPeriodo(String f470IdPeriodo) {
        this.f470IdPeriodo = f470IdPeriodo;
    }

    public Long getF470RowidMovtoReqInt() {
        return f470RowidMovtoReqInt;
    }

    public void setF470RowidMovtoReqInt(Long f470RowidMovtoReqInt) {
        this.f470RowidMovtoReqInt = f470RowidMovtoReqInt;
    }

    public String getF120Descripcion() {
        return f120Descripcion;
    }

    public void setF120Descripcion(String f120Descripcion) {
        this.f120Descripcion = f120Descripcion;
    }

    public String getF120DescripcionCorta() {
        return f120DescripcionCorta;
    }

    public void setF120DescripcionCorta(String f120DescripcionCorta) {
        this.f120DescripcionCorta = f120DescripcionCorta;
    }

    public String getF120Id() {
        return f120Id;
    }

    public void setF120Id(String f120Id) {
        this.f120Id = f120Id;
    }
}
