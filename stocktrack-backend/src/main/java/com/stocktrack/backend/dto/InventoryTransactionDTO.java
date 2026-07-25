package com.stocktrack.backend.dto;

import com.stocktrack.backend.enums.TransactionType;
import com.stocktrack.backend.model.InventoryTransaction;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class InventoryTransactionDTO {

    private Long id;

    @NotNull(message = "Product ID is required")
    private Long productId;

    private String productName;

    @NotNull(message = "Transaction type is required")
    private TransactionType transactionType;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    private BigDecimal unitPrice;
    private BigDecimal totalAmount;

    @Size(max = 100, message = "Reference number must not exceed 100 characters")
    private String referenceNumber;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private LocalDateTime createdAt;

    @NotNull(message = "Created by is required")
    @Size(min = 1, max = 100, message = "Created by must be between 1 and 100 characters")
    private String createdBy;

    public InventoryTransactionDTO() {}

//    Mapper
public static InventoryTransactionDTO fromEntity(InventoryTransaction t) {
    return new InventoryTransactionDTO(
            t.getId(),
            t.getProduct().getId(),
            t.getTransactionType(),
            t.getQuantity(),
            t.getUnitPrice(),
            t.getTotalAmount(),
            t.getReferenceNumber(),
            t.getDescription(),
            t.getCreatedBy(),
            t.getCreatedAt()
    );
}

    public InventoryTransactionDTO(Long id, Long productId, String productName, TransactionType transactionType,
                                   Integer quantity, BigDecimal unitPrice, BigDecimal totalAmount, String referenceNumber,
                                   String description, LocalDateTime createdAt, String createdBy) {

        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalAmount = totalAmount;
        this.referenceNumber = referenceNumber;
        this.description = description;
        this.createdAt = createdAt;
        this.createdBy = createdBy;
    }

    public InventoryTransactionDTO(Long id, Long productId, TransactionType transactionType, Integer quantity,
                                   BigDecimal unitPrice, BigDecimal totalAmount, String referenceNumber,
                                   String description, String createdBy, LocalDateTime createdAt) {

        this.id = id;
        this.productId = productId;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.referenceNumber = referenceNumber;
        this.description = description;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

}