package com.stocktrack.backend.mapper;

import com.stocktrack.backend.dto.ProductDTO;
import com.stocktrack.backend.model.Product;
import com.stocktrack.backend.enums.MeasurementUnit;

public class ProductMapper {

    public static ProductDTO toDTO(Product product) {
        if (product == null) return null;

        ProductDTO dto = new ProductDTO();

        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setCurrentStock(product.getCurrentStock());
        dto.setReorderThreshold(product.getReorderThreshold());
        dto.setSku(product.getSku());
        dto.setBarcode(product.getBarcode());
        dto.setCategory(product.getCategory());

        dto.setPrice(product.getUnitPrice());

        dto.setDescription(product.getDescription());
        dto.setUnitOfMeasure(
                product.getUnitOfMeasure() != null
                        ? product.getUnitOfMeasure().getSymbol()
                        : null
        );
        dto.setIsActive(product.getIsActive());

        if (product.getSupplier() != null) {
            dto.setSupplierId(product.getSupplier().getId());
        }

        dto.setStockStatus(product.getStockStatus());

        dto.setExpiryDate(product.getExpiryDate());

        return dto;
    }

    public static void updateEntity(Product product, ProductDTO dto) {
        if (product == null || dto == null) return;

        product.setName(dto.getName());
        product.setCurrentStock(dto.getCurrentStock());
        product.setReorderThreshold(dto.getReorderThreshold());
        product.setSku(dto.getSku());
        product.setBarcode(dto.getBarcode());
        product.setCategory(dto.getCategory());

        product.setUnitPrice(dto.getPrice());

        product.setDescription(dto.getDescription());
        if (dto.getUnitOfMeasure() != null) {
            product.setUnitOfMeasure(
                    MeasurementUnit.fromSymbol(
                            dto.getUnitOfMeasure()
                    )
            );
        }
        if (dto.getExpiryDate() != null) {
            product.setExpiryDate(dto.getExpiryDate());
        }
        product.setIsActive(dto.getIsActive());
    }
}