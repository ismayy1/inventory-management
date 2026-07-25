package com.stocktrack.backend.controller;

import com.stocktrack.backend.audit.enums.AuditAction;
import com.stocktrack.backend.audit.service.AuditLogService;
import com.stocktrack.backend.dto.request.ForgotPasswordRequest;
import com.stocktrack.backend.dto.request.LoginRequest;
import com.stocktrack.backend.dto.request.ResetPasswordRequest;
import com.stocktrack.backend.dto.request.SignupRequest;
import com.stocktrack.backend.dto.response.JwtResponse;
import com.stocktrack.backend.dto.response.MessageResponse;
import com.stocktrack.backend.enums.Role;
import com.stocktrack.backend.exception.UserNotFoundException;
import com.stocktrack.backend.model.RoleEntity;
import com.stocktrack.backend.model.User;
import com.stocktrack.backend.repository.RoleRepository;
import com.stocktrack.backend.repository.UserRepository;
import com.stocktrack.backend.security.jwt.JwtUtils;
import com.stocktrack.backend.security.services.UserDetailsImpl;
import com.stocktrack.backend.service.PasswordResetService;
import com.stocktrack.backend.service.impl.JwtDenyListService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"}, maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthenticationManager authenticationManager;
    @Autowired
    UserRepository userRepository;
    @Autowired
    PasswordEncoder encoder;
    @Autowired
    JwtUtils jwtUtils;
    @Autowired
    private PasswordResetService passwordResetService;
    @Autowired
    private AuditLogService auditLogService;
    @Autowired
    private JwtDenyListService jwtDenyListService;
    @Autowired
    private RoleRepository roleRepository;

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            String token = passwordResetService.generateResetToken(request.getUsername());
            return ResponseEntity.ok(new MessageResponse("Reset token: " + token + " (expires in 15 minutes)"));
        } catch (UserNotFoundException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            if (!passwordResetService.validateToken(request.getToken())) {
                return ResponseEntity.badRequest().body(new MessageResponse("Invalid or expired token!"));
            }
            passwordResetService.resetPassword(request.getToken(), request.getPassword());
            return ResponseEntity.ok(new MessageResponse("Password reset successful!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

//        update Last Login
        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        if (user != null) {
            user.setLastLogin(java.time.LocalDateTime.now());
            userRepository.save(user);
        }

        auditLogService.logAction(
                AuditAction.USER_LOGIN,
                userDetails.getId(),
                userDetails.getUsername(),
                "User logged in successfully",
                request
        );

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getFullName(),
                roles));
    }

    @PostMapping("/signout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String jwt = parseJwtFromRequest(request);

        if (jwt == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("No token provided"));
        }

        try {
            // add token to denyList
            Instant expiry = jwtUtils.getTokenExpiry(jwt);
            jwtDenyListService.addTokenToDenyList(jwt, expiry);

            return ResponseEntity.ok(new MessageResponse("Successfully logged out!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error during logout: " + e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        if (userRepository.existsByUsername(signupRequest.getUsername())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        User user = new User(
                signupRequest.getUsername(),
                signupRequest.getEmail(),
                encoder.encode(signupRequest.getPassword()));
        user.setFirstName(signupRequest.getFirstName());
        user.setLastName(signupRequest.getLastName());

        Set<Role> roles = new HashSet<>();

        if (userRepository.count() == 0) {
            roles.add(Role.SYSTEM_ADMIN);
        } else {
            signupRequest.getRoles().forEach(role -> {
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
                    default:
                        roles.add(Role.WAREHOUSE_STAFF);
                }
            });
        }

        user.setRoles(convertRolesToEntities(roles));
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse(("User registered successfully!")));
    }

    private Set<RoleEntity> convertRolesToEntities(Set<Role> roles) {
        return roles.stream()
                .map(roleEnum -> roleRepository.findByName(roleEnum)
                        .orElseThrow(() -> new RuntimeException("Role not found in database: " + roleEnum)))
                .collect(Collectors.toSet());
    }

    // helper method to extract JWT from request
    private String parseJwtFromRequest(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
