	package com.bgreenNet.bgreenNet.jwt;
	
	import org.springframework.beans.factory.annotation.Autowired;
	import org.springframework.context.annotation.Bean;
	import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
	import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
	import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
	import org.springframework.security.config.annotation.web.builders.HttpSecurity;
	import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
	import org.springframework.security.config.http.SessionCreationPolicy;
	import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
	import org.springframework.security.crypto.password.PasswordEncoder;
	import org.springframework.security.web.SecurityFilterChain;
	import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
	import org.springframework.web.cors.CorsConfigurationSource;
	
	
	@Configuration
	@EnableWebSecurity
	@EnableMethodSecurity
	public class SecurityConfig {

	    @Autowired
	    private JwtRequestFilter jwtRequestFilter;

	    @Autowired  // ✅ Inyecta el bean correctamente
	    private CorsConfigurationSource corsConfigurationSource;

	    @Bean
	    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	        http
	            .cors(cors -> cors.configurationSource(corsConfigurationSource)) // ✅ usa el bean
	            .csrf(csrf -> csrf.disable())
	            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
	            .authorizeHttpRequests(authz -> authz
	                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
	                .requestMatchers("/api/auth/**", "/auth/**").permitAll()
	                .requestMatchers("/api/listas/**", "/listas/**").permitAll()
	                .requestMatchers("/api/home/**", "/home/**").permitAll()
	                .requestMatchers("/api/usuarios/**", "/usuarios/**").permitAll()
	                .requestMatchers("/api/perfil/**", "/perfil/**").permitAll()
	                .requestMatchers("/api/sistemasinformacion/**", "/sistemasinformacion/**").permitAll()
	                .requestMatchers("/api/cmiplanta/**", "/cmiplanta/**").permitAll()
	                .requestMatchers("/api/tareas/**", "/tareas/**").permitAll()
	                .requestMatchers("/api/pulsos/**", "/pulsos/**").permitAll()
	                .requestMatchers("/api/upload/**", "/upload/**").permitAll()
	                .requestMatchers("/plc/leer/**").permitAll()
	                .requestMatchers("/api/plc-db/**", "/plc-db/**").permitAll()
	                .requestMatchers("/api/scada/**", "/scada/**").permitAll()
	                .requestMatchers("/api/module-config/config/**", "/module-config/config/**").permitAll()
	                .requestMatchers("/api/module-config/**", "/module-config/**").permitAll()
	                .requestMatchers("/api/estrategicos/**", "/estrategicos/**").permitAll()
	                .requestMatchers("/api/op-docto/**", "/op-docto/**").permitAll()
	                .requestMatchers("/api/productos/**", "/productos/**").permitAll()
	                .requestMatchers("/api/siesa/**", "/siesa/**").permitAll()
	                .requestMatchers("/api/obtener_metas/**", "/obtener_metas/**").permitAll()
	                .requestMatchers("/api/agregar_metas/**", "/agregar_metas/**").permitAll()
	                .requestMatchers("/api/metas/consultar_costo-directo/**", "/metas/consultar_costo-directo/**").permitAll()
	                .requestMatchers("/api/metas/agregar_costo-directo/**", "/metas/agregar_costo-directo/**").permitAll()
	                .requestMatchers("/api/catalogos/**", "/catalogos/**").permitAll()
	                .requestMatchers("/api/configuracion-seguridad", "/api/configuracion-seguridad/**", "/configuracion-seguridad", "/configuracion-seguridad/**").permitAll()
	                .requestMatchers("/api/listarDocumentos/**", "/listarDocumentos/**").permitAll()
	                .requestMatchers("/error").permitAll()
	                .anyRequest().authenticated()
	            )
	            .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

	        return http.build();
	    }

	    @Bean
	    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
	        return config.getAuthenticationManager();
	    }

	    @Bean
	    public PasswordEncoder passwordEncoder() {
	        return new BCryptPasswordEncoder();
	    }
	}
		
	
