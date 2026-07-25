package com.stocktrack.backend.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFound(ProductNotFoundException e) {
        ErrorResponse error = new ErrorResponse("PRODUCT_NOT_FOUND", e.getMessage(), HttpStatus.NOT_FOUND);
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(StockAdjustmentNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleStockAdjustmentNotFound(StockAdjustmentNotFoundException e) {
        ErrorResponse error = new ErrorResponse("STOCK_ADJUSTMENT_NOT_FOUND", e.getMessage(), HttpStatus.NOT_FOUND);
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(TransactionNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTransactionNotFound(TransactionNotFoundException e) {
        ErrorResponse error = new ErrorResponse("TRANSACTION_NOT_FOUND", e.getMessage());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(SupplierNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleSupplierNotFound(SupplierNotFoundException e) {
        ErrorResponse error = new ErrorResponse("SUPPLIER_NOT_FOUND", e.getMessage());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        String mainMessage = errors.values().stream().findFirst().orElse("Validation failed");

        ValidationErrorResponse response = new ValidationErrorResponse(
                "VALIDATION_ERROR",
                mainMessage,
                errors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response); // 400
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException ex) {

        String errorMessage = String.format(
                "Invalid value '%s' for parameter '%s'. Expected type: %s",
                ex.getValue(),
                ex.getName(),
                ex.getRequiredType().getSimpleName()
        );

        ErrorResponse error = new ErrorResponse(
                "INVALID_PARAMETER",
                errorMessage,
                HttpStatus.BAD_REQUEST
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
            org.springframework.http.converter.HttpMessageNotReadableException ex) {

        String message = "Invalid request format. Please check your JSON payload.";

        // Check if it's an enum deserialization error
        if (ex.getCause() != null && ex.getCause().getClass().getSimpleName().equals("InvalidFormatException")) {
            message = "Invalid enum value provided. Please use valid values: " +
                    getValidEnumValuesFromException(ex.getCause());
        }

        ErrorResponse error = new ErrorResponse(
                "INVALID_REQUEST",
                message,
                HttpStatus.BAD_REQUEST
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // Helper method to extract valid enum values
    private String getValidEnumValuesFromException(Throwable cause) {
        // Simplified version - you can enhance this
        return "INCREMENT, DECREMENT, MANUAL, CORRECTION";
    }
//
//    @ExceptionHandler(Exception.class)
//    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
//        // Unwrap the exception to find the root cause
//        Throwable rootCause = ex;
//        while (rootCause.getCause() != null) {
//            rootCause = rootCause.getCause();
//        }
//
//        String message = rootCause.getMessage() != null ? rootCause.getMessage() : ex.getMessage();
//
//        if (message != null && message.contains("duplicate key value violates unique constraint")) {
//            if (message.contains("barcode")) {
//                ErrorResponse error = new ErrorResponse(
//                        "DUPLICATE_BARCODE",
//                        "Product with this barcode already exists"
//                );
//                return new ResponseEntity<>(error, HttpStatus.CONFLICT);
//            }
//            if (message.contains("sku")) {
//                ErrorResponse error = new ErrorResponse(
//                        "DUPLICATE_SKU",
//                        "Product with this SKU already exists"
//                );
//                return new ResponseEntity<>(error, HttpStatus.CONFLICT);
//            }
//        }
//
//        ErrorResponse error = new ErrorResponse(
//                "INTERNAL_ERROR",
//                "An unexpected error occurred"
//        );
//        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
//    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {

        // Log the REAL exception to the console
        ex.printStackTrace();   // <— ADD THIS (TEMPORARY)

        // Unwrap the exception to find the root cause
        Throwable rootCause = ex;
        while (rootCause.getCause() != null) {
            rootCause = rootCause.getCause();
        }

        String message = rootCause.getMessage() != null ? rootCause.getMessage() : ex.getMessage();

        if (message != null && message.contains("duplicate key value violates unique constraint")) {
            if (message.contains("barcode")) {
                return new ResponseEntity<>(
                        new ErrorResponse("DUPLICATE_BARCODE", "Product with this barcode already exists"),
                        HttpStatus.CONFLICT
                );
            }
            if (message.contains("sku")) {
                return new ResponseEntity<>(
                        new ErrorResponse("DUPLICATE_SKU", "Product with this SKU already exists"),
                        HttpStatus.CONFLICT
                );
            }
        }

        return new ResponseEntity<>(
                new ErrorResponse("INTERNAL_ERROR", message),  // <— Return real message TEMPORARILY
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }


    @ExceptionHandler(ProductDuplicateException.class)
    public ResponseEntity<ErrorResponse> handleProductDuplicate(ProductDuplicateException ex) {
        ErrorResponse error = new ErrorResponse("DUPLICATE_PRODUCT", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT); // 409
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        Throwable root = ex.getMostSpecificCause();   // ← IMPORTANT FIX
        String message = root != null ? root.getMessage() : ex.getMessage();

        if (message.contains("UK_PRODUCT_SKU") || message.contains("sku")) {
            ErrorResponse error = new ErrorResponse("DUPLICATE_SKU", "Product with this SKU already exists");
            return new ResponseEntity<>(error, HttpStatus.CONFLICT);
        }

        if (message.contains("UK_PRODUCT_BARCODE") || message.contains("barcode")) {
            ErrorResponse error = new ErrorResponse("DUPLICATE_BARCODE", "Product with this barcode already exists");
            return new ResponseEntity<>(error, HttpStatus.CONFLICT);
        }

        ErrorResponse error = new ErrorResponse("DATA_INTEGRITY_VIOLATION", "A data integrity violation occurred");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }


    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        ErrorResponse error = new ErrorResponse(
                "VALIDATION_ERROR",
                "Database constraint violation: " + ex.getMessage()
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(DuplicateSupplierException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateSupplier(DuplicateSupplierException ex) {
        ErrorResponse error = new ErrorResponse(
                "DUPLICATE_SUPPLIER",
                "A supplier with this " + ex.getField() + " already exists: " + ex.getValue(),
                HttpStatus.CONFLICT
        );
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }
}
