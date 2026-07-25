package com.stocktrack.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InStockItemDTO {
    private Long productId;
    private String productName;
    private int currentStock;
    private double avgDailySales;
    private Integer minLevel;
    private Double daysOfSupply;
}
