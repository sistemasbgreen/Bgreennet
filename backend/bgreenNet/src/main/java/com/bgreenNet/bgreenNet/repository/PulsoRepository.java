package com.bgreenNet.bgreenNet.repository;

import com.bgreenNet.bgreenNet.models.Pulso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PulsoRepository extends JpaRepository<Pulso, Long> {

    @Query(value = "EXEC sp_Pulsos_ConsultarActivos", nativeQuery = true)
    List<Object[]> findActivePulsosRaw();

    @Query(value = "EXEC sp_Pulsos_ConsultarTodos", nativeQuery = true)
    List<Object[]> findAllPulsosRaw();

    @Query(value = "EXEC sp_Pulsos_ConsultarPorId @id_pulso = :id", nativeQuery = true)
    List<Object[]> findPulsoByIdRaw(@Param("id") Long id);

    @Query(
        value = "DECLARE @newId TABLE (id BIGINT); " +
                "INSERT INTO @newId " +
                "EXEC sp_Pulsos_Insertar " +
                "@titulo = :titulo, " +
                "@descripcion = :descripcion, " +
                "@imagen_url = :imagenUrl, " +
                "@imagen_nombre_original = :imagenNombreOriginal, " +
                "@imagen_tipo_mime = :imagenTipoMime, " +
                "@imagen_tamano_bytes = :imagenTamanoBytes, " +
                "@Fecha_Final = :fechaFinal, " +
                "@fecha_Activacion = :fechaActivacion, " +
                "@creado_por = :creadoPor; " +
                "SELECT id FROM @newId",
        nativeQuery = true
    )
    Long insertPulso(
            @Param("titulo") String titulo,
            @Param("descripcion") String descripcion,
            @Param("imagenUrl") String imagenUrl,
            @Param("imagenNombreOriginal") String imagenNombreOriginal,
            @Param("imagenTipoMime") String imagenTipoMime,
            @Param("imagenTamanoBytes") Integer imagenTamanoBytes,
            @Param("fechaFinal") LocalDateTime fechaFinal,
            @Param("fechaActivacion") LocalDateTime fechaActivacion,
            @Param("creadoPor") String creadoPor
    );

    @Modifying
    @Query(
        value = "EXEC sp_Pulsos_Actualizar " +
                "@id_pulso = :idPulso, " +
                "@titulo = :titulo, " +
                "@descripcion = :descripcion, " +
                "@imagen_url = :imagenUrl, " +
                "@imagen_nombre_original = :imagenNombreOriginal, " +
                "@imagen_tipo_mime = :imagenTipoMime, " +
                "@imagen_tamano_bytes = :imagenTamanoBytes, " +
                "@Fecha_Final = :fechaFinal, " +
                "@fecha_Activacion = :fechaActivacion, " +
                "@activo = :activo",
        nativeQuery = true
    )
    void updatePulso(
            @Param("idPulso") Long idPulso,
            @Param("titulo") String titulo,
            @Param("descripcion") String descripcion,
            @Param("imagenUrl") String imagenUrl,
            @Param("imagenNombreOriginal") String imagenNombreOriginal,
            @Param("imagenTipoMime") String imagenTipoMime,
            @Param("imagenTamanoBytes") Integer imagenTamanoBytes,
            @Param("fechaFinal") LocalDateTime fechaFinal,
            @Param("fechaActivacion") LocalDateTime fechaActivacion,
            @Param("activo") Boolean activo
    );

    @Modifying
    @Query(
        value = "EXEC sp_Pulsos_ActualizarEstado @id_pulso = :idPulso, @activo = :activo",
        nativeQuery = true
    )
    void updateEstadoPulso(
            @Param("idPulso") Long idPulso,
            @Param("activo") Boolean activo
    );

    @Modifying
    @Query(value = "EXEC sp_Pulsos_EliminarFisico @id_pulso = :idPulso", nativeQuery = true)
    void deletePulsoFisico(@Param("idPulso") Long idPulso);

    @Query(
        value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END " +
                "FROM Pulsos WHERE id_pulso = :id",
        nativeQuery = true
    )
    Integer existsPulsoById(@Param("id") Long id);

    @Modifying
    @Query(value = "EXEC sp_Pulsos_ActivarPorFecha", nativeQuery = true)
    void activarPulsosPorFecha();
}
