package com.bgreenNet.bgreenNet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.models.HomeContacto;


@Repository
public interface HomeContactoRepository extends JpaRepository<HomeContacto, String> {
	
    @Query(value = "EXEC Sp_Home_Contacto", nativeQuery = true)
    HomeContacto obtenerContacto();

}
