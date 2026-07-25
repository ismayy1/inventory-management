package com.stocktrack.backend.backup.service;

import com.stocktrack.backend.backup.dto.BackupInfoDTO;
import com.stocktrack.backend.backup.exception.BackupException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BackupServiceImpl implements BackupService {

//    PostgreSQL connection properties from application.properties
    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username:postgres}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

//    Backup directory relative to current working directory
    private static final String BACKUP_DIR = "backups";
//====================================
//    postgreSQL bin directory
    private static final String PG_DUMP = getCommand("C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump");
//    @Value("${postgres.bin.path}")
//    private String postgresBinPath;
    private static final String PSQL = getCommand("C:\\Program Files\\PostgreSQL\\16\\bin\\psql");
//    -------------------------
//    private String getPgDump() {
//        return getCommand(postgresBinPath + "/pg_dump");
//    }
//    private String getPsql() {
//        return getCommand(postgresBinPath + "/psql");
//    }
//    -------------------------
//====================================

    @Override
    public String createBackup() {
        try {
//            Creating backup directory if not exists
            Files.createDirectories(Paths.get(BACKUP_DIR));

//            Generating filename with timestamp
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = "stocktrack_backup_" + timestamp + ".dump";
            Path backupPath = Paths.get(BACKUP_DIR, filename);

//            Extract database name from URL (jdbc:postgresql://localhost:8080/stocktrackdb)
            String dbName = extractDbName(dbUrl);

//            Build pg_dump command
            List<String> command = new ArrayList<>();
            command.add(PG_DUMP);
//            command.add(getPgDump());
            command.add("--format=custom"); // .dump format (compressed, efficient)
            command.add("--file=" + backupPath.toAbsolutePath().toString());
            command.add("--host=localhost");
            command.add("--port=5432"); // 3000 - also fine
            command.add("--username=" + dbUsername);
            command.add(dbName);

//            Executing command
            ProcessBuilder pb = new ProcessBuilder(command);
            Map<String, String> env = pb.environment();
            env.put("PGPASSWORD", dbPassword);  // required for non-interactive mode

            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                String error = new String(process.getErrorStream().readAllBytes());
                throw new BackupException("Backup failed with exit code: " + exitCode + ": " + error);
            }

            return filename;
        } catch (Exception e) {
            throw new BackupException("Failed to create backup", e);
        }
    }

    @Override
    public List<BackupInfoDTO> listBackups() {
        try {
            Path backupDir = Paths.get(BACKUP_DIR);
            if (!Files.exists(backupDir)) {
                return Collections.emptyList();
            }

            return Files.list(backupDir)
                    .filter(path -> path.toString().endsWith(".dump"))
                    .map(path -> {
                        try {
                            BasicFileAttributes attrs = Files.readAttributes(path, BasicFileAttributes.class);
                            return new BackupInfoDTO(
                                    path.getFileName().toString(),
                                    LocalDateTime.ofInstant(attrs.creationTime().toInstant(), java.time.ZoneId.systemDefault()),
                                    attrs.size()
                            );
                        } catch (IOException e) {
                            throw new BackupException("Failed to read Backup file: " + path, e);
                        }
                    })
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt())) // newest first
                    .collect(Collectors.toList());
        } catch (IOException e) {
            throw new BackupException("Failed to list backups: ", e);
        }
    }

    @Override
    public void restoreBackup(String filename) {
        try {
            Path backupPath = Paths.get(BACKUP_DIR, filename);
            if (!Files.exists(backupPath)) {
                throw new BackupException("Backup File not found: " + filename);
            }

            String dbName = extractDbName(dbUrl);

//            Drop and recreate database - necessary for clean restore
            recreateDatabase(dbName);

//            Restoring from backup
            List<String> command = new ArrayList<>();
//            command.add(PSQL);
//            command.add(getPsql());
            command.add("--host=localhost");
            command.add("--port=5432");
            command.add("--username=" + dbUsername);
            command.add("--dbname=" + dbName);
            command.add("--file=" + backupPath.toAbsolutePath().toString());

            ProcessBuilder pb = new ProcessBuilder(command);
            Map<String, String> env = pb.environment();
            env.put("PGPASSWORD", dbPassword);

            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                String error = new String(process.getErrorStream().readAllBytes());
                throw new BackupException("Restore failed with exit code: " + exitCode + ": " + error);
            }
        } catch (Exception e) {
            throw new BackupException("Failed to resotre backup: ", e);
        }
    }

    @Override
    public void deleteBackup(String filename) {
        try {
            Path backupPath = Paths.get(BACKUP_DIR, filename);
            if (!Files.exists(backupPath)) {
                throw new BackupException("Backup file not found: " + filename);
            }
            Files.delete(backupPath);
        } catch (IOException e) {
            throw new BackupException("Failed to delete backup: " + filename, e);
        }
    }


//    HELPER methods
//    Extract database name from JDBC URL
    private String extractDbName(String url) {
        // jdbc:postgresql://localhost:5432/stocktrackdb
        int lastSlash = url.lastIndexOf('/');
        if (lastSlash == -1) {
            throw new BackupException("Invalid database URL: " + url);
        }
        return url.substring(lastSlash + 1);
    }

//    Recreate database (drop + create)
    private void recreateDatabase(String dbName) throws Exception {
        // Connect to 'postgres' database (default administrative DB)
        List<String> dropCommand = Arrays.asList(
                PSQL, "--host=localhost", "--port=5432", "--username=" + dbUsername,
                "--dbname=postgres", "-c", "DROP DATABASE IF EXISTS " + dbName + ";"
//                getPsql(), "--host=localhost", "--port=5432", "--username=" + dbUsername,
//                "--dbname=postgres", "-c", "DROP DATABASE IF EXISTS " + dbName + ";"
        );

        List<String> createCommand = Arrays.asList(
                PSQL, "--host=localhost", "--port=5432", "--username=" + dbUsername,
                "--dbname=postgres", "-c", "CREATE DATABASE " + dbName + ";"
//                getPsql(), "--host=localhost", "--port=5432", "--username=" + dbUsername,
//                "--dbname=postgres", "-c", "CREATE DATABASE " + dbName + ";"
        );

        executeCommand(dropCommand);
        executeCommand(createCommand);
    }

    private void executeCommand(List<String> command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        Map<String, String> env = pb.environment();
        env.put("PGPASSWORD", dbPassword);

        Process process = pb.start();
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            String error = new String(process.getErrorStream().readAllBytes());
            throw new BackupException("Command failed: " + error);
        }
    }

//    Get OS-specific command path
    private static String getCommand(String baseName) {
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            return baseName + ".exe";
        }
        return baseName;
    }
}
