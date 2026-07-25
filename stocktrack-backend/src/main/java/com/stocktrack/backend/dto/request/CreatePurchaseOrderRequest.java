package com.stocktrack.backend.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class CreatePurchaseOrderRequest {

    private Long supplierId;

    private LocalDate expectedDeliveryDate;

    private List<PurchaseOrderItemRequest> items;
}
