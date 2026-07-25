package com.stocktrack.backend.controller;

import com.stocktrack.backend.dto.request.ChangePasswordRequest;
import com.stocktrack.backend.dto.request.UpdateProfileRequest;
import com.stocktrack.backend.dto.response.MessageResponse;
import com.stocktrack.backend.dto.response.ProfileResponse;
import com.stocktrack.backend.security.services.UserDetailsImpl;
import com.stocktrack.backend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"}, maxAge = 3600)
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public ResponseEntity<ProfileResponse> getProfile(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        ProfileResponse profileResponse = profileService.getProfile(userDetails.getId());
        return ResponseEntity.ok(profileResponse);
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public ResponseEntity<ProfileResponse> updateProfile(
            Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        profileService.updateProfile(userDetails.getId(), request);

        ProfileResponse updatedProfile = profileService.getProfile(userDetails.getId());
        return ResponseEntity.ok(updatedProfile);
    }

    @PutMapping("/password")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public ResponseEntity<MessageResponse> changePassword(
            Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        profileService.changePassword(userDetails.getId(), request);
        return ResponseEntity.ok(new MessageResponse("Password updated successfully!"));
    }

    @PostMapping("/picture")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public ResponseEntity<?> uploadProfilePicture(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {

        try {
            UserDetailsImpl userDetails =
                    (UserDetailsImpl) authentication.getPrincipal();

            ProfileResponse response =
                    profileService.uploadProfilePicture(userDetails.getId(), file);

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity
                    .status(500)
                    .body(new MessageResponse("Failed to upload profile picture"));
        }
    }

    @DeleteMapping("/picture")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public ResponseEntity<MessageResponse> deleteProfilePicture(
            Authentication authentication) {

        UserDetailsImpl userDetails =
                (UserDetailsImpl) authentication.getPrincipal();

        profileService.deleteProfilePicture(userDetails.getId());

        return ResponseEntity.ok(
                new MessageResponse("Profile picture removed successfully")
        );
    }
}
