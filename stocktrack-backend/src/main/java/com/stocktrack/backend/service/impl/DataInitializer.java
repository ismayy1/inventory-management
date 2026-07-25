package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.enums.Role;
import com.stocktrack.backend.model.RoleEntity;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final EntityManager entityManager;

    public DataInitializer(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        Long count = entityManager.createQuery("SELECT COUNT(r) FROM RoleEntity r", Long.class)
                .getSingleResult();

        if (count == 0) {
            System.out.println("Populating roles from enum...");
            for (Role role : Role.values()) {
                RoleEntity roleEntity = new RoleEntity(role);
                entityManager.persist(roleEntity);
            }
            // Forcing Hibernate to write to DB immediately
            entityManager.flush();

            System.out.println("Roles table populated from enum.");
        } else {
            System.out.println("Roles table already has data. Skipping insertion.");
        }
    }

}
