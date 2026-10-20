package com.bgreenNet.bgreenNet.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.bgreenNet.bgreenNet.models.SupervisionAsistencia;
import java.util.List;

@Repository
public interface SupervisionAsistenciaRepository extends JpaRepository<SupervisionAsistencia, Integer> {

    List<SupervisionAsistencia> findAllByOrderByDateCreateDesc();

    List<SupervisionAsistencia> findByIdSupervisor(Integer idSupervisor);

    List<SupervisionAsistencia> findByCedulaSupervisor(String cedulaSupervisor);

    List<SupervisionAsistencia> findByIdSupervisorAndActivoTrue(Integer idSupervisor);

    List<SupervisionAsistencia> findByCedulaSupervisorAndActivoTrue(String cedulaSupervisor);

    void deleteByIdSupervisor(Integer idSupervisor);
}
