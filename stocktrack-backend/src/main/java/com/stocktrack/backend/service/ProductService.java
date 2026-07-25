package com.stocktrack.backend.service;

import com.stocktrack.backend.dto.ProductDTO;
import com.stocktrack.backend.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ProductService {

    Page<Product> getAllProducts(Pageable pageable);
    Optional<Product> getProductById(Long id);
    Product createProduct(ProductDTO productDTO);
    Product updateProduct(Long id, ProductDTO productDTO);
    void deleteProduct(Long id);
    List<Product> searchProducts(String name);
    List<Product> getLowStockProducts();
    List<Product> getOutOfStockProducts();
    List<Product> getCriticalStockProducts();
    Product updateStock(Long productId, Integer newStock, String reason, String adjustedBy);
    Product adjustStock(Long productId, Integer adjustment, String reason, String adjustedBy);
    boolean existsById(Long id);
}
