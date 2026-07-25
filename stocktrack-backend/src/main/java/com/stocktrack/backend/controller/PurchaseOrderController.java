package com.stocktrack.backend.controller;

import com.stocktrack.backend.dto.request.CreatePurchaseOrderRequest;
import com.stocktrack.backend.dto.response.PurchaseOrderDetailsResponse;
import com.stocktrack.backend.dto.response.PurchaseOrderListResponse;
import com.stocktrack.backend.model.PurchaseOrder;
import com.stocktrack.backend.repository.PurchaseOrderRepository;
import com.stocktrack.backend.service.impl.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService service;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @PostMapping
    public PurchaseOrder create(@RequestBody CreatePurchaseOrderRequest request) {
        return service.create(request);
    }

    @PostMapping("/{id}/receive")
    public PurchaseOrderListResponse receive(@PathVariable Long id) {
        return service.receiveOrder(id);
    }

    @GetMapping
    public List<PurchaseOrderListResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public PurchaseOrderDetailsResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<PurchaseOrderListResponse> cancelOrder(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                service.cancelOrder(id)
        );
    }
}
