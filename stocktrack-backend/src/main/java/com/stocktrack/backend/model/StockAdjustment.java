package com.stocktrack.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.stocktrack.backend.enums.StockAdjustmentType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "stock_adjustments")
public class StockAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "adjustment_type", nullable = false)
    private StockAdjustmentType adjustmentType;

    @NotNull(message = "Adjustment quantity is required!")
    @Positive(message = "Adjustment quantity must be positive!")
    @Column(name = "adjustment_quantity", nullable = false)
    private Integer adjustmentQuantity;

    @Column(name = "previous_stock", nullable = false)
    private Integer previousStock;

    @Column(name = "new_stock", nullable = false)
    private Integer newStock;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "adjusted_by", length = 100)
    private String adjustedBy;

    @Column(name = "adjusted_at", nullable = false)
    private LocalDateTime adjustedAt;

    @Column(name = "notes", length = 1000)
    private String notes;

    public StockAdjustment() {
        this.adjustedAt = LocalDateTime.now();
    }

    public StockAdjustment(Product product, StockAdjustmentType adjustmentType,
                           Integer adjustmentQuantity, String reason) {
        this.product = product;
        this.adjustmentType = adjustmentType;
        this.adjustmentQuantity = adjustmentQuantity;
        this.reason = reason;
        this.adjustedAt = LocalDateTime.now();
    }

    public StockAdjustment(Long id, Product product, StockAdjustmentType adjustmentType, Integer adjustmentQuantity,
                           Integer previousStock, Integer newStock, String reason, String adjustedBy, String notes) {
        this.id = id;
        this.product = product;
        this.adjustmentType = adjustmentType;
        this.adjustmentQuantity = adjustmentQuantity;
        this.previousStock = previousStock;
        this.newStock = newStock;
        this.reason = reason;
        this.adjustedBy = adjustedBy;
        this.adjustedAt = LocalDateTime.now();
        this.notes = notes;
    }
}
