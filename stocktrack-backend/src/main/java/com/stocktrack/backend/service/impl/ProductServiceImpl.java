package com.stocktrack.backend.service.impl;

import com.stocktrack.backend.dto.ProductDTO;
import com.stocktrack.backend.enums.MeasurementUnit;
import com.stocktrack.backend.enums.StockAdjustmentType;
import com.stocktrack.backend.exception.ProductNotFoundException;
import com.stocktrack.backend.exception.ResourceNotFoundException;
import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.model.StockAdjustment;
import com.stocktrack.backend.model.Supplier;
import com.stocktrack.backend.repository.ProductRepository;
import com.stocktrack.backend.repository.StockAdjustmentRepository;
import com.stocktrack.backend.repository.SupplierRepository;
import com.stocktrack.backend.service.ProductService;
import com.stocktrack.backend.service.StockAdjustmentService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.DuplicateFormatFlagsException;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private StockAdjustmentService stockAdjustmentService;
    @Autowired
    private SupplierRepository supplierRepository;
    @Autowired
    private StockAdjustmentRepository stockAdjustmentRepository;

    @Override
    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAll(pageable);
    }

    @Override
    public boolean existsById(Long id) {
        return productRepository.existsById(id);
    }

    @Override
    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    @Override
    public Product createProduct(ProductDTO productDTO) {
        Product product = new Product();

        if (productRepository.findByBarcode(productDTO.getBarcode()) != null || productRepository.findBySku(productDTO.getSku()) != null) {
            throw new DuplicateFormatFlagsException(
                    "The product with '" + productDTO.getBarcode() +
                            "' barcode and '" + productDTO.getSku() +
                            "' SKU already exists!");
        }

        Supplier supplier = supplierRepository.findById(productDTO.getSupplierId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Supplier not found with id: " + productDTO.getSupplierId())
                );

        updateProductFromDTO(product, productDTO);

        product.setSupplier(supplier);

        return productRepository.save(product);
    }

    @Override
    @Transactional
    public Product updateProduct(Long id, ProductDTO productDTO) {

        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));

        String originalSku = existingProduct.getSku();
        String originalBarcode = existingProduct.getBarcode();
        MeasurementUnit originalUnitOfMeasure = existingProduct.getUnitOfMeasure();

        existingProduct.setName(productDTO.getName());
        existingProduct.setCurrentStock(productDTO.getCurrentStock());
        existingProduct.setReorderThreshold(productDTO.getReorderThreshold());
        existingProduct.setPrice(productDTO.getPrice());
        existingProduct.setDescription(productDTO.getDescription());
        existingProduct.setIsActive(productDTO.getIsActive());

        if (productDTO.getSku() != null && !productDTO.getSku().equals(originalSku)) {
            Product existingBySku = productRepository.findBySku(productDTO.getSku());
            if (existingBySku != null && !existingBySku.getId().equals(id)) {
                throw new IllegalArgumentException("Product with SKU '" + productDTO.getSku() + "' already exists");
            }
            existingProduct.setSku(productDTO.getSku());
        }

        if (productDTO.getBarcode() != null && !productDTO.getBarcode().equals(originalBarcode)) {
            Product existingByBarcode = productRepository.findByBarcode(productDTO.getBarcode());
            if (existingByBarcode != null && !existingByBarcode.getId().equals(id)) {
                throw new IllegalArgumentException("Product with barcode '" + productDTO.getBarcode() + "' already exists");
            }
            existingProduct.setBarcode(productDTO.getBarcode());
        }

        if (productDTO.getUnitOfMeasure() != null &&
                !productDTO.getUnitOfMeasure().equals(
                        originalUnitOfMeasure != null
                                ? originalUnitOfMeasure.getSymbol()
                                : null
                )) {
            if (productDTO.getUnitOfMeasure() != null) {
                existingProduct.setUnitOfMeasure(
                        MeasurementUnit.fromSymbol(productDTO.getUnitOfMeasure())
                );
            }
        }

        existingProduct.setCategory(productDTO.getCategory());

        return existingProduct;
    }

    @Override
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    @Override
    public List<Product> searchProducts(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }

    @Override
    public List<Product> getLowStockProducts() {

        return productRepository.findAll()
                .stream()
                .filter(p -> {
                    Double avg = p.getAvgDailySales90d();

                    if (avg == null || avg <= 0) return false;

                    double coverageDays = p.getCurrentStock() / avg;

                    return coverageDays <= 7;
                })
                .toList();
    }

    @Override
    public List<Product> getOutOfStockProducts() {
        return productRepository.findOutOfStockProducts();
    }

    @Override
    public List<Product> getCriticalStockProducts() {
        return productRepository.findByCurrentStockLessThanEqual(1);
    }

    @Override
    @Transactional
    public Product updateStock(Long productId, Integer newStock, String reason, String adjustedBy) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new ProductNotFoundException(
                                "Product not found with id: " + productId
                        )
                );

        Integer oldStock = product.getCurrentStock();

        if (newStock < 0) {
            throw new IllegalArgumentException(
                    "Stock cannot be negative"
            );
        }

        product.setCurrentStock(newStock);

        Integer adjustmentQuantity = Math.abs(newStock - oldStock);

        StockAdjustmentType adjustmentType =
                newStock >= oldStock
                        ? StockAdjustmentType.INCREMENT
                        : StockAdjustmentType.DECREMENT;

        StockAdjustment adjustment = new StockAdjustment();

        adjustment.setProduct(product);

        adjustment.setAdjustmentType(StockAdjustmentType.MANUAL);

        adjustment.setAdjustmentQuantity(adjustmentQuantity);

        adjustment.setPreviousStock(oldStock);
        adjustment.setNewStock(newStock);

        adjustment.setReason(reason);
        adjustment.setAdjustedBy(adjustedBy);

        adjustment.setAdjustedAt(LocalDateTime.now());

        adjustment.setNotes(
                "Manual stock update from "
                        + oldStock
                        + " to "
                        + newStock
        );

        productRepository.save(product);

        stockAdjustmentRepository.save(adjustment);

        return product;
    }

    @Override
    @Transactional
    public Product adjustStock(Long productId, Integer adjustment, String reason, String adjustedBy) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new ProductNotFoundException(
                                "Product not found with id: " + productId
                        )
                );

        Integer oldStock = product.getCurrentStock();

        Integer newStock = oldStock + adjustment;

        if (newStock < 0) {
            throw new IllegalArgumentException(
                    "Stock cannot be negative!"
            );
        }

        product.setCurrentStock(newStock);

        StockAdjustmentType type =
                adjustment > 0
                        ? StockAdjustmentType.INCREMENT
                        : StockAdjustmentType.DECREMENT;

        StockAdjustment stockAdjustment = new StockAdjustment();

        stockAdjustment.setProduct(product);

        stockAdjustment.setAdjustmentType(type);

        stockAdjustment.setAdjustmentQuantity(Math.abs(adjustment));

        stockAdjustment.setPreviousStock(oldStock);
        stockAdjustment.setNewStock(newStock);

        stockAdjustment.setReason(reason);

        stockAdjustment.setAdjustedBy(adjustedBy);

        stockAdjustment.setAdjustedAt(LocalDateTime.now());

        stockAdjustment.setNotes(
                "Stock adjusted from "
                        + oldStock
                        + " to "
                        + newStock
        );

        productRepository.save(product);

        stockAdjustmentRepository.save(stockAdjustment);

        return product;
    }

    private void updateProductFromDTO(Product product, ProductDTO dto) {
        product.setName(dto.getName());
        product.setCurrentStock(dto.getCurrentStock());
        product.setReorderThreshold(dto.getReorderThreshold());
        product.setSku(dto.getSku());
        product.setBarcode(dto.getBarcode());
        product.setCategory(dto.getCategory());
        product.setPrice(dto.getPrice());
        product.setDescription(dto.getDescription());
        product.setUnitOfMeasure(MeasurementUnit.valueOf(dto.getUnitOfMeasure()));
        product.setIsActive(dto.getIsActive());
    }
}
