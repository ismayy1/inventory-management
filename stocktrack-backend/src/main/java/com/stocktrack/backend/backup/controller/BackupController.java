package com.stocktrack.backend.backup.controller;

import com.stocktrack.backend.backup.dto.BackupInfoDTO;
import com.stocktrack.backend.backup.service.BackupService;
import com.stocktrack.backend.dto.response.MessageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"}, maxAge = 3600)
@RestController
@RequestMapping("/api/backup")
public class BackupController {

    @Autowired
    private BackupService backupService;

    @PostMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<MessageResponse> createBackup() {
        String filename = backupService.createBackup();
        return ResponseEntity.ok(new MessageResponse("Backup created successfully: " + filename));
    }

    @GetMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<List<BackupInfoDTO>> listBackups() {
        List<BackupInfoDTO> backups = backupService.listBackups();
        return ResponseEntity.ok(backups);
    }

    @PostMapping("/restore/{filename}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<MessageResponse> restoreBackup(@PathVariable String filename) {
        backupService.restoreBackup(filename);
        return ResponseEntity.ok(new MessageResponse("Database restored from: " + filename));
    }

    @DeleteMapping("/{filename}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<MessageResponse> deleteBackup(@PathVariable String filename) {
        backupService.deleteBackup(filename);
        return ResponseEntity.ok(new MessageResponse("Backup deleted successfully: " + filename));
    }
}
