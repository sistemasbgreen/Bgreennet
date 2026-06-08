package com.bgreenNet.bgreenNet.models;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "variables_scada")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VariableScadaConfig {

    @Id
    @Column(name = "tag", length = 50)
    private String tag;

    @Column(name = "nombre", nullable = false)
    private String nombre;

    @ManyToOne
    @JoinColumn(name = "unidad_id", nullable = false)
    private Unidad unidad;

    @ManyToOne
    @JoinColumn(name = "unit_id")
    private UnidadMedida unit;

    @Column(name = "meta_min")
    private Double metaMin;

    @Column(name = "meta_max")
    private Double metaMax;

    @Column(name = "notificar")
    private Boolean notificar = false;

    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "creado_en")
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en")
    private LocalDateTime actualizadoEn;

    @Column(name = "usuario", length = 100)
    private String usuario;

    @Column(name = "origen_node_red")
    private String origenNodeRed;

    @Column(name = "db_node_red")
    private String dbNodeRed;

    public String getTag() {
        return tag;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Unidad getUnidad() {
        return unidad;
    }

    public void setUnidad(Unidad unidad) {
        this.unidad = unidad;
    }

    public UnidadMedida getUnit() {
        return unit;
    }

    public void setUnit(UnidadMedida unit) {
        this.unit = unit;
    }

    public Double getMetaMin() {
        return metaMin;
    }

    public void setMetaMin(Double metaMin) {
        this.metaMin = metaMin;
    }

    public Double getMetaMax() {
        return metaMax;
    }

    public void setMetaMax(Double metaMax) {
        this.metaMax = metaMax;
    }

    public LocalDateTime getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(LocalDateTime creadoEn) {
        this.creadoEn = creadoEn;
    }

    public LocalDateTime getActualizadoEn() {
        return actualizadoEn;
    }

    public void setActualizadoEn(LocalDateTime actualizadoEn) {
        this.actualizadoEn = actualizadoEn;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public Boolean getNotificar() {
        return notificar != null ? notificar : false;
    }

    public void setNotificar(Boolean notificar) {
        this.notificar = notificar;
    }

    public Boolean getActivo() {
        return activo != null ? activo : true;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public String getOrigenNodeRed() {
        return origenNodeRed;
    }

    public void setOrigenNodeRed(String origenNodeRed) {
        this.origenNodeRed = origenNodeRed;
    }

    public String getDbNodeRed() {
        return dbNodeRed;
    }

    public void setDbNodeRed(String dbNodeRed) {
        this.dbNodeRed = dbNodeRed;
    }
}
