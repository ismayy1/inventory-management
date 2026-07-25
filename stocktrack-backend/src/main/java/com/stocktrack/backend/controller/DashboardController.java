package com.stocktrack.backend.controller;


import com.stocktrack.backend.dto.*;
import com.stocktrack.backend.service.InventoryAnalyticsService;
import com.stocktrack.backend.service.InventoryTransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final InventoryTransactionService inventoryTransactionService;
    private final InventoryAnalyticsService inventoryAnalyticsService;

    public DashboardController(InventoryTransactionService inventoryTransactionService, InventoryAnalyticsService inventoryAnalyticsService) {
        this.inventoryTransactionService = inventoryTransactionService;
        this.inventoryAnalyticsService = inventoryAnalyticsService;
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER')")
    @GetMapping("/overstock-items")
    public ResponseEntity<List<OverstockItemDTO>> getOverstockItems() {
        return ResponseEntity.ok(
                inventoryAnalyticsService.getOverstockItems()
        );
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER')")
    @GetMapping("/in-stock-items")
    public ResponseEntity<List<InStockItemDTO>> getInStockItems() {
        return ResponseEntity.ok(
                inventoryAnalyticsService.getInStockItems()
        );
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER')")
    @GetMapping("/low-stock-items")
    public ResponseEntity<List<LowStockItemDTO>> getLowStockItems() {
        return ResponseEntity.ok(
                inventoryAnalyticsService.getLowStockItems()
        );
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER')")
    @GetMapping("/stock-status-summary")
    public ResponseEntity<Map<String, Long>> getStockStatusSummary() {
        return ResponseEntity.ok(
                inventoryAnalyticsService.getStockStatusSummary()
        );
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER')")
    @GetMapping("/product-categories")
    public ResponseEntity<List<CategoryChartDTO>> getProductCategories() {
        return ResponseEntity.ok(
                inventoryAnalyticsService.getProductCategoryDistribution()
        );
    }
}
