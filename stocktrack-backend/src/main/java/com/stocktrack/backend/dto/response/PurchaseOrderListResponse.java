package com.stocktrack.backend.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class PurchaseOrderListResponse {

    private Long id;
    private String poNumber;
    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;
    private String status;

    private Long supplierId;
    private String supplierName;

    private BigDecimal totalAmount;
}
