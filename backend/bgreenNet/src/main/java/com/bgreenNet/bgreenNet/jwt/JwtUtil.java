package com.bgreenNet.bgreenNet.jwt;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.lang.Arrays;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {
	
	 @Value("${jwt.secret}")
	    private String SECRET_KEY;

	    @Value("${jwt.expiration}")
	    private long EXPIRATION;


	    private SecretKey getSignInKey() {
	        byte[] keyBytes = SECRET_KEY.getBytes(StandardCharsets.UTF_8);
	        System.out.println("Clave secreta usada (UTF-8 bytes): " + Arrays.length(keyBytes));
	        return Keys.hmacShaKeyFor(keyBytes);
	    }
	    
	    public String generateToken(UserDetails userDetails) {
	        return Jwts.builder()
	                .setSubject(userDetails.getUsername())
	                .setIssuedAt(new Date())
	                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
	                .signWith(getSignInKey(), SignatureAlgorithm.HS512)
	                .compact();
	    }

	    public String extractUsername(String token) {
	        Claims claims = Jwts.parserBuilder()
	                .setSigningKey(getSignInKey())
	                .build()
	                .parseClaimsJws(token)
	                .getBody();
	        return claims.getSubject();
	    }

	    public boolean validateToken(String token, UserDetails userDetails) {
	        final String username = extractUsername(token);
	        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
	    }

	    private boolean isTokenExpired(String token) {
	        Claims claims = Jwts.parserBuilder()
	                .setSigningKey(getSignInKey())
	                .build()
	                .parseClaimsJws(token)
	                .getBody();
	        return claims.getExpiration().before(new Date());
	    }
	    
	    

}
