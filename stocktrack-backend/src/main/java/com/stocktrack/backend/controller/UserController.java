package com.stocktrack.backend.controller;

import com.stocktrack.backend.audit.enums.AuditAction;
import com.stocktrack.backend.audit.service.AuditLogService;
import com.stocktrack.backend.dto.request.SignupRequest;
import com.stocktrack.backend.dto.request.UpdateUserRequest;
import com.stocktrack.backend.dto.response.MessageResponse;
import com.stocktrack.backend.dto.response.UserResponse;
import com.stocktrack.backend.enums.Role;
import com.stocktrack.backend.model.RoleEntity;
import com.stocktrack.backend.model.User;
import com.stocktrack.backend.repository.RoleRepository;
import com.stocktrack.backend.repository.UserRepository;
import com.stocktrack.backend.security.services.UserDetailsImpl;
import com.stocktrack.backend.service.impl.UserServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"}, maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder encoder;
    @Autowired
    private AuditLogService auditLogService;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private UserServiceImpl userService;

    private Set<RoleEntity> convertRolesToEntities(Set<Role> roles) {
        return roles.stream()
                .map(roleEnum -> roleRepository.findByName(roleEnum)
                        .orElseThrow(() -> new RuntimeException("Role not found in database: " + roleEnum)))
                .collect(Collectors.toSet());
    }

    @GetMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(user -> user.setPassword(null)); // hide passwords
        List<UserResponse> response = userService.mapToUserResponseList(users);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        user.setPassword(null);
        UserResponse response = userService.mapToUserResponse(user);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody SignupRequest signupRequest, HttpServletRequest request) {

//        username uniqueness validation
        if (userRepository.existsByUsername(signupRequest.getUsername())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already in use!"));
        }

//        email uniqueness validation
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email already in use!"));
        }

        User user = new User(
                signupRequest.getUsername(),
                signupRequest.getEmail(),
                encoder.encode(signupRequest.getPassword())
        );
        user.setFirstName(signupRequest.getFirstName());
        user.setLastName(signupRequest.getLastName());
        user.setIsActive(true);

        Set<Role> roles = new HashSet<>();
        Set<String> strRoles = signupRequest.getRoles();

        if (strRoles == null || strRoles.isEmpty()) {
            roles.add(Role.WAREHOUSE_STAFF);
        } else {
            for (String role : strRoles) {
                switch (role.toLowerCase()) {
                    case "inventory_manager":
                        roles.add(Role.INVENTORY_MANAGER);
                        break;
                    case "procurement":
                        roles.add(Role.PROCUREMENT);
                        break;
                    case "warehouse_staff":
                        roles.add(Role.WAREHOUSE_STAFF);
                        break;
                    case "inventory_analyst":
                        roles.add(Role.INVENTORY_ANALYST);
                        break;
                    case "system_admin":
                        break;
                    default:
                        roles.add(Role.WAREHOUSE_STAFF);
                }
            }

            if (roles.isEmpty()) {
                roles.add(Role.WAREHOUSE_STAFF);
            }
        }

        user.setRoles(convertRolesToEntities(roles));
        userRepository.save(user);

//        log user creation
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String adminUsername = "SYSTEM";
        Long adminId = null;

        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl adminDetails = (UserDetailsImpl) auth.getPrincipal();
            adminUsername = adminDetails.getUsername();
            adminId = adminDetails.getId();
        }

        auditLogService.logAction(
                AuditAction.USER_CREATED,
                adminId,
                adminUsername,
                "Created user: " + signupRequest.getUsername() + " with roles: " + signupRequest.getRoles(),
                request
        );

        return ResponseEntity.ok(new MessageResponse("User created successfully!"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest updateRequest) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (updateRequest.getUsername() != null &&
                !updateRequest.getUsername().equals(user.getUsername())) {

            if (userRepository.existsByUsername(updateRequest.getUsername())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Username is already in use!"));
            }

            user.setUsername(updateRequest.getUsername());
        }

        if (updateRequest.getFirstName() != null) {
            user.setFirstName(updateRequest.getFirstName());
        }

        if (updateRequest.getLastName() != null) {
            user.setLastName(updateRequest.getLastName());
        }

        if (updateRequest.getEmail() != null &&
                !updateRequest.getEmail().equals(user.getEmail())) {

            if (userRepository.existsByEmail(updateRequest.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Email is already in use!"));
            }

            user.setEmail(updateRequest.getEmail());
        }

        if (updateRequest.getPassword() != null &&
                !updateRequest.getPassword().isEmpty()) {

            user.setPassword(encoder.encode(updateRequest.getPassword()));
        }

        if (updateRequest.getIsActive() != null) {

            if (!updateRequest.getIsActive() &&
                    user.hasRole(Role.SYSTEM_ADMIN)) {

                long activeAdmins = userRepository.countActiveAdmins();

                if (activeAdmins <= 1) {
                    return ResponseEntity.badRequest()
                            .body(new MessageResponse("Error: Cannot deactivate the last ADMIN!"));
                }
            }

            user.setIsActive(updateRequest.getIsActive());
        }

        if (updateRequest.getRoles() != null &&
                !updateRequest.getRoles().isEmpty()) {

            if (user.hasRole(Role.SYSTEM_ADMIN) &&
                    !updateRequest.getRoles().contains(Role.SYSTEM_ADMIN)) {

                long activeAdmins = userRepository.countActiveAdmins();

                if (activeAdmins <= 1) {
                    return ResponseEntity.badRequest()
                            .body(new MessageResponse("Error: Cannot remove SYSTEM_ADMIN role from the last ADMIN!"));
                }
            }

            user.setRoles(convertRolesToEntities(updateRequest.getRoles()));
        }

        userRepository.save(user);

        return ResponseEntity.ok(
                new MessageResponse("User updated successfully!")
        );
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestParam Boolean active) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        if (!active && user.hasRole(Role.SYSTEM_ADMIN)) {
            long activeAdmins = userRepository.countActiveAdmins();

            if (activeAdmins <= 1) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Cannot deactivate the last active ADMIN!"));
            }
        }

        user.setIsActive(active);
        userRepository.save(user);

        String status = active ? "activated" : "deactivated";
        return ResponseEntity.ok(new MessageResponse("User " + status + " successfully!"));
    }

    //    delete user (SYSTEM_ADMIN only) - SOFT delete only -> for audit trail
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found with id: " + id));

//        preventing the delete last SYSTEM_ADMIN
        if (user.hasRole(Role.SYSTEM_ADMIN)) {
            long activeAdmins = userRepository.countActiveAdmins();

            if (activeAdmins <= 1) {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Cannot delete the last ADMIN!"));
            }
        }

//        SOFT delete - mark as inactive
        user.setIsActive(false);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User deleted successfully!"));
    }
}
