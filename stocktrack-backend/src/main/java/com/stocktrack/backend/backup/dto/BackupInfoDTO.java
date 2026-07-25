package com.stocktrack.backend.backup.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class BackupInfoDTO {

    private String fileName;
    private LocalDateTime createdAt;
    private Long sizeBytes;
    private String sizeHumanReadable;

    public BackupInfoDTO(String fileName, LocalDateTime createdAt, Long sizeBytes) {
        this.fileName = fileName;
        this.createdAt = createdAt;
        this.sizeBytes = sizeBytes;
        this.sizeHumanReadable = formatFileSize(sizeBytes);
    }

//    Helper: convert bytes to KB/Mb/GB
    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024 * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.1f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
