package com.bgreenNet.bgreenNet.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "ConfiguracionSeguridad")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfiguracionSeguridad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_configuracion")
    private Integer idConfiguracion;

    @Column(name = "expiracion_dias", nullable = false)
    private Integer expiracionDias;

    @Column(name = "intentos_invalidos", nullable = false)
    private Integer intentosInvalidos;

    @Column(name = "min_caracteres", nullable = false)
    private Integer minCaracteres;

    @Column(name = "requiere_letras", nullable = false)
    private Boolean requiereLetras;

    @Column(name = "requiere_numeros", nullable = false)
    private Boolean requiereNumeros;

    @Column(name = "requiere_especiales", nullable = false)
    private Boolean requiereEspeciales;

    @Column(name = "date_create", nullable = false, updatable = false)
    private LocalDateTime dateCreate;

    @Column(name = "date_modify", nullable = false)
    private LocalDateTime dateModify;

    @PrePersist
    protected void onCreate() {
        dateCreate = LocalDateTime.now();
        dateModify = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        dateModify = LocalDateTime.now();
    }

	public Integer getIdConfiguracion() {
		return idConfiguracion;
	}

	public void setIdConfiguracion(Integer idConfiguracion) {
		this.idConfiguracion = idConfiguracion;
	}

	public Integer getExpiracionDias() {
		return expiracionDias;
	}

	public void setExpiracionDias(Integer expiracionDias) {
		this.expiracionDias = expiracionDias;
	}

	public Integer getIntentosInvalidos() {
		return intentosInvalidos;
	}

	public void setIntentosInvalidos(Integer intentosInvalidos) {
		this.intentosInvalidos = intentosInvalidos;
	}

	public Integer getMinCaracteres() {
		return minCaracteres;
	}

	public void setMinCaracteres(Integer minCaracteres) {
		this.minCaracteres = minCaracteres;
	}

	public Boolean getRequiereLetras() {
		return requiereLetras;
	}

	public void setRequiereLetras(Boolean requiereLetras) {
		this.requiereLetras = requiereLetras;
	}

	public Boolean getRequiereNumeros() {
		return requiereNumeros;
	}

	public void setRequiereNumeros(Boolean requiereNumeros) {
		this.requiereNumeros = requiereNumeros;
	}

	public Boolean getRequiereEspeciales() {
		return requiereEspeciales;
	}

	public void setRequiereEspeciales(Boolean requiereEspeciales) {
		this.requiereEspeciales = requiereEspeciales;
	}

	public LocalDateTime getDateCreate() {
		return dateCreate;
	}

	public void setDateCreate(LocalDateTime dateCreate) {
		this.dateCreate = dateCreate;
	}

	public LocalDateTime getDateModify() {
		return dateModify;
	}

	public void setDateModify(LocalDateTime dateModify) {
		this.dateModify = dateModify;
	}
}
