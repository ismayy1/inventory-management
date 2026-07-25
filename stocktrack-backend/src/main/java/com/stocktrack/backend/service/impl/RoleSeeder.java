package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.enums.Role;
import com.stocktrack.backend.model.RoleEntity;
import com.stocktrack.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RoleSeeder implements CommandLineRunner {
    private final RoleRepository roleRepo;

    @Override
    public void run(String... args) {
        for (Role roleEnum : Role.values()) {
            roleRepo.findByName(roleEnum).ifPresentOrElse(
                    existing -> {},
                    () -> roleRepo.save(new RoleEntity(roleEnum))
            );
        }
    }
}
