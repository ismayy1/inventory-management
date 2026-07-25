package com.stocktrack.backend.controller;

import com.stocktrack.backend.dto.InventoryTransactionDTO;
import com.stocktrack.backend.enums.TransactionType;
import com.stocktrack.backend.exception.ErrorResponse;
import com.stocktrack.backend.exception.ProductNotFoundException;
import com.stocktrack.backend.model.InventoryTransaction;
import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.service.InventoryTransactionService;
import com.stocktrack.backend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class InventoryTransactionController {

    @Autowired
    private InventoryTransactionService transactionService;

    @Autowired
    private InventoryTransactionService inventoryTransactionService;

    @Autowired
    private ProductService productService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<InventoryTransaction> createTransaction(
            @Valid @RequestBody InventoryTransactionDTO dto) {

        InventoryTransaction transaction = transactionService.createTransaction(dto);
        return ResponseEntity.ok(transaction);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'INVENTORY_ANALYST')")
    public List<InventoryTransactionDTO> getAllTransactions() {
        return transactionService.getAllTransactionsDTO();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'INVENTORY_ANALYST')")
    public ResponseEntity<InventoryTransactionDTO> getTransactionById(@PathVariable Long id) {
        InventoryTransaction transaction = inventoryTransactionService.getTransactionById(id);
        InventoryTransactionDTO dto = new InventoryTransactionDTO(
                transaction.getId(),
                transaction.getProduct().getId(),
                transaction.getTransactionType(),
                transaction.getQuantity(),
                transaction.getUnitPrice(),
                transaction.getTotalAmount(),
                transaction.getReferenceNumber(),
                transaction.getDescription(),
                transaction.getCreatedBy(),
                transaction.getCreatedAt()
        );
        return ResponseEntity.ok(dto);
    }


    @GetMapping("/product/{productId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'INVENTORY_ANALYST')")
    public ResponseEntity<?> getTransactionsByProduct(@PathVariable Long productId) {
        if (!productService.existsById(productId)) {
            ErrorResponse error = new ErrorResponse(
                    "PRODUCT_NOT_FOUND",
                    "Product with ID " + productId + " does not exist"
            );
            return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
        }

        List<InventoryTransaction> transactions = transactionService.getTransactionsByProductId(productId);

        if (transactions.isEmpty()) {
            ErrorResponse error = new ErrorResponse(
                    "NO_TRANSACTIONS",
                    "Product exists but has no inventory transactions"
            );
            return new ResponseEntity<>(error, HttpStatus.OK);
        }

        List<InventoryTransactionDTO> dto = transactions.stream()
                .map(InventoryTransactionDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dto);

    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'INVENTORY_ANALYST')")
    public ResponseEntity<?> getTransactionsByType(@PathVariable TransactionType type) {

        if (type == null) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse("INVALID_TRANSACTION_TYPE",
                            "The transaction type provided is invalid")
            );
        }

        List<InventoryTransactionDTO> dtoList =
                transactionService.getTransactionsByType(type);

        if (dtoList.isEmpty()) {
            return ResponseEntity.ok(
                    new ErrorResponse("NO_TRANSACTIONS",
                            "No transactions found for type: " + type)
            );
        }

        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'INVENTORY_ANALYST')")
    public ResponseEntity<?> getTransactionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {

        if (start.isAfter(end)) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse(
                            "INVALID_DATE_RANGE",
                            "Start date must be before end date.",
                            HttpStatus.BAD_REQUEST
                    )
            );
        }

        List<InventoryTransactionDTO> transactions = transactionService.getTransactionsByDateRangeDTO(start, end);

        if (transactions.isEmpty()) {
            return ResponseEntity.ok(
                    new ErrorResponse(
                            "NO_TRANSACTIONS",
                            "No transactions found in the specified date range.",
                            HttpStatus.OK
                    )
            );
        }

        return ResponseEntity.ok(transactions);

    }

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'INVENTORY_ANALYST')")
    public ResponseEntity<?> getRecentTransactions(@RequestParam(defaultValue = "10") int limit) {
        if (limit <= 0) {
            return ResponseEntity.badRequest().body(
                    new ErrorResponse(
                            "INVALID_LIMIT",
                            "Limit must be greater than 0.",
                            HttpStatus.BAD_REQUEST
                    )
            );
        }

        List<InventoryTransactionDTO> transactions = transactionService.getRecentTransactionsDTO(limit);

        if (transactions.isEmpty()) {
            return ResponseEntity.ok(
                    new ErrorResponse(
                            "NO_TRANSACTIONS",
                            "No recent transactions found.",
                            HttpStatus.OK
                    )
            );
        }

        return ResponseEntity.ok(transactions);
    }
}
