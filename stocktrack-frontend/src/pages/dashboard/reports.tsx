import { useState, useMemo, useEffect, useRef } from "react"
import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { transactionApi, productApi, supplierApi, type Transaction, type Product, type Supplier } from "@/lib/api"
import { BarChart2, ListFilter, X, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

type ReportType = "MONTHLY_SALES" | "STOCK_MOVEMENT" | "DEAD_STOCK" | "SUPPLIER_PERFORMANCE"

const reportOptions = [
    { value: "MONTHLY_SALES", label: "Monthly Sales" },
    { value: "STOCK_MOVEMENT", label: "Stock Movement" },
    { value: "DEAD_STOCK", label: "Dead Stock" },
    { value: "SUPPLIER_PERFORMANCE", label: "Supplier Performance" },
]

// ── Column definition ─────────────────────────────────────────────────────────
interface ColDef<T> {
    key: string
    label: string
    render?: (item: T) => React.ReactNode
}

type SortDir = "asc" | "desc" | null

// ── FilterableTable ───────────────────────────────────────────────────────────
function FilterableTable<T extends Record<string, any>>({
    columns,
    data,
    emptyMessage = "No data",
}: {
    columns: ColDef<T>[]
    data: T[]
    emptyMessage?: string
}) {
    const [activeFilter, setActiveFilter] = useState<string | null>(null)
    const [filters, setFilters] = useState<Record<string, string>>({})
    const [sortKey, setSortKey] = useState<string | null>(null)
    const [sortDir, setSortDir] = useState<SortDir>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (activeFilter) setTimeout(() => inputRef.current?.focus(), 50)
    }, [activeFilter])

    const handleSort = (key: string) => {
        if (sortKey !== key) {
            setSortKey(key)
            setSortDir("asc")
        } else if (sortDir === "asc") {
            setSortDir("desc")
        } else if (sortDir === "desc") {
            setSortKey(null)
            setSortDir(null)
        }
    }

    const processedData = useMemo(() => {
        let result = data.filter(row =>
            Object.entries(filters).every(([key, val]) => {
                if (!val) return true
                return String(row[key] ?? "").toLowerCase().includes(val.toLowerCase())
            })
        )

        if (sortKey && sortDir) {
            result = [...result].sort((a, b) => {
                const av = a[sortKey] ?? ""
                const bv = b[sortKey] ?? ""
                // Try numeric comparison first
                const an = parseFloat(String(av).replace(/[^0-9.-]/g, ""))
                const bn = parseFloat(String(bv).replace(/[^0-9.-]/g, ""))
                let cmp: number
                if (!isNaN(an) && !isNaN(bn)) {
                    cmp = an - bn
                } else {
                    cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" })
                }
                return sortDir === "asc" ? cmp : -cmp
            })
        }

        return result
    }, [data, filters, sortKey, sortDir])

    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (sortKey !== colKey) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        if (sortDir === "asc") return <ArrowUp className="h-3.5 w-3.5 text-primary" />
        return <ArrowDown className="h-3.5 w-3.5 text-primary" />
    }

    return (
        <div className="rounded-md border border-border overflow-hidden">
            <div className="overflow-auto">
                <Table className="w-full border-collapse">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground border-b w-10">
                                #
                            </TableHead>
                            {columns.map(col => (
                                <TableHead
                                    key={col.key}
                                    className="px-4 py-2 text-left text-sm font-semibold text-muted-foreground border-b"
                                >
                                    <div className="flex flex-col gap-1">
                                        {/* Label + filter icon + sort icon */}
                                        <div className="flex items-center gap-1.5">
                                            <span>{col.label}</span>
                                            {/* Filter icon */}
                                            <button
                                                type="button"
                                                onClick={() => setActiveFilter(k => k === col.key ? null : col.key)}
                                                className={`rounded p-0.5 transition-colors ${
                                                    filters[col.key]
                                                        ? "text-primary"
                                                        : "text-muted-foreground hover:text-foreground"
                                                }`}
                                                title={`Filter by ${col.label}`}
                                            >
                                                <ListFilter className="h-3.5 w-3.5" />
                                            </button>
                                            {/* Sort icon */}
                                            <button
                                                type="button"
                                                onClick={() => handleSort(col.key)}
                                                className="rounded p-0.5 transition-colors"
                                                title={`Sort by ${col.label}`}
                                            >
                                                <SortIcon colKey={col.key} />
                                            </button>
                                        </div>
                                        {/* Inline filter input */}
                                        {activeFilter === col.key && (
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    ref={inputRef}
                                                    value={filters[col.key] ?? ""}
                                                    onChange={e => setFilters(f => ({ ...f, [col.key]: e.target.value }))}
                                                    placeholder="Filter…"
                                                    className="h-6 text-xs px-2 py-0 w-full font-normal text-foreground"
                                                    onKeyDown={e => e.key === "Escape" && setActiveFilter(null)}
                                                />
                                                {filters[col.key] && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setFilters(f => ({ ...f, [col.key]: "" })); setActiveFilter(null) }}
                                                        className="text-muted-foreground hover:text-foreground shrink-0"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {processedData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + 1}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            processedData.map((row, i) => (
                                <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="px-4 py-3 text-sm text-muted-foreground font-medium border-b w-10">
                                        {i + 1}
                                    </TableCell>
                                    {columns.map(col => (
                                        <TableCell key={col.key} className="px-4 py-3 text-sm border-b">
                                            {col.render ? col.render(row) : String(row[col.key] ?? "")}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

// ── Monthly Sales ─────────────────────────────────────────────────────────────
function MonthlySalesReport({ transactions }: { transactions: Transaction[] }) {
    const data = useMemo(() => {
        const map: Record<string, { id: string; month: string; sales: number; returns: number; revenue: number }> = {}
        transactions.forEach(t => {
            const txType = (t.type ?? (t as any).transactionType ?? "").toString().toUpperCase()
            const d = new Date(t.createdAt)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
            const label = d.toLocaleString("default", { month: "long", year: "numeric" })
            if (!map[key]) map[key] = { id: key, month: label, sales: 0, returns: 0, revenue: 0 }
            if (txType === "SALE") {
                map[key].sales += t.quantity
                map[key].revenue += t.totalPrice || (t.quantity * t.unitPrice)
            }
            if (txType === "RETURN") map[key].returns += t.quantity
        })
        return Object.entries(map).sort(([a], [b]) => b.localeCompare(a)).map(([, v]) => v)
    }, [transactions])

    const columns: ColDef<typeof data[0]>[] = [
        { key: "month", label: "Month" },
        { key: "sales", label: "Units Sold" },
        { key: "returns", label: "Returns" },
        { key: "revenue", label: "Revenue", render: item => `$${Number(item.revenue).toFixed(2)}` },
    ]

    return <FilterableTable columns={columns} data={data} emptyMessage="No transaction data available" />
}

// ── Stock Movement ────────────────────────────────────────────────────────────
function StockMovementReport({ transactions }: { transactions: Transaction[] }) {
    const data = useMemo(() => {
        const map: Record<string, { id: string; productName: string; purchased: number; sold: number; adjusted: number; net: number }> = {}
        transactions.forEach(t => {
            const txType = (t.type ?? (t as any).transactionType ?? "").toString().toUpperCase()
            const name = t.productName || `Product #${t.productId}`
            if (!map[name]) map[name] = { id: name, productName: name, purchased: 0, sold: 0, adjusted: 0, net: 0 }
            if (txType === "PURCHASE") map[name].purchased += t.quantity
            else if (txType === "SALE") map[name].sold += t.quantity
            else if (txType === "ADJUSTMENT") map[name].adjusted += t.quantity
        })
        return Object.values(map).map(r => ({ ...r, net: r.purchased - r.sold + r.adjusted }))
            .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
    }, [transactions])

    const columns: ColDef<typeof data[0]>[] = [
        { key: "productName", label: "Product" },
        { key: "purchased", label: "Purchased" },
        { key: "sold", label: "Sold" },
        { key: "adjusted", label: "Adjusted" },
        {
            key: "net", label: "Net Change",
            render: item => (
                <span className={item.net >= 0 ? "text-green-500 font-medium" : "text-destructive font-medium"}>
                    {item.net >= 0 ? `+${item.net}` : item.net}
                </span>
            )
        },
    ]

    return <FilterableTable columns={columns} data={data} emptyMessage="No stock movement data available" />
}

// ── Dead Stock ────────────────────────────────────────────────────────────────
function DeadStockReport({ products, transactions }: { products: Product[]; transactions: Transaction[] }) {
    const data = useMemo(() => {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        // Build a map of productId → latest sale date
        const lastSaleMap = new Map<number, Date>()
        transactions
            .filter(t => t.type === "SALE")
            .forEach(t => {
                const d = new Date(t.createdAt)
                const existing = lastSaleMap.get(t.productId)
                if (!existing || d > existing) lastSaleMap.set(t.productId, d)
            })

        const recentlySold = new Set(
            transactions.filter(t => t.type === "SALE" && new Date(t.createdAt) >= ninetyDaysAgo).map(t => t.productId)
        )
        return products
            .filter(p => p.currentStock > 0 && !recentlySold.has(p.id))
            .map(p => {
                const lastSaleDate = lastSaleMap.get(p.id)
                return {
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    currentStock: p.currentStock,
                    category: p.category || "—",
                    value: `$${(p.currentStock * (p.price || 0)).toFixed(2)}`,
                    lastSale: lastSaleDate ? lastSaleDate.toLocaleDateString() : "Never",
                    lastSaleRaw: lastSaleDate ? lastSaleDate.getTime() : 0,
                }
            })
            .sort((a, b) => b.currentStock - a.currentStock)
    }, [products, transactions])

    const columns: ColDef<typeof data[0]>[] = [
        { key: "name", label: "Product" },
        { key: "sku", label: "SKU" },
        { key: "category", label: "Category" },
        { key: "currentStock", label: "Stock on Hand" },
        { key: "value", label: "Tied-up Value" },
        { key: "lastSaleRaw", label: "Last Sale", render: item => item.lastSale },
    ]

    return <FilterableTable columns={columns} data={data} emptyMessage="No dead stock items found" />
}

// ── Supplier Performance ──────────────────────────────────────────────────────
function SupplierPerformanceReport({ products, transactions, suppliers }: {
    products: Product[]
    transactions: Transaction[]
    suppliers: Supplier[]
}) {
    const data = useMemo(() => {
        const supplierMap = new Map(suppliers.map(s => [s.id, s.name]))
        const productSupplierMap = new Map(products.map(p => [p.id, p.supplierId]))
        const stats: Record<number, { supplierName: string; productCount: number; totalPurchased: number; totalSpend: number }> = {}
        products.forEach(p => {
            const sid = p.supplierId
            if (!stats[sid]) stats[sid] = { supplierName: supplierMap.get(sid) || `Supplier #${sid}`, productCount: 0, totalPurchased: 0, totalSpend: 0 }
            stats[sid].productCount++
        })
        transactions.filter(t => t.type === "PURCHASE").forEach(t => {
            const sid = productSupplierMap.get(t.productId)
            if (sid == null) return
            if (!stats[sid]) stats[sid] = { supplierName: supplierMap.get(sid) || `Supplier #${sid}`, productCount: 0, totalPurchased: 0, totalSpend: 0 }
            stats[sid].totalPurchased += t.quantity
            stats[sid].totalSpend += t.totalPrice || (t.quantity * t.unitPrice)
        })
        return Object.entries(stats).sort(([, a], [, b]) => b.totalSpend - a.totalSpend).map(([sid, s]) => ({
            id: Number(sid),
            supplierName: s.supplierName,
            productCount: s.productCount,
            totalPurchased: s.totalPurchased,
            totalSpend: `$${Number(s.totalSpend).toFixed(2)}`,
        }))
    }, [products, transactions, suppliers])

    const columns: ColDef<typeof data[0]>[] = [
        { key: "supplierName", label: "Supplier" },
        { key: "productCount", label: "Products Supplied" },
        { key: "totalPurchased", label: "Units Purchased" },
        { key: "totalSpend", label: "Total Spend" },
    ]

    return <FilterableTable columns={columns} data={data} emptyMessage="No supplier data available" />
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function exportCSV(filename: string, rows: Record<string, any>[]) {
    if (!rows.length) return
    const headers = Object.keys(rows[0]).filter(k => k !== "id" && !k.endsWith("Raw"))
    const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const csv = [
        headers.join(","),
        ...rows.map(r => headers.map(h => escape(r[h])).join(",")),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export default function ReportsPage() {
    const [reportType, setReportType] = useState<ReportType>("MONTHLY_SALES")
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const swrOpts = { refreshInterval: 15000, revalidateOnFocus: true }
    const { data: transactions = [], isLoading: txLoading } = useSWR("transactions", transactionApi.getAll, swrOpts)
    const { data: products = [], isLoading: prodLoading } = useSWR("products", productApi.getAll, swrOpts)
    const { data: suppliers = [], isLoading: supLoading } = useSWR("active-suppliers", supplierApi.getActive, swrOpts)

    const isLoading = txLoading || prodLoading || supLoading
    const selectedLabel = reportOptions.find(r => r.value === reportType)?.label ?? ""

    // Compute export data for the current report type
    const exportData = useMemo(() => {
        if (reportType === "MONTHLY_SALES") {
            const map: Record<string, { month: string; sales: number; returns: number; revenue: string }> = {}
            transactions.forEach(t => {
                const d = new Date(t.createdAt)
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
                const label = d.toLocaleString("default", { month: "long", year: "numeric" })
                if (!map[key]) map[key] = { month: label, sales: 0, returns: 0, revenue: "0" }
                if (t.type === "SALE") {
                    map[key].sales += t.quantity
                    const rev = parseFloat(map[key].revenue) + (t.totalPrice || t.quantity * t.unitPrice)
                    map[key].revenue = rev.toFixed(2)
                }
                if (t.type === "RETURN") map[key].returns += t.quantity
            })
            return Object.entries(map).sort(([a], [b]) => b.localeCompare(a)).map(([, v]) => v)
        }
        if (reportType === "STOCK_MOVEMENT") {
            const map: Record<string, { product: string; purchased: number; sold: number; adjusted: number; net: number }> = {}
            transactions.forEach(t => {
                const name = t.productName || `Product #${t.productId}`
                if (!map[name]) map[name] = { product: name, purchased: 0, sold: 0, adjusted: 0, net: 0 }
                if (t.type === "PURCHASE") map[name].purchased += t.quantity
                else if (t.type === "SALE") map[name].sold += t.quantity
                else if (t.type === "ADJUSTMENT") map[name].adjusted += t.quantity
            })
            return Object.values(map).map(r => ({ ...r, net: r.purchased - r.sold + r.adjusted }))
        }
        if (reportType === "DEAD_STOCK") {
            const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
            const lastSaleMap = new Map<number, Date>()
            transactions.filter(t => t.type === "SALE").forEach(t => {
                const d = new Date(t.createdAt)
                const ex = lastSaleMap.get(t.productId)
                if (!ex || d > ex) lastSaleMap.set(t.productId, d)
            })
            const recentlySold = new Set(transactions.filter(t => t.type === "SALE" && new Date(t.createdAt) >= ninetyDaysAgo).map(t => t.productId))
            return products.filter(p => p.currentStock > 0 && !recentlySold.has(p.id)).map(p => ({
                product: p.name, sku: p.sku, category: p.category || "—",
                stock: p.currentStock,
                value: `$${(p.currentStock * (p.price || 0)).toFixed(2)}`,
                lastSale: lastSaleMap.get(p.id)?.toLocaleDateString() ?? "Never",
            }))
        }
        if (reportType === "SUPPLIER_PERFORMANCE") {
            const supplierMap = new Map(suppliers.map(s => [s.id, s.name]))
            const productSupplierMap = new Map(products.map(p => [p.id, p.supplierId]))
            const stats: Record<number, { supplier: string; products: number; unitsPurchased: number; totalSpend: string }> = {}
            products.forEach(p => {
                if (!stats[p.supplierId]) stats[p.supplierId] = { supplier: supplierMap.get(p.supplierId) || `#${p.supplierId}`, products: 0, unitsPurchased: 0, totalSpend: "0" }
                stats[p.supplierId].products++
            })
            transactions.filter(t => t.type === "PURCHASE").forEach(t => {
                const sid = productSupplierMap.get(t.productId); if (sid == null) return
                if (!stats[sid]) stats[sid] = { supplier: supplierMap.get(sid) || `#${sid}`, products: 0, unitsPurchased: 0, totalSpend: "0" }
                stats[sid].unitsPurchased += t.quantity
                stats[sid].totalSpend = (parseFloat(stats[sid].totalSpend) + (t.totalPrice || t.quantity * t.unitPrice)).toFixed(2)
            })
            return Object.values(stats).sort((a, b) => parseFloat(b.totalSpend) - parseFloat(a.totalSpend))
        }
        return []
    }, [reportType, transactions, products, suppliers])

    useEffect(() => {
        const app = document.getElementById("root") as HTMLElement | null
        if (!app) return
        app.style.transition = "filter 0.15s ease"
        app.style.filter = dropdownOpen ? "blur(4px)" : ""
        return () => { app.style.filter = "" }
    }, [dropdownOpen])

    return (
        <>
            <div className="flex flex-col">
                <Header title="Reports" description="Generate and view inventory reports" />

                <div className="flex-1 p-6 space-y-6">
                    {/* Selector row + export button */}
                    <div className="flex items-center justify-between gap-4">
                        <Select
                            value={reportType}
                            onValueChange={(v) => setReportType(v as ReportType)}
                            open={dropdownOpen}
                            onOpenChange={setDropdownOpen}
                        >
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                            <SelectContent>
                                {reportOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading || exportData.length === 0}
                            onClick={() => exportCSV(`${selectedLabel.replace(/\s+/g, "_")}_report.csv`, exportData)}
                            className="flex items-center gap-2 shrink-0"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>

                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart2 className="h-5 w-5 text-primary" />
                                {selectedLabel}
                                {isLoading && (
                                    <Badge variant="outline" className="ml-2 text-xs">Loading…</Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!isLoading && reportType === "MONTHLY_SALES" && (
                                <MonthlySalesReport transactions={transactions} />
                            )}
                            {!isLoading && reportType === "STOCK_MOVEMENT" && (
                                <StockMovementReport transactions={transactions} />
                            )}
                            {!isLoading && reportType === "DEAD_STOCK" && (
                                <DeadStockReport products={products} transactions={transactions} />
                            )}
                            {!isLoading && reportType === "SUPPLIER_PERFORMANCE" && (
                                <SupplierPerformanceReport
                                    products={products}
                                    transactions={transactions}
                                    suppliers={suppliers}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
