package com.stocktrack.backend.repository;

import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.model.StockAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, Long> {

    List<StockAdjustment> findByProductOrderByAdjustmentQuantityDesc(Product product);
    List<StockAdjustment> findByAdjustedAtBetween(LocalDateTime start, LocalDateTime end);
    List<StockAdjustment> findByProductIdOrderByAdjustedAtDesc(Long productId);
}
