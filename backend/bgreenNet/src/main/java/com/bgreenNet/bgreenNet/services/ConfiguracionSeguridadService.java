package com.bgreenNet.bgreenNet.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.bgreenNet.bgreenNet.models.ConfiguracionSeguridad;
import com.bgreenNet.bgreenNet.repository.ConfiguracionSeguridadRepository;
import java.util.Optional;

@Service
public class ConfiguracionSeguridadService {

    @Autowired
    private ConfiguracionSeguridadRepository repository;

    public ConfiguracionSeguridad obtenerConfiguracion() {
        return repository.findFirstByOrderByIdConfiguracionAsc()
                .orElseGet(() -> {
                    // Configuración por defecto si no existe ninguna
                    ConfiguracionSeguridad defaultConf = new ConfiguracionSeguridad();
                    defaultConf.setExpiracionDias(90);
                    defaultConf.setIntentosInvalidos(5);
                    defaultConf.setMinCaracteres(8);
                    defaultConf.setRequiereLetras(true);
                    defaultConf.setRequiereNumeros(true);
                    defaultConf.setRequiereEspeciales(true);
                    defaultConf.setNovoUrl("http://localhost:8080/scadaotherapp.asmx");
                    defaultConf.setNovoApiKey("default-fake-api-key");
                    defaultConf.setNovoConnectionTimeout(10000);
                    defaultConf.setNovoReadTimeout(30000);
                    return repository.save(defaultConf);
                });
    }

    public ConfiguracionSeguridad actualizarConfiguracion(ConfiguracionSeguridad configuracion) {
        ConfiguracionSeguridad existing = obtenerConfiguracion();
        existing.setExpiracionDias(configuracion.getExpiracionDias());
        existing.setIntentosInvalidos(configuracion.getIntentosInvalidos());
        existing.setMinCaracteres(configuracion.getMinCaracteres());
        existing.setRequiereLetras(configuracion.getRequiereLetras());
        existing.setRequiereNumeros(configuracion.getRequiereNumeros());
        existing.setRequiereEspeciales(configuracion.getRequiereEspeciales());
        existing.setNovoUrl(configuracion.getNovoUrl());
        existing.setNovoApiKey(configuracion.getNovoApiKey());
        existing.setNovoConnectionTimeout(configuracion.getNovoConnectionTimeout());
        existing.setNovoReadTimeout(configuracion.getNovoReadTimeout());
        return repository.save(existing);
    }

}
