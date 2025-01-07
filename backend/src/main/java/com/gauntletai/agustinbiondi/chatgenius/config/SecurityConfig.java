package com.gauntletai.agustinbiondi.chatgenius.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Value("${app.security.development-mode:true}")
    private boolean developmentMode;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configure(http))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        if (developmentMode) {
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        } else {
            // Production security config here when needed
            http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        }

        return http.build();
    }
} 