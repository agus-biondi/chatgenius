package com.gauntletai.agustinbiondi.chatgenius.config;

import com.gauntletai.agustinbiondi.chatgenius.security.ClerkAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Value("${app.security.development-mode:true}")
    private boolean developmentMode;

    private final ClerkAuthFilter clerkAuthFilter;

    public SecurityConfig(ClerkAuthFilter clerkAuthFilter) {
        this.clerkAuthFilter = clerkAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configure(http))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        if (developmentMode) {
            http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/ws/**", "/ws").permitAll()
                .requestMatchers("/topic/**").permitAll()
                .requestMatchers("/app/**").permitAll()
                .anyRequest().permitAll())
            .addFilterBefore(clerkAuthFilter, UsernamePasswordAuthenticationFilter.class);
        } else {
            http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/ws/**", "/ws").permitAll()
                .requestMatchers("/topic/**").permitAll()
                .requestMatchers("/app/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/webhook/clerk").permitAll()
                .anyRequest().authenticated())
            .addFilterBefore(clerkAuthFilter, UsernamePasswordAuthenticationFilter.class);
        }
        return http.build();
    }
} 
