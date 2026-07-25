package com.stocktrack.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LowStockItemDTO {

    private Long productId;
    private String productName;
    private int currentStock;
    private Integer minLevel;
    private Double avgDailySales;
    private Double daysOfSupply;
}
