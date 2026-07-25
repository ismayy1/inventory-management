package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.dto.request.ChangePasswordRequest;
import com.stocktrack.backend.dto.request.UpdateProfileRequest;
import com.stocktrack.backend.dto.response.ProfileResponse;
import com.stocktrack.backend.model.User;
import com.stocktrack.backend.repository.UserRepository;
import com.stocktrack.backend.service.ProfileService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProfileServiceImpl implements ProfileService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        ProfileResponse response = new ProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setFullName(user.getFullName());
        response.setRoles(user.getRoles()
                .stream()
                .map(roleEntity -> roleEntity.getName().name())
                .collect(Collectors.toSet()));
        response.setIsActive(user.getIsActive());
        response.setCreatedAt(user.getCreatedAt());
        response.setLastLogin(user.getLastLogin());

        String profilePicture = user.getProfilePicture();

        if (profilePicture != null && !profilePicture.isEmpty()) {
            response.setProfilePicture(profilePicture);
        } else {
            response.setProfilePicture(null);
        }

        return response;
    }

    @Override
    public User updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

//        Checking if email is changed and is unique
        if (!user.getEmail().equals(request.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email is already in use!");
            }
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());

        return userRepository.save(user);
    }

    @Override
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

//        Verifying current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect!");
        }

//        Validating new password confirmation
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("New password and confirmation passwords don't match!");
        }

//        Preventing the usage of same password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("New password must be different than current password!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public ProfileResponse uploadProfilePicture(Long userId, MultipartFile file) {

        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (file.isEmpty()) {
                throw new RuntimeException("File is empty");
            }

            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

            Path uploadPath = Paths.get(System.getProperty("user.dir"), "uploads/profile");

            Files.createDirectories(uploadPath);

            Path targetFile = uploadPath.resolve(fileName);

            Files.copy(
                    file.getInputStream(),
                    targetFile,
                    StandardCopyOption.REPLACE_EXISTING
            );

            System.out.println("FILE SAVED TO: " + targetFile.toAbsolutePath());

            user.setProfilePicture("/uploads/profile/" + fileName);
            userRepository.saveAndFlush(user);

            return getProfile(userId);

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload profile picture", e);
        }
    }

    @Override
    @Transactional
    public void deleteProfilePicture(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String profilePicturePath = user.getProfilePicture();

        // If no profile picture set, just exit safely
        if (profilePicturePath == null || profilePicturePath.isEmpty()) {
            return;
        }

        try {
            // Convert "/uploads/profile/file.jpg" -> "uploads/profile/file.jpg"
//            Path filePath = Paths.get("uploads/profile").resolve(fileName);
            Path filePath = Paths.get("uploads/profile")
                    .resolve(Paths.get(profilePicturePath).getFileName());

            Files.deleteIfExists(filePath);

        } catch (IOException e) {
            throw new RuntimeException("Failed to delete profile picture file", e);
        }

        // Remove from DB
        user.setProfilePicture(null);
        userRepository.save(user);
    }
}
