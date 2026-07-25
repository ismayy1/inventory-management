package com.stocktrack.backend.dto;

public class CategoryChartDTO {

    private String name;
    private long value;

    public CategoryChartDTO(String name, long value) {
        this.name = name;
        this.value = value;
    }

    public String getName() { return name; }
    public long getValue() { return value; }

    public void setName(String name) { this.name = name; }
    public void setValue(long value) { this.value = value; }
}
