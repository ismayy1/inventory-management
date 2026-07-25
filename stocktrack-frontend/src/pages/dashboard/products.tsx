import { useState, useMemo } from "react"
import useSWR, { mutate } from "swr"
import { useNavigate } from "react-router-dom"

import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { productApi, type Product } from "@/lib/api"
import { Search, Pencil, Trash2, Eye } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { isUserAdmin, isInventoryManager } from "@/lib/utils"

export default function ProductsPage() {

    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = isUserAdmin(user)
    const isManager = isInventoryManager(user)
    const canEdit = isManager && !isAdmin
    const { data: products, isLoading } = useSWR("products", productApi.getAll)
    const { toast } = useToast()

    const [searchTerm, setSearchTerm] = useState("")
    const [stockStatusFilter, setStockStatusFilter] = useState("ALL")
    const [unitFilter, setUnitFilter] = useState("ALL")
    const [currentPage, setCurrentPage] = useState(0)
    const [descriptionProduct, setDescriptionProduct] = useState<Product | null>(null)
    const [pageSize, setPageSize] = useState(20)

    const filteredProducts = useMemo(() => {
        if (!products) return []
        
        return products.filter((p: Product) => {
            const searchLower = searchTerm.toLowerCase()
            const matchesSearch = !searchTerm.trim() || (
                    p.name.toLowerCase().includes(searchLower) ||
                p.sku?.toLowerCase().includes(searchLower) ||
                p.description?.toLowerCase().includes(searchLower) ||
                p.barcode?.toLowerCase().includes(searchLower) ||
                p.category?.toLowerCase().includes(searchLower) ||
                p.id.toString().includes(searchLower) ||
                (p.price != null ? p.price.toString().includes(searchLower) : false) ||
                p.currentStock.toString().includes(searchLower)
            )

            let matchesStock = true
            if (stockStatusFilter === "LOW_STOCK") {
                matchesStock = p.stockStatus === "LOW_STOCK" || p.stockStatus === "OUT_OF_STOCK"
            } else if (stockStatusFilter === "IN_STOCK") {
                matchesStock = p.stockStatus === "IN_STOCK"
            } else if (stockStatusFilter === "OVER_STOCK") {
                matchesStock = p.stockStatus === "OVER_STOCK"
            }
            // "ALL" → matchesStock stays true

            const matchesUnit =
                unitFilter === "ALL" || p.unitOfMeasure === unitFilter

            return matchesSearch && matchesStock && matchesUnit
        })
    }, [products, searchTerm, stockStatusFilter, unitFilter])

    const paginatedProducts = useMemo(() => {
        const startIndex = currentPage * pageSize
        return filteredProducts.slice(startIndex, startIndex + pageSize)
    }, [filteredProducts, currentPage, pageSize])

    const totalPages = Math.ceil(filteredProducts.length / pageSize)

    const openEdit = (product: Product) => {
        navigate(`/dashboard/products/${product.id}/edit`)
    }

    const openView = (product: Product) => {
        navigate(`/dashboard/products/${product.id}`)
    }

    const handleDelete = async (id: number) => {

        if (!confirm("Are you sure you want to delete this product?")) return

        try {

            mutate(
                "products",
                products?.filter((p: Product) => p.id !== id),
                false
            )

            await productApi.delete(id)

            await mutate("products")

            toast({ title: "Product deleted successfully" })

        } catch (err: any) {
            await mutate("products")

            const msg = err?.message || "Failed to delete product"

            toast({
                title: msg,
                variant: "destructive"
            })
        }
    }

    const columns = [
        { key: "name", label: "Name" },
        {
            key: "description",
            label: "Description",
            render: (item: Product) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDescriptionProduct(item)}
                >
                    Read
                </Button>
            ),
        },
        { key: "sku", label: "SKU" },
        { key: "category", label: "Category" },

        {
            key: "price",
            label: "Price",
            render: (item: Product) => {
                const price = item.price
                return price != null ? `$${Number(price).toFixed(2)}` : "—"
            },
        },

        {
            key: "currentStock",
            label: "Stock",
            render: (item: Product) => (

                <Badge
                    className={
                        item.currentStock === 0
                            ? "bg-destructive text-destructive-foreground"
                            : item.currentStock <= item.reorderThreshold
                                ? "bg-secondary text-secondary-foreground"
                                : "bg-emerald-600 text-white"
                    }
                >
                    {item.currentStock}
                </Badge>
            ),
        },

        {
            key: "stockStatus",
            label: "Status",
            render: (item: Product) => (

                <Badge variant="outline">
                    {item.stockStatus}
                </Badge>
            ),
        },

        {
            key: "unitOfMeasure",
            label: "Unit",
        },

        {
            key: "supplierId",
            label: "Supplier ID",
        },

        {
            key: "expiryDate",
            label: "Expiry Date",
            render: (item: Product) =>
                item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : "—",
        },

        {
            key: "actions",
            label: "Actions",
            render: (item: Product) => (

                <div className="flex items-center gap-4">

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-muted"
                        onClick={() => openView(item)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>

                    {canEdit && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-muted"
                                onClick={() => openEdit(item)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-muted"
                                onClick={() => handleDelete(item.id)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </>
                    )}

                </div>
            ),
        },
    ]

    return (

        <div className="flex flex-col">

            {/* Description popup */}
            <Dialog open={!!descriptionProduct} onOpenChange={(open) => { if (!open) setDescriptionProduct(null) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{descriptionProduct?.name}</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {descriptionProduct?.description || "No description available."}
                    </p>
                </DialogContent>
            </Dialog>

            <Header
                title="Products"
                description="Manage your inventory products"
            />

            <div className="flex-1 space-y-4 p-6">

                <div className="flex items-center justify-between gap-4 border-b pb-4">

                    <div className="flex items-center gap-3 flex-nowrap w-full min-w-0">

                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Input
                                id="products-search"
                                name="products-search"
                                type="search"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 min-w-0"
                            />
                        </div>

                        <Select
                            value={stockStatusFilter}
                            onValueChange={setStockStatusFilter}
                        >
                            <SelectTrigger className="flex-1 min-w-0">
                                <SelectValue placeholder="Stock Status" />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white border border-gray-300">
                                <SelectItem value="ALL" className="text-gray-900">All Status</SelectItem>
                                <SelectItem value="IN_STOCK" className="text-gray-900">In Stock</SelectItem>
                                <SelectItem value="LOW_STOCK" className="text-gray-900">Low Stock</SelectItem>
                                <SelectItem value="OVER_STOCK" className="text-gray-900">Over Stock</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={unitFilter}
                            onValueChange={setUnitFilter}
                        >
                            <SelectTrigger className="flex-1 min-w-0">
                                <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white border border-gray-300">
                                <SelectItem value="ALL" className="text-gray-900">All Units</SelectItem>
                                <SelectItem value="pcs" className="text-gray-900">pcs</SelectItem>
                                <SelectItem value="kg" className="text-gray-900">kg</SelectItem>
                                <SelectItem value="liters" className="text-gray-900">liters</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                            <span className="text-sm text-muted-foreground">Show:</span>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(v) => {
                                    setPageSize(parseInt(v))
                                    setCurrentPage(0)
                                }}
                            >
                                <SelectTrigger className="w-[80px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-white border border-gray-300">
                                    <SelectItem value="20" className="text-gray-900">20</SelectItem>
                                    <SelectItem value="50" className="text-gray-900">50</SelectItem>
                                    <SelectItem value="100" className="text-gray-900">100</SelectItem>
                                    <SelectItem value="150" className="text-gray-900">150</SelectItem>
                                    <SelectItem value="200" className="text-gray-900">200</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </div>

                    {canEdit && (
                        <Button
                            onClick={() => navigate("/dashboard/products/new")}
                            className="shrink-0"
                        >
                            Add Product
                        </Button>
                    )}

                </div>

                {filteredProducts.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            Showing {Math.min((currentPage * pageSize) + 1, filteredProducts.length)} to {Math.min((currentPage + 1) * pageSize, filteredProducts.length)} of {filteredProducts.length} entries
                        </div>
                        <div>
                            Page {currentPage + 1} of {totalPages || 1}
                        </div>
                    </div>
                )}

                <div className="rounded-lg border bg-card">

                    <DataTable
                        columns={columns}
                        data={paginatedProducts}
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        emptyMessage={isLoading ? "Loading..." : "No products found"}
                    />

                </div>

            </div>

        </div>
    )
}