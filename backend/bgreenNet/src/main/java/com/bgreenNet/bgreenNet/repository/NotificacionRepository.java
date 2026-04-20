package com.bgreenNet.bgreenNet.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.bgreenNet.bgreenNet.models.Notificacion;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    List<Notificacion> findByUsuarioIdUsuarioAndLeidoFalseOrderByFechaDesc(Integer idUsuario);
}
