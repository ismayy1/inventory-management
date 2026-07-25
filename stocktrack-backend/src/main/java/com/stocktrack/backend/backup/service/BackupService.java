package com.stocktrack.backend.backup.service;

import com.stocktrack.backend.backup.dto.BackupInfoDTO;

import java.util.List;

public interface BackupService {

    String createBackup();
    List<BackupInfoDTO> listBackups();
    void restoreBackup(String filename);
    void deleteBackup(String filename);
}
