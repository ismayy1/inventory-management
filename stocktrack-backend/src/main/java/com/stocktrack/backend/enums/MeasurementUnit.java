package com.stocktrack.backend.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

@Getter
public enum MeasurementUnit {
    // Length units
    MILLIMETER("mm", "Millimeter", UnitType.LENGTH),
    CENTIMETER("cm", "Centimeter", UnitType.LENGTH),
    METER("m", "Meter", UnitType.LENGTH),
    INCH("in", "Inch", UnitType.LENGTH),
    FOOT("ft", "Foot", UnitType.LENGTH),

    // Weight units
    GRAM("g", "Gram", UnitType.WEIGHT),
    KILOGRAM("kg", "Kilogram", UnitType.WEIGHT),
    OUNCE("oz", "Ounce", UnitType.WEIGHT),
    POUND("lb", "Pound", UnitType.WEIGHT),

    // Volume units
    MILLILITER("ml", "Milliliter", UnitType.VOLUME),
    LITER("L", "Liter", UnitType.VOLUME),
    GALLON("gal", "Gallon", UnitType.VOLUME),
    FLUID_OUNCE("fl oz", "Fluid Ounce", UnitType.VOLUME);

    private final String symbol;
    private final String displayName;
    private final UnitType type;

    MeasurementUnit(String symbol, String displayName, UnitType type) {
        this.symbol = symbol;
        this.displayName = displayName;
        this.type = type;
    }


    // Used when SERIALIZING to JSON
    @JsonValue
    public String getJsonValue() {
        return symbol;
    }

    // Used when DESERIALIZING from JSON
    @JsonCreator
    public static MeasurementUnit fromValue(String value) {

        for (MeasurementUnit unit : MeasurementUnit.values()) {

            if (unit.symbol.equalsIgnoreCase(value)) {
                return unit;
            }

            if (unit.name().equalsIgnoreCase(value)) {
                return unit;
            }

            if (unit.displayName.equalsIgnoreCase(value)) {
                return unit;
            }
        }

        throw new IllegalArgumentException(
                "Invalid MeasurementUnit value: " + value
        );
    }

    public boolean isLength() {
        return type == UnitType.LENGTH;
    }

    public boolean isWeight() {
        return type == UnitType.WEIGHT;
    }

    public boolean isVolume() {
        return type == UnitType.VOLUME;
    }

    @Override
    public String toString() {
        return displayName + " (" + symbol + ")";
    }

    public double convertTo(double value, MeasurementUnit targetUnit) {
        if (this.type != targetUnit.type) {
            throw new IllegalArgumentException("Cannot convert between different unit types");
        }

        double valueInBase = convertToBase(value);
        return convertFromBase(valueInBase, targetUnit);
    }

    private double convertToBase(double value) {
        switch (this) {
            case MILLIMETER: return value;
            case CENTIMETER: return value * 10;
            case METER: return value * 1000;
            case INCH: return value * 25.4;
            case FOOT: return value * 304.8;

            case GRAM: return value;
            case KILOGRAM: return value * 1000;
            case OUNCE: return value * 28.3495;
            case POUND: return value * 453.592;

            case MILLILITER: return value;
            case LITER: return value * 1000;
            case GALLON: return value * 3785.41;
            case FLUID_OUNCE: return value * 29.5735;

            default: return value;
        }
    }

    private double convertFromBase(double valueInBase, MeasurementUnit targetUnit) {
        switch (targetUnit) {
            case MILLIMETER: return valueInBase;
            case CENTIMETER: return valueInBase / 10;
            case METER: return valueInBase / 1000;
            case INCH: return valueInBase / 25.4;
            case FOOT: return valueInBase / 304.8;

            case GRAM: return valueInBase;
            case KILOGRAM: return valueInBase / 1000;
            case OUNCE: return valueInBase / 28.3495;
            case POUND: return valueInBase / 453.592;

            case MILLILITER: return valueInBase;
            case LITER: return valueInBase / 1000;
            case GALLON: return valueInBase / 3785.41;
            case FLUID_OUNCE: return valueInBase / 29.5735;

            default: return valueInBase;
        }
    }

    @Getter
    public enum UnitType {
        LENGTH("Length/Distance"),
        WEIGHT("Weight/Mass"),
        VOLUME("Volume/Capacity");

        private final String description;

        UnitType(String description) {
            this.description = description;
        }
    }

    public static MeasurementUnit fromSymbol(String symbol) {

        for (MeasurementUnit unit : values()) {

            if (unit.symbol.equalsIgnoreCase(symbol)) {
                return unit;
            }
        }

        throw new IllegalArgumentException(
                "Invalid measurement unit: " + symbol
        );
    }
}