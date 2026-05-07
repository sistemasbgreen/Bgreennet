package com.bgreenNet.bgreenNet.services;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bgreenNet.bgreenNet.dto.PermisoSistemaPerfilDTO;
import com.bgreenNet.bgreenNet.models.Perfil;
import com.bgreenNet.bgreenNet.repository.PerfilRepository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.StoredProcedureQuery;
import jakarta.transaction.Transactional;



@Service
@Transactional
public class PerfilServices {

    @Autowired
    private PerfilRepository repository;

    @Autowired
    private EntityManager entityManager;

    public List<Perfil> getAll() {
        return repository.findAll();
    }

    public List<PermisoSistemaPerfilDTO> obtenerPermisosPorPerfil(Long idPerfil) {
        StoredProcedureQuery query = entityManager.createStoredProcedureQuery("sp_ObtenerPermisos_SistemasXperfil");
        query.registerStoredProcedureParameter("id_perfil", Long.class, ParameterMode.IN);
        query.setParameter("id_perfil", idPerfil);

        @SuppressWarnings("unchecked")
        List<Object[]> resultados = query.getResultList();

        List<PermisoSistemaPerfilDTO> lista = new ArrayList<>();
        for (Object[] row : resultados) {
            PermisoSistemaPerfilDTO dto = new PermisoSistemaPerfilDTO(
                toInteger(row[0]),
                (String) row[1],
                toInteger(row[2]),
                toInteger(row[3]),
                toInteger(row[4]),
                toBoolean(row[5]),
                toBoolean(row[6])
            );
            lista.add(dto);
        }
        return lista;
    }

   //Crear perfil
    public void crearPerfil(String descripcionPerfil, Boolean activo) {
        if (activo == null) {
            activo = true;
        }
        repository.spCrearPerfil(descripcionPerfil, activo);
    }
    
     
    public void asignarPermiso(Integer idPerfilFk, Integer idSistemaFk) {
    	repository.asignarPermiso(idPerfilFk, idSistemaFk);
    }

    public void eliminarPermiso(Integer idPerfilFk, Integer idSistemaFk) {
    	repository.eliminarPermiso(idPerfilFk, idSistemaFk);
    }

    // Helpers
    private Integer toInteger(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) return ((Number) obj).intValue();
        return Integer.parseInt(obj.toString());
    }

    private Boolean toBoolean(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Boolean) return (Boolean) obj;
        if (obj instanceof Number) return ((Number) obj).intValue() != 0;
        return Boolean.valueOf(obj.toString());
    }
}