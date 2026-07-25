package com.stocktrack.backend.dto;

import com.stocktrack.backend.enums.StockAdjustmentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StockAdjustmentDTO {

    private Long id;

    @NotNull(message = "Product ID is required!")
    private Long productId;

    @NotNull(message = "Adjustment type is required!")
    private StockAdjustmentType adjustmentType;

    @NotNull(message = "Adjustment quantity is required!")
    @Positive(message = "Adjustment quantity must be positive!")
    private Integer adjustmentQuantity;

    private Integer previousStock;

    private Integer newStock;

    @NotBlank(message = "Reason is required")
    private String reason;

    @NotBlank(message = "Adjusted by is required")
    private String adjustedBy;

    private LocalDateTime adjustedAt;
    private String notes;
}
