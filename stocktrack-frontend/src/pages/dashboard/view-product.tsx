import { useNavigate, useParams } from "react-router-dom"
import useSWR from "swr"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { productApi, type Product } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { isInventoryManager, isUserAdmin } from "@/lib/utils"

const productCategories = [
    { value: "GENERAL", label: "General" },
    { value: "FOOD", label: "Food & Beverages" },
    { value: "ELECTRONICS", label: "Electronics" },
    { value: "CLOTHING", label: "Clothing" },
    { value: "BOOKS", label: "Books" },
    { value: "BEAUTY", label: "Beauty & Personal Care" },
    { value: "HOME", label: "Home & Garden" },
    { value: "TOYS", label: "Toys & Games" },
    { value: "SPORTS", label: "Sports & Outdoors" },
]

const unitOptions = [
    // Length units
    { value: "mm", label: "Millimeter (mm)" },
    { value: "cm", label: "Centimeter (cm)" },
    { value: "m", label: "Meter (m)" },
    { value: "in", label: "Inch (in)" },
    { value: "ft", label: "Foot (ft)" },
    // Weight units
    { value: "g", label: "Gram (g)" },
    { value: "kg", label: "Kilogram (kg)" },
    { value: "oz", label: "Ounce (oz)" },
    { value: "lb", label: "Pound (lb)" },
    // Volume units
    { value: "ml", label: "Milliliter (ml)" },
    { value: "L", label: "Liter (L)" },
    { value: "gal", label: "Gallon (gal)" },
    { value: "fl oz", label: "Fluid Ounce (fl oz)" },
]

export default function ViewProductPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const canEdit = isInventoryManager(user) && !isUserAdmin(user)

    const numericId = id ? Number(id) : NaN

    const { data: product, isLoading } = useSWR<Product | null>(
        Number.isFinite(numericId) ? ["product", numericId] : null,
        () => productApi.getById(numericId),
    )

    const getCategoryLabel = (category: string) => {
        return productCategories.find(cat => cat.value === category)?.label || category
    }

    const getUnitLabel = (unit: string) => {
        return unitOptions.find(u => u.value === unit)?.label || unit
    }

    const getStockStatusBadge = (product: Product) => {
        if (product.currentStock === 0) {
            return <Badge className="bg-destructive text-destructive-foreground">Out of Stock</Badge>
        } else if (product.currentStock <= product.reorderThreshold) {
            return <Badge className="bg-secondary text-secondary-foreground">Low Stock</Badge>
        } else {
            return <Badge className="bg-emerald-600 text-white">In Stock</Badge>
        }
    }

    return (
        <div className="flex flex-col">
            <Header title="View Product" description="Product details" />

            <div className="flex-1 p-6">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Product Details</CardTitle>
                            <div className="flex gap-2">
                                            {canEdit && (
                                            <Button
                                                variant="outline"
                                                onClick={() => navigate(`/dashboard/products/${product?.id}/edit`)}
                                            >
                                                Edit Product
                                            </Button>
                                            )}
                                <Button
                                    variant="outline"
                                    onClick={() => navigate("/dashboard/products")}
                                >
                                    Back to Products
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading && <p className="text-sm text-muted-foreground">Loading product...</p>}
                        {!isLoading && !product && <p className="text-sm text-destructive">Product not found.</p>}

                        {product && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-2xl font-bold">{product.name}</h2>
                                            <p className="text-muted-foreground">SKU: {product.sku}</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Product ID</Label>
                                            <p className="text-lg font-semibold">{product.id}</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                                            <p className="text-lg">{product.category ? getCategoryLabel(product.category) : "—"}</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                                            <p className="text-lg">{product.description || "No description"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Price</Label>
                                            <p className="text-2xl font-bold text-green-600">
                                                ${product.price != null ? Number(product.price).toFixed(2) : "—"}
                                            </p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Unit of Measure</Label>
                                            <p className="text-lg">{getUnitLabel(product.unitOfMeasure)}</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Current Stock</Label>
                                            <div className="flex items-center gap-2">
                                                <p className="text-lg font-semibold">{product.currentStock}</p>
                                                {getStockStatusBadge(product)}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Reorder Threshold</Label>
                                            <p className="text-lg">{product.reorderThreshold}</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Supplier ID</Label>
                                            <p className="text-lg">{product.supplierId}</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Expiry Date</Label>
                                            <p className="text-lg">
                                                {product.expiryDate
                                                    ? new Date(product.expiryDate).toLocaleDateString()
                                                    : "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}