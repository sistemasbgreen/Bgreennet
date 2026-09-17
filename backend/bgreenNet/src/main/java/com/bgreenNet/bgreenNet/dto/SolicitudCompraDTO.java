package com.bgreenNet.bgreenNet.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolicitudCompraDTO {

    private LocalDateTime ts;
    private Long rowid;
    private String idTipoDocto;
    private Long consecDocto;
    private LocalDate fecha;
    private String idConcepto;
    private Integer indEstado;
    private Long rowidTerceroSolComp;
    private LocalDateTime fechaTsCreacion;
    private LocalDateTime fechaTsAnulacion;
    private LocalDateTime fechaTsAprobacion;
    private LocalDateTime fechaTsCumplido;
    private String usuarioCreacion;
    private String usuarioAprobacion;
    private String usuarioCumplido;
    private String notas;
    private String usuarioAprobacionMonto;

    // Getters y Setters explícitos para compatibilidad total
    public LocalDateTime getTs() {
        return ts;
    }

    public void setTs(LocalDateTime ts) {
        this.ts = ts;
    }

    public Long getRowid() {
        return rowid;
    }

    public void setRowid(Long rowid) {
        this.rowid = rowid;
    }

    public String getIdTipoDocto() {
        return idTipoDocto;
    }

    public void setIdTipoDocto(String idTipoDocto) {
        this.idTipoDocto = idTipoDocto;
    }

    public Long getConsecDocto() {
        return consecDocto;
    }

    public void setConsecDocto(Long consecDocto) {
        this.consecDocto = consecDocto;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public String getIdConcepto() {
        return idConcepto;
    }

    public void setIdConcepto(String idConcepto) {
        this.idConcepto = idConcepto;
    }

    public Integer getIndEstado() {
        return indEstado;
    }

    public void setIndEstado(Integer indEstado) {
        this.indEstado = indEstado;
    }

    public Long getRowidTerceroSolComp() {
        return rowidTerceroSolComp;
    }

    public void setRowidTerceroSolComp(Long rowidTerceroSolComp) {
        this.rowidTerceroSolComp = rowidTerceroSolComp;
    }

    public LocalDateTime getFechaTsCreacion() {
        return fechaTsCreacion;
    }

    public void setFechaTsCreacion(LocalDateTime fechaTsCreacion) {
        this.fechaTsCreacion = fechaTsCreacion;
    }

    public LocalDateTime getFechaTsAnulacion() {
        return fechaTsAnulacion;
    }

    public void setFechaTsAnulacion(LocalDateTime fechaTsAnulacion) {
        this.fechaTsAnulacion = fechaTsAnulacion;
    }

    public LocalDateTime getFechaTsAprobacion() {
        return fechaTsAprobacion;
    }

    public void setFechaTsAprobacion(LocalDateTime fechaTsAprobacion) {
        this.fechaTsAprobacion = fechaTsAprobacion;
    }

    public LocalDateTime getFechaTsCumplido() {
        return fechaTsCumplido;
    }

    public void setFechaTsCumplido(LocalDateTime fechaTsCumplido) {
        this.fechaTsCumplido = fechaTsCumplido;
    }

    public String getUsuarioCreacion() {
        return usuarioCreacion;
    }

    public void setUsuarioCreacion(String usuarioCreacion) {
        this.usuarioCreacion = usuarioCreacion;
    }

    public String getUsuarioAprobacion() {
        return usuarioAprobacion;
    }

    public void setUsuarioAprobacion(String usuarioAprobacion) {
        this.usuarioAprobacion = usuarioAprobacion;
    }

    public String getUsuarioCumplido() {
        return usuarioCumplido;
    }

    public void setUsuarioCumplido(String usuarioCumplido) {
        this.usuarioCumplido = usuarioCumplido;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public String getUsuarioAprobacionMonto() {
        return usuarioAprobacionMonto;
    }

    public void setUsuarioAprobacionMonto(String usuarioAprobacionMonto) {
        this.usuarioAprobacionMonto = usuarioAprobacionMonto;
    }
}
