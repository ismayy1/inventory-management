# Recent Adjustments Table Addition

## Summary
Added a "Recent Adjustments" table to the dashboard page, positioned right below the "Recent Transactions" table in the left column. The table displays stock adjustments from the last 7 days.

## Changes Made

### 1. Added Recent Adjustments Data Logic
```typescript
const recentAdjustments = useMemo(() => {
    if (!allStockAdjustments || !Array.isArray(allStockAdjustments)) return []
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return allStockAdjustments
        .filter(adj => {
            const adjustedAt = adj.adjustedAt || adj.createdAt
            return adjustedAt && new Date(adjustedAt) >= sevenDaysAgo
        })
        .sort((a, b) => {
            const dateA = new Date(a.adjustedAt || a.createdAt || 0).getTime()
            const dateB = new Date(b.adjustedAt || b.createdAt || 0).getTime()
            return dateB - dateA
        })
        .slice(0, 5)
}, [allStockAdjustments])
```

**Logic:**
- Filters adjustments from the last 7 days
- Uses `adjustedAt` or falls back to `createdAt` for date filtering
- Sorts by date (most recent first)
- Shows top 5 most recent adjustments

### 2. Added Adjustment Table Columns
```typescript
const adjustmentColumns = [
    { key: "productName", label: "Product" },
    {
        key: "adjustmentType",
        label: "Type",
        render: (item: StockAdjustment) => (
            <Badge variant={item.adjustmentType === "INCREMENT" ? "default" : "destructive"}>
                {item.adjustmentType === "INCREMENT" ? "Increase" : "Decrease"}
            </Badge>
        ),
    },
    { 
        key: "adjustmentQuantity", 
        label: "Quantity",
        render: (item: StockAdjustment) => {
            const qty = item.adjustmentQuantity ?? 0
            const sign = item.adjustmentType === "INCREMENT" ? "+" : "-"
            return `${sign}${Math.abs(qty)}`
        }
    },
    { 
        key: "reason", 
        label: "Reason",
        render: (item: StockAdjustment) => (
            <span className="text-sm text-muted-foreground truncate max-w-[150px] inline-block" title={item.reason}>
                {item.reason || "N/A"}
            </span>
        )
    },
    { 
        key: "adjustedAt", 
        label: "Date", 
        render: (item: StockAdjustment) => {
            const date = item.adjustedAt || item.createdAt
            return date ? new Date(date).toLocaleDateString() : "N/A"
        }
    },
]
```

**Columns:**
1. **Product Name** - Name of the adjusted product
2. **Type** - Badge showing "Increase" (default) or "Decrease" (destructive)
3. **Quantity** - Shows adjustment with +/- sign (e.g., "+10" or "-5")
4. **Reason** - Truncated reason text with tooltip on hover
5. **Date** - Formatted date of adjustment

### 3. Updated Layout Structure
Reorganized the left column to stack both tables:

```typescript
<div className="space-y-6">
    <Card>Recent Transactions</Card>
    <Card>Recent Adjustments (NEW)</Card>
</div>
```

## Dashboard Layout Structure

```
Dashboard
├── Stat Cards (6 columns)
│   ├── Total Products
│   ├── Inventory Value
│   ├── In Stock Items
│   ├── Low Stock Items
│   ├── OverStock Items
│   └── Active Suppliers
│
└── Content Grid (2 columns)
    ├── Left Column (stacked)
    │   ├── Recent Transactions
    │   └── Recent Adjustments (NEW)
    │
    └── Right Column (stacked)
        ├── In Stock Items
        ├── Low Stock Items
        └── OverStock Items
```

## Visual Features

### Color Coding
- **Increase/INCREMENT**: Default badge (blue/primary)
- **Decrease/DECREMENT**: Destructive badge (red)

### Icons
- **Recent Adjustments**: TrendingUp icon (purple - `text-purple-500`)

### Data Display
- **Quantity Format**: Shows with sign prefix
  - Increase: "+10"
  - Decrease: "-5"
- **Reason**: Truncated to 150px width with full text on hover
- **Date**: Localized date format (e.g., "1/15/2024")

### Empty State
- Message: "No adjustments in the last 7 days"

## Data Source

Uses the existing `allStockAdjustments` data fetched via:
```typescript
const { data: allStockAdjustments } = useSWR("stock-adjustments", stockAdjustmentApi.getAll)
```

## Key Features

1. **Time-based Filtering**: Only shows adjustments from the last 7 days
2. **Sorted by Recency**: Most recent adjustments appear first
3. **Limited Display**: Shows top 5 adjustments
4. **Fallback Handling**: Uses `adjustedAt` or `createdAt` for date
5. **Visual Indicators**: Color-coded badges for increase/decrease
6. **Responsive Layout**: Stacks properly on mobile devices

## Files Modified

- `src/pages/dashboard/index.tsx`

## Testing Checklist

- [ ] Recent Adjustments table displays below Recent Transactions
- [ ] Table shows adjustments from the last 7 days only
- [ ] Adjustments are sorted by date (most recent first)
- [ ] Maximum of 5 adjustments are displayed
- [ ] INCREMENT adjustments show with default badge and "+" sign
- [ ] DECREMENT adjustments show with destructive badge and "-" sign
- [ ] Product names display correctly
- [ ] Reason text truncates with tooltip on hover
- [ ] Date displays in localized format
- [ ] Empty state message appears when no recent adjustments
- [ ] Layout is responsive on different screen sizes
- [ ] Both left column tables (Transactions and Adjustments) are visible

## Integration Notes

- Uses existing `StockAdjustment` type from `@/lib/api`
- Leverages existing SWR data fetching
- Consistent styling with other dashboard cards
- No additional API calls required
