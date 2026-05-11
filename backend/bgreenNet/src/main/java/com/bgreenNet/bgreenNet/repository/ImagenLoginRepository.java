package com.bgreenNet.bgreenNet.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.bgreenNet.bgreenNet.models.ImagenLogin;

@Repository
public interface ImagenLoginRepository extends JpaRepository<ImagenLogin, Long> {
    List<ImagenLogin> findByActivo(Integer activo);
}
