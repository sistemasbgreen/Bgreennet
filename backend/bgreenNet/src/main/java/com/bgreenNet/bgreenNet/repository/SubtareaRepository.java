package com.bgreenNet.bgreenNet.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.models.Subtarea;

@Repository
public interface SubtareaRepository extends JpaRepository<Subtarea, Long> {
    List<Subtarea> findByTareaIdOrderByIdAsc(Long idTarea);
    List<Subtarea> findByIdUsuario(Integer idUsuario);
}
