package com.stocktrack.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.stocktrack.backend.enums.MeasurementUnit;
import com.stocktrack.backend.enums.ProductCategory;
import com.stocktrack.backend.enums.StockStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Table(name = "products")
public class Product {

    @Setter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Product name is required!")
    @Column(nullable = false, length = 255)
    private String name;

    @NotNull(message = "Current stock is required!")
    @Min(value = 0, message = "Current stock must be positive!")
    @Column(nullable = false)
    private Integer currentStock = 0;

    @NotNull(message = "Reorder threshold is required!")
    @Min(value = 1, message = "Reorder threshold must be at least 1!")
    @Column(name = "reorder_threshold", nullable = false)
    private Integer reorderThreshold = 0;

    @Column(name = "sku", unique = true, length = 100)
    private String sku;

    @Column(name = "barcode", length = 50, unique = true)
    private String barcode;

    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private ProductCategory category;

    @DecimalMin(value = "0.0", inclusive = false, message = "Price Must be positive!")
    @Column(name = "unit_price", precision = 10, scale = 2)
    @Setter
    private BigDecimal unitPrice;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "unit_of_measure")
    private MeasurementUnit unitOfMeasure;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<StockAdjustment> adjustments = new ArrayList<>();

    @Column(name = "avg_daily_sales_90d")
    @Setter
    private Double avgDailySales90d = 0.0;

    @Column(name = "sold_last_90_days")
    @Setter
    private Integer soldLast90Days = 0;

    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    @Setter
    Integer totalLossQuantity = 0;

    public Product() {
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Product(String name, Integer currentStock, Integer reorderThreshold) {
        this.name = name;
        this.currentStock = currentStock;
        this.reorderThreshold = reorderThreshold;
        this.createdAt = LocalDateTime.now();
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
        this.updatedAt = LocalDateTime.now();
    }

    public void setName(String name) {
        this.name = name;
        this.updatedAt = LocalDateTime.now();
    }

    public void setCurrentStock(Integer currentStock) {
        this.currentStock = currentStock;
        this.updatedAt = LocalDateTime.now();
    }

    public void setReorderThreshold(Integer reorderThreshold) {
        this.reorderThreshold = reorderThreshold;
        this.updatedAt = LocalDateTime.now();
    }

    public void setSku(String sku) {
        this.sku = sku;
        this.updatedAt = LocalDateTime.now();
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
        this.updatedAt = LocalDateTime.now();
    }

    public void setCategory(ProductCategory category) {
        this.category = category;
        this.updatedAt = LocalDateTime.now();
    }

    public void setPrice(BigDecimal price) {
        this.unitPrice = price;
        this.updatedAt = LocalDateTime.now();
    }

    public void setDescription(String description) {
        this.description = description;
        this.updatedAt = LocalDateTime.now();
    }

    public void setUnitOfMeasure(MeasurementUnit unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
        this.updatedAt = LocalDateTime.now();
    }

    public void setIsActive(Boolean active) {
        isActive = active;
        this.updatedAt = LocalDateTime.now();
    }

    public void setExpiryDate(LocalDateTime expiryDate) {
        this.expiryDate = expiryDate;
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isCriticalStock() {
        return currentStock != null && currentStock <= Math.max(1, reorderThreshold / 2);
    }


    public StockStatus getStockStatus() {
        return getStockStatus(this.expiryDate);
    }

    public StockStatus getStockStatus(LocalDateTime expiryDate) {

        final int LOW_DAYS_THRESHOLD = 7;
        final int OVER_DAYS_THRESHOLD = 90;
        final int NEAR_EXPIRY_DAYS = 14; // prioritize reduction within two weeks
        final int NO_SALES_OVERSTOCK_FACTOR = 10; // heuristic when no sales data

        // 1) Out of stock
        if (currentStock == null || currentStock <= 0) {
            return StockStatus.OUT_OF_STOCK;
        }

        // 2) Expiry-aware override: prioritize reduction if near expiry
        if (expiryDate != null) {
            long daysToExpiry = ChronoUnit.DAYS.between(LocalDateTime.now(), expiryDate);
            if (daysToExpiry < 0) {
                // already expired — treat as low-priority for removal/clearance
                return StockStatus.LOW_STOCK;
            }
            if (daysToExpiry <= NEAR_EXPIRY_DAYS) {
                return StockStatus.LOW_STOCK;
            }
        }

        // 3) Use sales data when available
        if (avgDailySales90d != null && avgDailySales90d > 0) {
            double coverageDays = currentStock / avgDailySales90d;

            if (coverageDays <= LOW_DAYS_THRESHOLD) {
                return StockStatus.LOW_STOCK;
            }

            if (coverageDays >= OVER_DAYS_THRESHOLD) {
                return StockStatus.OVER_STOCK;
            }

            return StockStatus.IN_STOCK;
        }

        // 4) Fallback when no sales data: use reorder threshold heuristics
        if (reorderThreshold != null && currentStock <= reorderThreshold) {
            return StockStatus.LOW_STOCK;
        }

        if (reorderThreshold != null && currentStock >= reorderThreshold * NO_SALES_OVERSTOCK_FACTOR) {
            return StockStatus.OVER_STOCK;
        }

        return StockStatus.IN_STOCK;
    }
}
