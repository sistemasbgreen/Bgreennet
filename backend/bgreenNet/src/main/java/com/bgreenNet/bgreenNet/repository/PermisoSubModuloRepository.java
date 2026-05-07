package com.bgreenNet.bgreenNet.repository;

import com.bgreenNet.bgreenNet.models.PermisoSubModulo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermisoSubModuloRepository extends JpaRepository<PermisoSubModulo, Integer> {
    
    @Query("SELECT psm FROM PermisoSubModulo psm " +
           "WHERE psm.perfil.idPerfil = :idPerfil AND psm.activo = true")
    List<PermisoSubModulo> findByIdPerfilAndActivoTrue(@Param("idPerfil") Integer idPerfil);
    
    @Query("SELECT psm FROM PermisoSubModulo psm " +
           "WHERE psm.perfil.idPerfil = :idPerfil AND psm.subModulo.idSubModulo = :idSubModulo")
    Optional<PermisoSubModulo> findByIdPerfilAndIdSubModulo(
        @Param("idPerfil") Integer idPerfil,
        @Param("idSubModulo") Integer idSubModulo
    );
    
    @Query("SELECT psm FROM PermisoSubModulo psm " +
           "WHERE psm.subModulo.idSubModulo = :idSubModulo AND psm.activo = true")
    List<PermisoSubModulo> findBySubModuloId(@Param("idSubModulo") Integer idSubModulo);
    
    @Query("DELETE FROM PermisoSubModulo psm " +
           "WHERE psm.perfil.idPerfil = :idPerfil AND psm.subModulo.idSubModulo = :idSubModulo")
    void deleteByIdPerfilAndIdSubModulo(
        @Param("idPerfil") Integer idPerfil,
        @Param("idSubModulo") Integer idSubModulo
    );
}