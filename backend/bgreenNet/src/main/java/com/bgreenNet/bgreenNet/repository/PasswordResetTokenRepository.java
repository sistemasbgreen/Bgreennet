package com.bgreenNet.bgreenNet.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.bgreenNet.bgreenNet.models.PasswordResetToken;
import com.bgreenNet.bgreenNet.models.Usuario;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Integer> {

    Optional<PasswordResetToken> findTopByUsuarioAndCodigoOtpAndUsadoFalseOrderByFechaCreacionDesc(Usuario usuario, String codigoOtp);

    List<PasswordResetToken> findByUsuarioAndUsadoFalse(Usuario usuario);

    @Modifying
    @Query("UPDATE PasswordResetToken p SET p.usado = true WHERE p.usuario = :usuario AND p.usado = false")
    void invalidarTokensAnteriores(@Param("usuario") Usuario usuario);
}
