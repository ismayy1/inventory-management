package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.enums.StockAdjustmentType;
import com.stocktrack.backend.exception.ProductNotFoundException;
import com.stocktrack.backend.exception.StockAdjustmentNotFoundException;
import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.model.StockAdjustment;
import com.stocktrack.backend.repository.ProductRepository;
import com.stocktrack.backend.repository.StockAdjustmentRepository;
import com.stocktrack.backend.service.StockAdjustmentService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class StockAdjustmentServiceImpl implements StockAdjustmentService {

    private StockAdjustmentRepository stockAdjustmentRepository;
    private ProductRepository productRepository;

    public StockAdjustmentServiceImpl(ProductRepository productRepository,
                                      StockAdjustmentRepository stockAdjustmentRepository) {
        this.productRepository = productRepository;
        this.stockAdjustmentRepository = stockAdjustmentRepository;
    }

    @Override
    @Transactional
    public StockAdjustment createStockAdjustment(
            Long productID,
            StockAdjustmentType type,
            Integer quantity,
            String reason,
            String adjustedBy,
            String notes
    ) {

        if (productID == null) {
            throw new IllegalArgumentException("Product ID cannot be null");
        }

        if (type == null) {
            throw new IllegalArgumentException("Adjustment type cannot be null");
        }

        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Adjustment quantity must be positive");
        }

        Product product = productRepository.findById(productID)
                .orElseThrow(() ->
                        new ProductNotFoundException(
                                "Product not found with id: " + productID
                        )
                );

        Integer previousStock = product.getCurrentStock();

        Integer newStock;

        switch (type) {

            case INCREMENT:
                newStock = previousStock + quantity;
                break;

            case DECREMENT:
                if (previousStock < quantity) {
                    throw new IllegalArgumentException(
                            "Insufficient stock for adjustment"
                    );
                }

                newStock = previousStock - quantity;
                break;

            default:
                throw new IllegalArgumentException(
                        "Unsupported adjustment type: " + type
                );
        }

        product.setCurrentStock(newStock);

        StockAdjustment adjustment = new StockAdjustment();

        adjustment.setProduct(product);
        adjustment.setAdjustmentType(type);
        adjustment.setAdjustmentQuantity(quantity);

        adjustment.setPreviousStock(previousStock);
        adjustment.setNewStock(newStock);

        adjustment.setReason(reason);
        adjustment.setAdjustedBy(adjustedBy);
        adjustment.setAdjustedAt(LocalDateTime.now());

        adjustment.setNotes(notes);

        productRepository.save(product);

        return stockAdjustmentRepository.save(adjustment);
    }

    @Override
    public List<StockAdjustment> getAdjustmentsByProduct(Long productId) {
        return stockAdjustmentRepository.findByProductIdOrderByAdjustedAtDesc(productId);
    }

    @Override
    public List<StockAdjustment> getRecentAdjustments(int limit) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusDays(7);

        return stockAdjustmentRepository.findByAdjustedAtBetween(since, now).stream()
                .sorted((a, b) -> b.getAdjustedAt().compareTo(a.getAdjustedAt()))
                .limit(limit)
                .toList();
    }

    @Override
    public StockAdjustment getAdjustmentById(Long id) {
        return stockAdjustmentRepository.findById(id)
                .orElseThrow(() -> new StockAdjustmentNotFoundException("Stock adjustment not found with id: " + id));
    }

    @Override
    public List<StockAdjustment> getAllAdjustments() {
        return stockAdjustmentRepository.findAll();
    }

    @Override
    public StockAdjustment updateStockAdjustment(
            Long id,
            Integer quantity,
            String reason,
            String notes
    ) {
        StockAdjustment adjustment = stockAdjustmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Adjustment not found"));

        adjustment.setAdjustmentQuantity(quantity);

        if (adjustment.getReason() != null && !adjustment.getReason().isEmpty()) {
            adjustment.setReason(adjustment.getReason() + " | " + reason);
        } else {
            adjustment.setReason(reason);
        }

        if (notes == null || notes.trim().isEmpty()) {
            throw new RuntimeException("Notes are required for revaluation");
        }
        adjustment.setNotes(notes);

        return stockAdjustmentRepository.save(adjustment);
    }
}
