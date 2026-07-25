package com.stocktrack.backend.dto;

import com.stocktrack.backend.enums.MeasurementUnit;
import com.stocktrack.backend.enums.ProductCategory;
import com.stocktrack.backend.enums.StockStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class ProductDTO {

    private Long id;

    @NotBlank(message = "Product name is required!")
    private String name;

    @NotNull(message = "Current stock is required!")
    @Min(value = 0, message = "Current stock must be positive!")
    private Integer currentStock;

    @NotNull(message = "Reorder threshold is required!")
    @Min(value = 1, message = "Reorder threshold must be at least 1!")
    private Integer reorderThreshold;

    private String sku;
    private String barcode;
    private ProductCategory category;

    @DecimalMin(value = "0.0", inclusive = false, message = "Price Must be positive!")
    private BigDecimal price;

    private String description;
    private String unitOfMeasure;
    private Boolean isActive = true;

    private StockStatus stockStatus;

    private LocalDateTime expiryDate;

    private Long supplierId;

    public ProductDTO() {}
}
