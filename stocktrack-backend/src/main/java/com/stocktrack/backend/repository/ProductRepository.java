package com.stocktrack.backend.repository;

import com.stocktrack.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCurrentStockLessThanEqual(Integer threshold);

    @Query("SELECT p FROM Product p WHERE p.currentStock <= p.reorderThreshold AND p.currentStock > 0")
    List<Product> findLowStockProducts();

    @Query("SELECT p FROM Product p WHERE p.currentStock <= 0")
    List<Product> findOutOfStockProducts();

    List<Product> findByNameContainingIgnoreCase(String name);
    Product findByBarcode(String barcode);
    Product findBySku(String sku);
    List<Product> findBySupplierId(Long supplierId);
}
