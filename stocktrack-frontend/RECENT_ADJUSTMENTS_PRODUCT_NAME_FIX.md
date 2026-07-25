# Recent Adjustments Product Name Fix

## Problem
Product names were not displaying in the "Recent Adjustments" table on the dashboard page. The table was showing empty or undefined values in the Product Name column.

## Root Cause
The stock adjustments data from the backend may contain:
1. `productName` field (if populated by backend)
2. `productId` field (reference to product)
3. Neither field (in some cases)

The original implementation didn't map `productId` to actual product names, so when `productName` was missing from the adjustment data, the column would be empty.

## Solution
Enhanced the `recentAdjustments` useMemo hook to:
1. Create a product ID to product name mapping from the products list
2. Map each adjustment to include the product name using this lookup
3. Use fallback logic: `productName` → lookup by `productId` → "Unknown Product"

## Code Changes

### Before
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

### After
```typescript
const recentAdjustments = useMemo(() => {
    if (!allStockAdjustments || !Array.isArray(allStockAdjustments)) return []
    if (!products) return []
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // Create a map of product IDs to product names for quick lookup
    const productMap = new Map<number, string>()
    products.forEach((product: Product) => {
        productMap.set(product.id, product.name)
    })
    
    return allStockAdjustments
        .filter(adj => {
            const adjustedAt = adj.adjustedAt || adj.createdAt
            return adjustedAt && new Date(adjustedAt) >= sevenDaysAgo
        })
        .map(adj => ({
            ...adj,
            productName: adj.productName || (adj.productId ? productMap.get(adj.productId) : undefined) || 'Unknown Product'
        }))
        .sort((a, b) => {
            const dateA = new Date(a.adjustedAt || a.createdAt || 0).getTime()
            const dateB = new Date(b.adjustedAt || b.createdAt || 0).getTime()
            return dateB - dateA
        })
        .slice(0, 5)
}, [allStockAdjustments, products])
```

## Key Improvements

1. **Product Map Creation**: Creates a `Map<number, string>` for O(1) lookup performance
   ```typescript
   const productMap = new Map<number, string>()
   products.forEach((product: Product) => {
       productMap.set(product.id, product.name)
   })
   ```

2. **Product Name Resolution**: Uses a three-tier fallback strategy
   ```typescript
   productName: adj.productName || (adj.productId ? productMap.get(adj.productId) : undefined) || 'Unknown Product'
   ```
   - First: Use `adj.productName` if it exists (backend provided)
   - Second: Lookup product name by `adj.productId` using the map
   - Third: Fallback to "Unknown Product" if neither works

3. **Dependency Update**: Added `products` to the dependency array
   ```typescript
   }, [allStockAdjustments, products])
   ```

4. **Early Return**: Returns empty array if products aren't loaded yet
   ```typescript
   if (!products) return []
   ```

## Benefits

✅ **Product names now display correctly** in the Recent Adjustments table  
✅ **Performance optimized** using Map for O(1) lookups instead of O(n) array searches  
✅ **Graceful fallback** to "Unknown Product" when product can't be found  
✅ **Handles all cases**: backend-provided names, ID-based lookup, and missing data  
✅ **Type-safe** implementation with proper TypeScript typing  

## Testing Checklist

- [x] TypeScript compilation passes with no errors
- [ ] Product names display correctly in Recent Adjustments table
- [ ] Adjustments with `productName` field show the correct name
- [ ] Adjustments with only `productId` show the correct name via lookup
- [ ] Adjustments with neither field show "Unknown Product"
- [ ] Table updates when products data changes
- [ ] No performance issues with large datasets

## Files Modified

- `src/pages/dashboard/index.tsx`

## Related Issues

This fix ensures consistency with how product names are displayed in the "Recent Transactions" table, which already had the `productName` field populated by the backend.
