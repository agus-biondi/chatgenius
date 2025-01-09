package com.gauntletai.agustinbiondi.chatgenius.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import jakarta.persistence.EntityManagerFactory;
import java.util.Properties;

@Configuration
@EnableTransactionManagement
public class JpaConfig {

    @Bean
    public Properties hibernateProperties() {
        Properties properties = new Properties();
        
        // Prevent Hibernate from detaching and reattaching entities unnecessarily
        properties.put("hibernate.event.merge.entity_copy_observer", "allow");
        
        // Control how Hibernate handles collections
        properties.put("hibernate.default_batch_fetch_size", "100");
        
        // Better SQL logging
        properties.put("hibernate.generate_statistics", "true");
        properties.put("hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS", "25");
        
        return properties;
    }

    @Bean
    public PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory);
        return transactionManager;
    }
} 