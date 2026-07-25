package com.stocktrack.backend.mapper;

import com.stocktrack.backend.enums.MeasurementUnit;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class MeasurementUnitConverter
        implements AttributeConverter<MeasurementUnit, String> {

    @Override
    public String convertToDatabaseColumn(
            MeasurementUnit measurementUnit) {

        if (measurementUnit == null) {
            return null;
        }

        return measurementUnit.getSymbol();
    }

    @Override
    public MeasurementUnit convertToEntityAttribute(
            String dbData) {

        if (dbData == null) {
            return null;
        }

        for (MeasurementUnit unit : MeasurementUnit.values()) {
            if (unit.getSymbol().equalsIgnoreCase(dbData)) {
                return unit;
            }
        }

        throw new IllegalArgumentException(
                "Unknown measurement unit: " + dbData
        );
    }
}