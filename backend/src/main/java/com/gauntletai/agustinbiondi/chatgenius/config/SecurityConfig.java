package com.gauntletai.agustinbiondi.chatgenius.config;

import com.gauntletai.agustinbiondi.chatgenius.security.ClerkAuthFilter;
import com.gauntletai.agustinbiondi.chatgenius.security.ClerkAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.context.annotation.Bean;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ClerkAuthFilter clerkAuthFilter;
    private final ClerkAuthenticationEntryPoint authenticationEntryPoint;
    private final Environment environment;

    @Value("${app.security.development-mode:true}")
    private boolean developmentMode;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        boolean isDevProfile = false;

        // Determine if 'dev' profile is active
        for (String profile : environment.getActiveProfiles()) {
            if ("dev".equals(profile)) {
                isDevProfile = true;
                break;
            }
        }

        if (isDevProfile || developmentMode) {
            // Development-specific configurations can be added here
            // For example, allowing additional endpoints, disabling certain security features, etc.
            http
                .csrf(csrf -> csrf
                    .ignoringRequestMatchers("/api/**", "/ws/**")
                )
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/ws/**", "/api/webhook/clerk", "/api/auth/**").permitAll()
                    .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                    .authenticationEntryPoint(authenticationEntryPoint)
                )
                .addFilterBefore(clerkAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(session -> session
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );
        } else {
            // Production-specific configurations
            http
                .csrf(csrf -> csrf
                    .ignoringRequestMatchers("/api/**", "/ws/**")
                )
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/ws/**", "/api/webhook/clerk", "/api/auth/**").permitAll()
                    .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                    .authenticationEntryPoint(authenticationEntryPoint)
                )
                .addFilterBefore(clerkAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(session -> session
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );
        }

        return http.build();
    }
}
