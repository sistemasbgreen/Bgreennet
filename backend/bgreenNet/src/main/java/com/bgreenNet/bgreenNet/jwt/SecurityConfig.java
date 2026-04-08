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
	
	@Configuration
	@EnableWebSecurity
	@EnableMethodSecurity
	
	public class SecurityConfig {
		
		 @Autowired
		    private JwtRequestFilter jwtRequestFilter;
	
					 
			@Bean
			public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
			    http
			        .cors(cors -> cors.configurationSource(new com.bgreenNet.bgreenNet.config.CorsConfig().corsConfigurationSource())) 
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
			            .requestMatchers("/api/scada/ultimo/**", "/scada/ultimo/**").permitAll()
			            .requestMatchers("/api/module-config/config/**", "/module-config/config/**").permitAll()
			            .requestMatchers("/api/module-config/**", "/module-config/**").permitAll()
			            .requestMatchers("/api/estrategicos/**").permitAll()
			            .requestMatchers("/api/op-docto/**").permitAll()
			            
			            
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
