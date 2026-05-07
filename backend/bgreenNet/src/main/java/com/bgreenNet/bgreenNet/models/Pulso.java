package com.bgreenNet.bgreenNet.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "Pulsos")
public class Pulso {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pulso")
    private Long id;

    @Column(name = "titulo", nullable = false)
    private String titulo;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "imagen_url")
    private String imagenUrl;

    @Column(name = "imagen_nombre_original")
    private String imagenNombreOriginal;

    @Column(name = "imagen_tipo_mime")
    private String imagenTipoMime;

    @Column(name = "imagen_tamano_bytes")
    private Integer imagenTamanoBytes;

    @Column(name = "Fecha_Final", nullable = false)
    private LocalDateTime fechaFinal;

    @Column(name = "date_create", nullable = false)
    private LocalDateTime dateCreate;

    @Column(name = "date_Modify", nullable = false)
    private LocalDateTime dateModify;

    @Column(name = "activo", nullable = false)
    private Boolean activo;

    @Column(name = "fecha_Activacion")
    private LocalDateTime fechaActivacion;

    @Column(name = "creado_por", nullable = false)
    private String creadoPor;
}