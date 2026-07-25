package com.stocktrack.backend.config;

import com.stocktrack.backend.model.User;
import com.stocktrack.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class StartupDataLoader implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("Inventory Manager")) {
            User user = new User();
            user.setUsername("Inventory Manager");
            user.setEmail("inventory@example.com");
            user.setPassword(passwordEncoder.encode("password123")); // set a secure password
            // set roles, etc.
            userRepository.save(user);
            System.out.println("Default user 'Inventory Manager' created.");
        }
    }
}