package com.bgreenNet.bgreenNet.repository;

import com.bgreenNet.bgreenNet.models.SubModulo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubModuloRepository extends JpaRepository<SubModulo, Integer> {
    
    @Query("SELECT sm FROM SubModulo sm " +
           "WHERE sm.modulo.idModulo = :idModulo AND sm.activo = true")
    List<SubModulo> findByIdModuloAndActivoTrue(@Param("idModulo") Integer idModulo);
    
    @Query("SELECT sm FROM SubModulo sm " +
           "LEFT JOIN FETCH sm.permisos psm " +
           "LEFT JOIN FETCH psm.perfil " +
           "WHERE sm.idSubModulo = :idSubModulo")
    Optional<SubModulo> findWithPermisosById(@Param("idSubModulo") Integer idSubModulo);
    
    // CORREGIDO: Sin static, sin implementación
    // Spring Data JPA genera automáticamente la implementación
    List<SubModulo> findByActivoTrue();
    
    // OPCIONAL: Si prefieres usar @Query (recomendado para eager loading)
    // @Query("SELECT sm FROM SubModulo sm " +
    //        "LEFT JOIN FETCH sm.permisos " +
    //        "WHERE sm.activo = true")
    // List<SubModulo> findByActivoTrue();
}