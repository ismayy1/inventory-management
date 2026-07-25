package com.stocktrack.backend.controller;

import com.stocktrack.backend.dto.request.UpdateUserRequest;
import com.stocktrack.backend.dto.response.MessageResponse;
import com.stocktrack.backend.dto.response.UserResponse;
import com.stocktrack.backend.model.User;
import com.stocktrack.backend.repository.UserRepository;
import com.stocktrack.backend.security.services.UserDetailsImpl;
import com.stocktrack.backend.service.impl.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"}, maxAge = 3600)
@RestController
@RequestMapping("/api/profile")
public class Profile {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserServiceImpl userService;
    @Autowired
    private PasswordEncoder encoder;

    @GetMapping("/")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public ResponseEntity<UserResponse> getMyAdminProfile(Authentication authentication) {

        UserDetailsImpl admin = (UserDetailsImpl) authentication.getPrincipal();

        User user = userRepository.findById(admin.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(null);

        return ResponseEntity.ok(userService.mapToUserResponse(user));
    }

    @PutMapping("/")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public ResponseEntity<?> updateMyAdminProfile(
            Authentication authentication,
            @RequestBody UpdateUserRequest request
    ) {

        UserDetailsImpl admin = (UserDetailsImpl) authentication.getPrincipal();

        User user = userRepository.findById(admin.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Username change (with uniqueness check)
        if (request.getUsername() != null &&
                !request.getUsername().equals(user.getUsername())) {

            if (userRepository.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Username already in use"));
            }

            user.setUsername(request.getUsername());
        }

        // Email change (with uniqueness check)
        if (request.getEmail() != null &&
                !request.getEmail().equals(user.getEmail())) {

            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Email already in use"));
            }

            user.setEmail(request.getEmail());
        }

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }

        // Password change (optional inside same endpoint if you want)
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(encoder.encode(request.getPassword()));
        }

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Profile updated successfully"));
    }
}
