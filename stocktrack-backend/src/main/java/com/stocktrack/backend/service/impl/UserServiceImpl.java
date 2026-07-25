package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.dto.request.UpdateUserRequest;
import com.stocktrack.backend.dto.response.UserResponse;
import com.stocktrack.backend.enums.Role;
import com.stocktrack.backend.exception.UserNotFoundException;
import com.stocktrack.backend.model.RoleEntity;
import com.stocktrack.backend.model.User;
import com.stocktrack.backend.repository.RoleRepository;
import com.stocktrack.backend.repository.UserRepository;
import com.stocktrack.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public List<User> findAllActiveUsers() {
        return userRepository.findActiveUsers();
    }

    @Override
    public List<User> findActiveUsersByRole(Role role) {
        RoleEntity roleEntity = roleRepository.findByName(role)
                .orElseThrow(() -> new RuntimeException("Role not found: " + role));
        return userRepository.findActiveUsersByRole(roleEntity);
    }

    @Override
    @Transactional
    public User createUser(User user) {

//        encode password
        if (user.getPassword() != null && !user.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));

        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setIsActive(request.getIsActive());

        if (request.getRoles() != null) {
            Set<RoleEntity> roleEntities = convertRolesToEntities(request.getRoles());
            user.setRoles(roleEntities);
        }

        return userRepository.save(user);
    }

    @Override
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException("User not found with id: " + id);
        }

        User user = userRepository.findById(id).orElseThrow();
        user.getRoles().forEach(role -> role.getUsers().remove(user));

        userRepository.deleteById(id);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public long countUsers() {
        return userRepository.count();
    }

    // ==================== Helper Methods ====================
    private Set<RoleEntity> convertRolesToEntities(Set<Role> roles) {
        return roles.stream()
                .map(roleEnum -> roleRepository.findByName(roleEnum)
                        .orElseThrow(() -> new RuntimeException("Role not seeded in database: " + roleEnum)))
                .collect(Collectors.toSet());
    }

    private Set<Role> convertEntitiesToRoles(Set<RoleEntity> roleEntities) {
        return roleEntities.stream()
                .map(RoleEntity::getName)
                .collect(Collectors.toSet());
    }

    // ==================== DTO Mapping ====================
    @Override
    public UserResponse mapToUserResponse(User user) {
        Set<Role> roleEnums = convertEntitiesToRoles(user.getRoles());

        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                roleEnums,
                user.getIsActive(),
                user.getCreatedAt(),
                user.getLastLogin()
        );
    }

    @Override
    public List<UserResponse> mapToUserResponseList(List<User> users) {
        return users.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }
}
