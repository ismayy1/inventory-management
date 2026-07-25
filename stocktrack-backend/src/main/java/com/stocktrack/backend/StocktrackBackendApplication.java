package com.stocktrack.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableScheduling
@EnableTransactionManagement
//@EntityScan(basePackages = {"com.stocktrack.backend.entity"})
//@EnableJpaRepositories(basePackages = {"com.stocktrack.backend.repository"	})
@ComponentScan(basePackages = "com.stocktrack.backend")
public class StocktrackBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(StocktrackBackendApplication.class, args);
	}

}
