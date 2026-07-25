package com.stocktrack.backend.service;

import com.stocktrack.backend.dto.request.UpdateUserRequest;
import com.stocktrack.backend.dto.response.UserResponse;
import com.stocktrack.backend.enums.Role;
import com.stocktrack.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface UserService {

    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findAllActiveUsers();
    List<User> findActiveUsersByRole(Role role);
    User createUser(User user);
    User updateUser(Long id, UpdateUserRequest request);
    void deleteUser(Long id);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    long countUsers();
    UserResponse mapToUserResponse(User user);
    List<UserResponse> mapToUserResponseList(List<User> users);
}
