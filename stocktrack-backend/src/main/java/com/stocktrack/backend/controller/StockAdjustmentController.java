package com.stocktrack.backend.controller;

import com.stocktrack.backend.dto.StockAdjustmentDTO;
import com.stocktrack.backend.model.StockAdjustment;
import com.stocktrack.backend.repository.ProductRepository;
import com.stocktrack.backend.service.StockAdjustmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stock-adjustments")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class StockAdjustmentController {

    @Autowired
    private StockAdjustmentService stockAdjustmentService;
    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'INVENTORY_ANALYST')")
    public ResponseEntity<List<StockAdjustmentDTO>> getAllAdjustments() {

        List<StockAdjustment> adjustments = stockAdjustmentService.getAllAdjustments();

        List<StockAdjustmentDTO> dtoList = adjustments.stream()
                .map(adj -> new StockAdjustmentDTO(
                        adj.getId(),
                        adj.getProduct().getId(),
                        adj.getAdjustmentType(),
                        adj.getAdjustmentQuantity(),
                        adj.getPreviousStock(),
                        adj.getNewStock(),
                        adj.getReason(),
                        adj.getAdjustedBy(),
                        adj.getAdjustedAt(),
                        adj.getNotes()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'INVENTORY_ANALYST')")
    public ResponseEntity<StockAdjustment> getAdjustmentById(@PathVariable Long id) {
        StockAdjustment adjustment = stockAdjustmentService.getAdjustmentById(id);
        return ResponseEntity.ok(adjustment);
    }

    @GetMapping("/product/{productId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'INVENTORY_ANALYST')")
    public List<StockAdjustment> getAdjustmentsByProduct(@PathVariable Long productId) {
        return stockAdjustmentService.getAdjustmentsByProduct(productId);
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'INVENTORY_ANALYST')")
    public List<StockAdjustment> getRecentAdjustments(@RequestParam(defaultValue = "10") int limit) {
        return stockAdjustmentService.getRecentAdjustments(limit);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF')")
    public ResponseEntity<StockAdjustmentDTO> createStockAdjustment(
            @Valid @RequestBody StockAdjustmentDTO dto
    ) {

        StockAdjustment adjustment = stockAdjustmentService.createStockAdjustment(
                dto.getProductId(),
                dto.getAdjustmentType(),
                dto.getAdjustmentQuantity(),
                dto.getReason(),
                dto.getAdjustedBy(),
                dto.getNotes()
        );

        StockAdjustmentDTO response = new StockAdjustmentDTO(
                adjustment.getId(),
                adjustment.getProduct().getId(),
                adjustment.getAdjustmentType(),
                adjustment.getAdjustmentQuantity(),
                adjustment.getPreviousStock(),
                adjustment.getNewStock(),
                adjustment.getReason(),
                adjustment.getAdjustedBy(),
                adjustment.getAdjustedAt(),
                adjustment.getNotes()
        );

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<StockAdjustment> updateStockAdjustment(
            @PathVariable Long id,
            @Valid @RequestBody StockAdjustmentDTO dto
    ) {
        StockAdjustment updated = stockAdjustmentService.updateStockAdjustment(
                id,
                dto.getAdjustmentQuantity(),
                dto.getReason(),
                dto.getNotes()
        );

        return ResponseEntity.ok(updated);
    }
}
