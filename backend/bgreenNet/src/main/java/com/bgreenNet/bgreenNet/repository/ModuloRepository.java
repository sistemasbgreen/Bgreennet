package com.bgreenNet.bgreenNet.repository;

import com.bgreenNet.bgreenNet.models.Modulo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModuloRepository extends JpaRepository<Modulo, Integer> {
    
    List<Modulo> findByActivoTrue();
    
    // MEJORADO: Cargar también los permisos y perfiles
    @Query("SELECT DISTINCT m FROM Modulo m " +
           "LEFT JOIN FETCH m.subModulos sm " +
           "LEFT JOIN FETCH sm.permisos psm " +
           "LEFT JOIN FETCH psm.perfil " +
           "WHERE m.activo = true")
    List<Modulo> findAllWithSubModulosAndPermisos();
}