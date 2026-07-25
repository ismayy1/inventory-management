package com.stocktrack.backend.controller;

import com.stocktrack.backend.audit.enums.AuditAction;
import com.stocktrack.backend.audit.service.AuditLogService;
import com.stocktrack.backend.dto.ProductDTO;
import com.stocktrack.backend.exception.ProductDuplicateException;
import com.stocktrack.backend.exception.ProductNotFoundException;
import com.stocktrack.backend.exception.ResourceNotFoundException;
import com.stocktrack.backend.mapper.ProductMapper;
import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.model.Supplier;
import com.stocktrack.backend.repository.ProductRepository;
import com.stocktrack.backend.repository.SupplierRepository;
import com.stocktrack.backend.security.services.UserDetailsImpl;
import com.stocktrack.backend.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8080"})
public class ProductController {

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private AuditLogService auditLogService;
    @Autowired
    private ProductService productService;
    @Autowired
    private SupplierRepository supplierRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(ProductMapper::toDTO)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Product not found with id: " + id));
        return ResponseEntity.ok(ProductMapper.toDTO(product));
    }

    @PostMapping("/{supplierId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ProductDTO> createProduct(
            @PathVariable Long supplierId,
            @Valid @RequestBody ProductDTO productDTO,
            HttpServletRequest request) {

        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));

        Product product = new Product();

        ProductMapper.updateEntity(product, productDTO);

        product.setSupplier(supplier);

        Product savedProduct = productRepository.save(product);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();

            auditLogService.logAction(
                    AuditAction.PRODUCT_CREATED,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    "Created product: " + savedProduct.getName()
                            + " (ID: " + savedProduct.getId() + ")",
                    request
            );
        }

        return ResponseEntity.ok(ProductMapper.toDTO(savedProduct));
    }


    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductDTO productDTO) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ProductNotFoundException(
                                "Product with ID " + id + " doesn't exist!"
                        ));

        ProductMapper.updateEntity(product, productDTO);

        if (productDTO.getSupplierId() != null) {
            Supplier supplier = supplierRepository.findById(productDTO.getSupplierId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Supplier not found"));

            product.setSupplier(supplier);
        }

        Product updatedProduct = productRepository.save(product);

        return ResponseEntity.ok(ProductMapper.toDTO(updatedProduct));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        if (productRepository.existsById(id)) {
            productRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public List<Product> getLowStockProducts() {
        return productRepository.findLowStockProducts();
    }

    @GetMapping("/out-of-stock")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public List<Product> getOutOfStockProducts() {
        return productRepository.findOutOfStockProducts();
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT', 'WAREHOUSE_STAFF', 'INVENTORY_ANALYST')")
    public List<Product> searchProducts(@RequestParam String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }
}
