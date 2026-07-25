package com.stocktrack.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaRepositories(basePackages = "com.stocktrack.backend.repository")
@EnableTransactionManagement
public class DatabaseConfig {

//    Database configurations
}
