import { useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { DataTable } from "@/components/dashboard/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
import { productApi, transactionApi, supplierApi, stockAdjustmentApi, dashboardApi, type Product, type Transaction, type StockAdjustment, type OverstockItem, type InventoryClassifiedItem } from "@/lib/api"
import { Package, AlertTriangle, Users, TrendingUp, Box, PieChart as PieChartIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsApi } from "@/lib/api"

const transactionTypeLabels: Record<string, string> = {
    PURCHASE: "Purchase",
    SALE: "Sale",
    RETURN: "Return",
    ADJUSTMENT: "Adjustment",
    TRANSFER: "Transfer",
    DAMAGED: "Damaged",
    EXPIRED: "Expired",
}

const TransactionBadge = ({ type }: { type?: string }) => {
    const typeUpper = (type ?? "UNKNOWN").toString().toUpperCase()
    const displayLabel = transactionTypeLabels[typeUpper] || typeUpper

    let variant: "default" | "secondary" | "destructive" | "outline" = "default"

    switch (typeUpper) {
        case "PURCHASE":
            variant = "default"
            break
        case "SALE":
            variant = "secondary"
            break
        case "RETURN":
        case "DAMAGED":
        case "EXPIRED":
            variant = "destructive"
            break
        case "ADJUSTMENT":
        case "TRANSFER":
            variant = "outline"
            break
        default:
            variant = "default"
    }

    return <Badge variant={variant}>{displayLabel}</Badge>
}

// function _formatCategory(name: string) {
//     return name
//         .toLowerCase()
//         .replace(/_/g, " ")
//         .replace(/\b\w/g, (c) => c.toUpperCase())
// }

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658']

export default function DashboardPage() {
    const swrOptions = { refreshInterval: 30000, revalidateOnFocus: true }

    const { data: products, mutate: mutateProducts } = useSWR("products", productApi.getAll, swrOptions)
    const { data: activeSuppliers } = useSWR("active-suppliers", supplierApi.getActive, swrOptions)

    const { data: allTransactions } = useSWR("transactions", transactionApi.getAll, swrOptions)

    const { data } = useSWR("product-categories", analyticsApi.getProductCategories)

    const { data: allStockAdjustments } = useSWR("stock-adjustments", stockAdjustmentApi.getAll, swrOptions)
    const { data: overstockItems, isLoading: overstockLoading, error: overstockError, mutate: mutateOverstock } = useSWR(
        "dashboard-overstock",
        dashboardApi.getOverstockItems,
        swrOptions
    )
    const { data: inStockItems, isLoading: inStockLoading, error: inStockError, mutate: mutateInStock } = useSWR(
        "dashboard-in-stock",
        dashboardApi.getInStockItems,
        swrOptions
    )
    const { data: lowStockItems, isLoading: lowStockLoading, error: lowStockError, mutate: mutateLowStock } = useSWR(
        "dashboard-low-stock",
        dashboardApi.getLowStockItems,
        swrOptions
    )

    // Revalidate all stock classification data whenever transactions or adjustments change
    const prevTransactionCountRef = useRef<number | null>(null)
    const prevAdjustmentCountRef = useRef<number | null>(null)

    useEffect(() => {
        const currentCount = allTransactions?.length ?? null
        if (prevTransactionCountRef.current !== null && currentCount !== prevTransactionCountRef.current) {
            mutateProducts()
            mutateInStock()
            mutateLowStock()
            mutateOverstock()
        }
        prevTransactionCountRef.current = currentCount
    }, [allTransactions?.length])

    useEffect(() => {
        const currentCount = allStockAdjustments?.length ?? null
        if (prevAdjustmentCountRef.current !== null && currentCount !== prevAdjustmentCountRef.current) {
            mutateProducts()
            mutateInStock()
            mutateLowStock()
            mutateOverstock()
        }
        prevAdjustmentCountRef.current = currentCount
    }, [allStockAdjustments?.length])

    const recentTransactions = useMemo(() => {
        if (!allTransactions) return []
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return allTransactions
            .filter(t => new Date(t.createdAt) >= sevenDaysAgo)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [allTransactions])

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
    }, [allStockAdjustments, products])

    // const productCategoriesData = useMemo(() => {
    //     if (!products) return []
    //     const categoryCount: Record<string, number> = {}
    //     products.forEach((product: Product) => {
    //         const category = product.category || 'Uncategorized'
    //         categoryCount[category] = (categoryCount[category] || 0) + 1
    //     })
    //     return Object.entries(categoryCount).map(([category, count], index) => ({
    //         name: category,
    //         value: count,
    //         fill: COLORS[index % COLORS.length]
    //     }))
    // }, [products])

    type CategoryChartItem = {
        name: string
        value: number
    }

    const productCategoriesData: CategoryChartItem[] = data ?? []

    const productStockStatusData = useMemo(() => {
        if (!products) return []

        let inStock = 0
        let lowStock = 0
        let overStock = 0

        products.forEach((product: Product) => {
            switch (product.stockStatus) {
                case "IN_STOCK":
                    inStock++
                    break
                case "LOW_STOCK":
                    lowStock++
                    break
                case "OVER_STOCK":
                    overStock++
                    break
            }
        })

        return [
            { name: "In Stock", value: inStock, fill: "#00C49F" },
            { name: "Low Stock", value: lowStock, fill: "#FFBB28" },
            { name: "Overstock", value: overStock, fill: "#8884d8" }
        ]
    }, [products])

    // const supplierOverviewData = useMemo(() => {
    //     if (!activeSuppliers) return []
    //     const productCountBySupplier = new Map<number, number>()
    //     products?.forEach((product: Product) => {
    //         productCountBySupplier.set(
    //             product.supplierId,
    //             (productCountBySupplier.get(product.supplierId) || 0) + 1,
    //         )
    //     })

    //     return activeSuppliers
    //         .map((supplier: Supplier) => {
    //             const productCount = productCountBySupplier.get(supplier.id) ?? 0
    //             const ageDays = Math.max(
    //                 0,
    //                 Math.floor((Date.now() - new Date(supplier.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    //             )
    //             const fill = ageDays > 365 ? '#0088FE' : ageDays > 180 ? '#00C49F' : '#FFBB28'
    //             return {
    //                 name: supplier.name,
    //                 products: productCount,
    //                 tenureDays: ageDays,
    //                 fill,
    //             }
    //         })
    //         .sort((a: { tenureDays: number }, b: { tenureDays: number }) => b.tenureDays - a.tenureDays)
    // }, [activeSuppliers, products])

    const adjustmentTypeData = useMemo(() => {
        if (!allStockAdjustments || !Array.isArray(allStockAdjustments)) return []
        let incrementCount = 0
        let decrementCount = 0
        allStockAdjustments.forEach((adj: StockAdjustment) => {
            if (adj.adjustmentType === 'INCREMENT') {
                incrementCount++
            } else if (adj.adjustmentType === 'DECREMENT') {
                decrementCount++
            }
        })
        return [
            { name: 'Increase', value: incrementCount, fill: '#82ca9d' },
            { name: 'Decrease', value: decrementCount, fill: '#ff7c7c' }
        ]
    }, [allStockAdjustments])

    const totalProducts = products?.length || 0
    const totalSuppliers = activeSuppliers?.length || 0

    // Use backend-classified counts — fall back to 0 while loading
    const lowStockCount = lowStockItems?.length ?? 0
    const overStockCount = overstockItems?.length ?? 0
    const inStockCount = inStockItems?.length ?? 0
    const totalValue = useMemo(() => {
        if (!products) return 0
        return products.reduce((acc: number, p: Product) => {
            const price = p.price || 0
            const currentStock = p.currentStock || 0
            return acc + (price * currentStock)
        }, 0)
    }, [products])

    const transactionColumns = [
        { key: "productName", label: "Product" },
        {
            key: "type",
            label: "Type",
            render: (item: Transaction) => {
                const transactionType = item.type ?? (item as any).transactionType ?? "UNKNOWN"
                return <TransactionBadge type={transactionType} />
            },
        },
        {
            key: "quantity",
            label: "Quantity",
            width: "80px"
        },
        {
            key: "totalPrice",
            label: "Total",
            render: (item: Transaction) => {
                // Try to get totalPrice from different possible field names
                let total = item.totalPrice ?? (item as any).total_price ?? (item as any).totalAmount

                // If totalPrice is not available or is 0, calculate it from quantity * unitPrice
                if (total == null || total === 0) {
                    const quantity = item.quantity ?? 0
                    const unitPrice = item.unitPrice ?? (item as any).unit_price ?? 0
                    total = quantity * unitPrice
                }

                return `$${Number(total).toFixed(2)}`
            }
        },
        { key: "createdAt", label: "Date", render: (item: Transaction) => new Date(item.createdAt).toLocaleDateString() },
    ]

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

    const inStockColumns = [
        { key: "productName", label: "Product Name" },
        { key: "currentStock", label: "Current Stock" },
        {
            key: "avgDailySales",
            label: "Avg Daily Sales",
            render: (item: InventoryClassifiedItem) =>
                item.avgDailySales != null ? Number(item.avgDailySales).toFixed(2) : "—",
        },
        {
            key: "minLevel",
            label: "Min Level",
            render: (item: InventoryClassifiedItem) =>
                item.minLevel != null ? item.minLevel : "—",
        },
        {
            key: "daysOfSupply",
            label: "Days of Supply",
            render: (item: InventoryClassifiedItem) =>
                item.daysOfSupply != null ? Math.round(Number(item.daysOfSupply)) : "—",
        },
    ]

    const classifiedColumns = [
        { key: "productName", label: "Product Name" },
        { key: "currentStock", label: "Current Stock" },
        {
            key: "reorderThreshold",
            label: "Min Level",
            render: (item: InventoryClassifiedItem) =>
                item.reorderThreshold != null ? item.reorderThreshold : "—",
        },
        {
            key: "avgDailySales",
            label: "Avg Daily Sales",
            render: (item: InventoryClassifiedItem) =>
                item.avgDailySales != null ? Number(item.avgDailySales).toFixed(2) : "—",
        },
        {
            key: "daysOfSupply",
            label: "Days of Supply",
            render: (item: InventoryClassifiedItem) =>
                item.daysOfSupply != null ? Math.round(Number(item.daysOfSupply)) : "—",
        },
    ]

    const overStockColumns = [
        { key: "productName", label: "Product Name" },
        { key: "currentStock", label: "Current Stock" },
        {
            key: "minLevel",
            label: "Min Level",
            render: (item: OverstockItem) =>
                item.minLevel != null ? item.minLevel : "—",
        },
        {
            key: "avgDailySales",
            label: "Avg Daily Sales",
            render: (item: OverstockItem) =>
                item.avgDailySales != null ? Number(item.avgDailySales).toFixed(2) : "—",
        },
        {
            key: "daysOfSupply",
            label: "Days of Supply",
            render: (item: OverstockItem) =>
                item.daysOfSupply != null ? Math.round(Number(item.daysOfSupply)) : "—",
        },
    ]

    const [isLowStockTableHighlighted, setIsLowStockTableHighlighted] = useState(false)
    const [isOverStockTableHighlighted, setIsOverStockTableHighlighted] = useState(false)
    const [isInStockTableHighlighted, setIsInStockTableHighlighted] = useState(false)
    // const [showAllSuppliers, setShowAllSuppliers] = useState(false)
    const highlightTimerRef = useRef<number | null>(null)

    const handleLowStockStatClick = () => {
        setIsLowStockTableHighlighted(true)
        if (highlightTimerRef.current) {
            window.clearTimeout(highlightTimerRef.current)
        }
        highlightTimerRef.current = window.setTimeout(() => {
            setIsLowStockTableHighlighted(false)
            highlightTimerRef.current = null
        }, 1000)
    }

    const handleOverStockStatClick = () => {
        setIsOverStockTableHighlighted(true)
        if (highlightTimerRef.current) {
            window.clearTimeout(highlightTimerRef.current)
        }
        highlightTimerRef.current = window.setTimeout(() => {
            setIsOverStockTableHighlighted(false)
            highlightTimerRef.current = null
        }, 1000)
    }

    const handleInStockStatClick = () => {
        setIsInStockTableHighlighted(true)
        if (highlightTimerRef.current) {
            window.clearTimeout(highlightTimerRef.current)
        }
        highlightTimerRef.current = window.setTimeout(() => {
            setIsInStockTableHighlighted(false)
            highlightTimerRef.current = null
        }, 1000)
    }

    useEffect(() => {
        return () => {
            if (highlightTimerRef.current) {
                window.clearTimeout(highlightTimerRef.current)
            }
        }
    }, [])

    return (
        <div className="flex flex-col">
            <Header title="Dashboard" description="Overview of your inventory" />

            <div className="flex-1 space-y-6 p-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <StatCard
                        title="Total Products"
                        value={totalProducts}
                        icon={Package}
                        description="Active products in inventory"
                    />
                    <StatCard
                        title="Inventory Value"
                        value={`$${totalValue.toLocaleString()}`}
                        icon={TrendingUp}
                        description="Total value of stock"
                    />
                    <StatCard
                        title="In Stock Items"
                        value={inStockCount}
                        icon={Package}
                        description="Products at optimal level"
                        className={inStockCount > 0 ? "border-green-500/50 cursor-pointer" : "cursor-pointer"}
                        onClick={handleInStockStatClick}
                    />
                    <StatCard
                        title="Low Stock Items"
                        value={lowStockCount}
                        icon={AlertTriangle}
                        description="Products below minimum level"
                        className={lowStockCount > 0 ? "border-warning/50 cursor-pointer" : "cursor-pointer"}
                        onClick={handleLowStockStatClick}
                    />
                    <StatCard
                        title="OverStock Items"
                        value={overStockCount}
                        icon={Box}
                        description="Products above optimal level"
                        className={overStockCount > 0 ? "border-blue-500/50 cursor-pointer" : "cursor-pointer"}
                        onClick={handleOverStockStatClick}
                    />
                    <StatCard
                        title="Active Suppliers"
                        value={totalSuppliers}
                        icon={Users}
                        description="Registered suppliers"
                    />
                </div>

                <div className="space-y-6">
                    {/* Section 1 */}
                    <div className="border-2 border-border rounded-xl p-4 bg-muted/10">
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Section 1 Left: In Stock Items */}
                            <Card className={cn("border-border/50 transition-transform duration-150", isInStockTableHighlighted ? "transform scale-105" : "transform scale-100")}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Package className="h-5 w-5 text-green-500" />
                                        In Stock Items
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DataTable
                                        columns={inStockColumns}
                                        data={inStockItems ?? []}
                                        maxRows={10}
                                        emptyMessage={
                                            inStockLoading ? "Loading..." :
                                                inStockError ? "Failed to load data" :
                                                    "No items in optimal stock range"
                                        }
                                    />
                                </CardContent>
                            </Card>

                            {/* Section 1 Right: Low Stock + Over Stock stacked */}
                            <div className="space-y-4">
                                <Card className={cn("border-border/50 transition-transform duration-150", isLowStockTableHighlighted ? "transform scale-105" : "transform scale-100")}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <AlertTriangle className="h-5 w-5 text-warning" />
                                            Low Stock Items
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <DataTable
                                            columns={classifiedColumns}
                                            data={lowStockItems ?? []}
                                            maxRows={10}
                                            emptyMessage={
                                                lowStockLoading ? "Loading..." :
                                                    lowStockError ? "Failed to load data" :
                                                        "All stock levels are healthy"
                                            }
                                        />
                                    </CardContent>
                                </Card>

                                <Card className={cn("border-border/50 transition-transform duration-150", isOverStockTableHighlighted ? "transform scale-105" : "transform scale-100")}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Box className="h-5 w-5 text-blue-500" />
                                            Over Stock Items
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <DataTable
                                            columns={overStockColumns}
                                            data={overstockItems ?? []}
                                            maxRows={10}
                                            emptyMessage={
                                                overstockLoading ? "Loading..." :
                                                    overstockError ? "Failed to load data" :
                                                        "No overstock items"
                                            }
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>

                    {/* Section 2 */}
                    <div className="border-2 border-border rounded-xl p-4 bg-muted/10">
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Section 2 Left: Recent Transactions */}
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Box className="h-5 w-5" />
                                        Recent Transactions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DataTable
                                        columns={transactionColumns}
                                        data={recentTransactions}
                                        maxRows={10}
                                        indexColumnWidth="45px"
                                        emptyMessage="No transactions in the last 7 days"
                                    />
                                </CardContent>
                            </Card>

                            {/* Section 2 Right: Recent Adjustments */}
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <TrendingUp className="h-5 w-5 text-purple-500" />
                                        Recent Adjustments
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <DataTable
                                        columns={adjustmentColumns}
                                        data={recentAdjustments}
                                        maxRows={10}
                                        emptyMessage="No adjustments in the last 7 days"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <PieChartIcon className="h-5 w-5 text-blue-500" />
                                Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="border border-border/50 rounded-2xl p-4">
                                    <h3 className="text-sm font-semibold mb-3">Product Categories</h3>

                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={productCategoriesData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={70}
                                                label
                                            >
                                                {productCategoriesData.map((_, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>

                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    <div className="mt-12 text-xs text-muted-foreground space-y-1">
                                        <div>Each slice represents the product share per category.</div>
                                    </div>
                                </div>

                                <div className="border border-border/50 rounded-2xl p-4">
                                    <h3 className="text-sm font-semibold mb-3">Product Stock Status</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={productStockStatusData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={70}
                                                fill="#8884d8"
                                                label
                                            />
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="mt-3 text-xs text-muted-foreground space-y-1">
                                        <div><span className="inline-flex h-2 w-2 rounded-full bg-[#00C49F] mr-2" />In Stock</div>
                                        <div><span className="inline-flex h-2 w-2 rounded-full bg-[#FFBB28] mr-2" />Low Stock</div>
                                        <div><span className="inline-flex h-2 w-2 rounded-full bg-[#8884d8] mr-2" />Over Stock</div>
                                    </div>
                                </div>

                                {/* Suppliers Overview — hidden, restore when needed
                                <div className="border border-border/50 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold">Suppliers Overview</h3>
                                        {supplierOverviewData.length > 10 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowAllSuppliers(v => !v)}
                                            >
                                                {showAllSuppliers ? (
                                                    <><ChevronUp className="h-3.5 w-3.5" />Show less</>
                                                ) : (
                                                    <><ChevronDown className="h-3.5 w-3.5" />Show all {supplierOverviewData.length}</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                    <ResponsiveContainer
                                        width="100%"
                                        height={showAllSuppliers ? Math.max(250, supplierOverviewData.length * 28) : 250}
                                    >
                                        <BarChart
                                            data={showAllSuppliers ? supplierOverviewData : supplierOverviewData.slice(0, 10)}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={60} />
                                            <YAxis />
                                            <Tooltip formatter={(value: number) => [`${value}`, 'Products']} />
                                            <Bar dataKey="products">
                                                {(showAllSuppliers ? supplierOverviewData : supplierOverviewData.slice(0, 10)).map((entry: { name: string; fill: string }) => (
                                                    <Cell key={`supplier-cell-${entry.name}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    {!showAllSuppliers && supplierOverviewData.length > 10 && (
                                        <p className="text-xs text-muted-foreground text-center mt-2">
                                            Showing 10 of {supplierOverviewData.length} suppliers
                                        </p>
                                    )}
                                    <div className="mt-3 text-xs text-muted-foreground space-y-1">
                                        <div><span className="inline-flex h-2 w-2 rounded-full bg-[#0088FE] mr-2" />Longevity {'>'} 1 year</div>
                                        <div><span className="inline-flex h-2 w-2 rounded-full bg-[#00C49F] mr-2" />Longevity 6-12 months</div>
                                        <div><span className="inline-flex h-2 w-2 rounded-full bg-[#8B6914] mr-2" />Longevity under 6 months</div>
                                    </div>
                                </div>
                                */}
                                <div className="border border-border/50 rounded-2xl p-4">
                                    <h3 className="text-sm font-semibold mb-3">Stock Adjustments</h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={adjustmentTypeData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={70}
                                                fill="#8884d8"
                                                label
                                            />
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="mt-3 text-xs text-muted-foreground space-y-1">
                                        <div><span className="inline-flex h-2 w-2 rounded-full bg-[#82ca9d] mr-2" />Increase</div>
                                        <div><span className="inline-flex h-2 w-2 rounded-full bg-[#ff7c7c] mr-2" />Decrease</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}



