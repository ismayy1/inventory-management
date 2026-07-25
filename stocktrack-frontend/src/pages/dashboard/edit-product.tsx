import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import useSWR, { mutate } from "swr"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
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

export default function EditProductPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = isUserAdmin(user)
    const isManager = isInventoryManager(user)
    const { toast } = useToast()

    const numericId = id ? Number(id) : NaN

    const { data: product, isLoading } = useSWR<Product | null>(
        Number.isFinite(numericId) ? ["product", numericId] : null,
        () => productApi.getById(numericId),
    )

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        sku: "",
        category: "",
        price: "",
        currentStock: "",
        reorderThreshold: "",
        supplierId: "",
        unitOfMeasure: "pcs",
        image: "",
        expiryDate: "",
    })

    if (isAdmin || !isManager) {
        return (
            <div className="flex flex-col">
                <Header title="Access Denied" description="You do not have permission to edit products" />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
                        <p className="text-muted-foreground mb-6">Only Inventory Managers can edit products.</p>
                        <Button onClick={() => navigate("/dashboard/products")}>Back to Products</Button>
                    </div>
                </div>
            </div>
        )
    }

    const [isFormInitialized, setIsFormInitialized] = useState(false)

    useEffect(() => {
        if (product && !isFormInitialized) {
            const defaultUnit =
                unitOptions.find((u) => u.value === product.unitOfMeasure)?.value || "pcs"
            const defaultCategory = product.category || productCategories[0].value

            setFormData({
                name: product.name || "",
                description: product.description || "",
                sku: product.sku || "",
                category: defaultCategory,
                price: product.price ? product.price.toString() : "",
                currentStock: product.currentStock ? product.currentStock.toString() : "0",
                reorderThreshold: product.reorderThreshold ? product.reorderThreshold.toString() : "0",
                supplierId: product.supplierId ? product.supplierId.toString() : "",
                unitOfMeasure: defaultUnit,
                image: product.image || "",
                expiryDate: product.expiryDate
                    ? product.expiryDate.substring(0, 10)
                    : "",
            })
            setIsFormInitialized(true)
        }
    }, [product])

    const handleUpdate = async () => {
        if (!product) return

        if (!formData.name.trim() || !formData.sku.trim()) {
            toast({ title: "Name and SKU are required.", variant: "destructive" })
            return
        }

        if (!formData.category) {
            toast({ title: "Category is required.", variant: "destructive" })
            return
        }

        if (!unitOptions.some((u) => u.value === formData.unitOfMeasure)) {
            toast({ title: "Please select a valid unit of measure.", variant: "destructive" })
            return
        }

        const price = parseFloat(formData.price)
        const currentStock = parseInt(formData.currentStock, 10)
        const reorderThreshold = parseInt(formData.reorderThreshold, 10)
        const supplierId = parseInt(formData.supplierId, 10)

        if (!formData.price.trim() || isNaN(price) || price <= 0) {
            toast({ title: "Please enter a valid price greater than 0.", variant: "destructive" })
            return
        }

        if (!Number.isInteger(currentStock) || currentStock < 0) {
            toast({ title: "Please enter a valid current stock (0 or more).", variant: "destructive" })
            return
        }

        if (!Number.isInteger(reorderThreshold) || reorderThreshold < 0) {
            toast({ title: "Please enter a valid reorder threshold (0 or more).", variant: "destructive" })
            return
        }

        if (!Number.isInteger(supplierId) || supplierId <= 0) {
            toast({ title: "Please enter a valid supplier ID.", variant: "destructive" })
            return
        }

        try {
            const updatePayload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                sku: formData.sku.trim(),
                category: formData.category,
                price,
                currentStock,
                reorderThreshold,
                supplierId,
                unitOfMeasure: formData.unitOfMeasure,
                image: formData.image.trim() || undefined,
                expiryDate: formData.expiryDate || undefined,
            }

            await productApi.update(product.id, updatePayload)

            await mutate("products")
            await mutate(["product", numericId])
            toast({ title: "Product updated successfully" })
            navigate("/dashboard/products")
        } catch (err: any) {
            const msg = err?.message || "Failed to update product"
            toast({ title: msg, variant: "destructive" })
        }
    }

    return (
        <div className="flex flex-col">
            <Header title="Edit Product" description="Update product details" />

            <div className="flex-1 p-6">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading && <p className="text-sm text-muted-foreground">Loading product...</p>}
                        {!isLoading && !product && <p className="text-sm text-destructive">Product not found.</p>}

                        {product && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>SKU</Label>
                                        <Input
                                            value={formData.sku}
                                            onChange={(e) =>
                                                setFormData({ ...formData, sku: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Image URL</Label>
                                    <Input
                                        type="url"
                                        placeholder="https://example.com/image.jpg"
                                        value={formData.image}
                                        onChange={(e) =>
                                            setFormData({ ...formData, image: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, category: value })
                                            }
                                        >
                                            <SelectTrigger className="w-full h-10 bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary">
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-white border border-gray-300">
                                                {productCategories.map((cat) => (
                                                    <SelectItem key={cat.value} value={cat.value} className="text-gray-900">
                                                        {cat.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Unit of Measure</Label>
                                        <Select
                                            value={formData.unitOfMeasure}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, unitOfMeasure: value })
                                            }
                                        >
                                            <SelectTrigger className="w-full h-10 bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary">
                                                <SelectValue placeholder="Select Unit" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-white border border-gray-300">
                                                {unitOptions.map((unit) => (
                                                    <SelectItem key={unit.value} value={unit.value} className="text-gray-900">
                                                        {unit.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Price</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            inputMode="decimal"
                                            placeholder="0.00"
                                            value={formData.price}
                                            onChange={(e) =>
                                                setFormData({ ...formData, price: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Current Stock</Label>
                                        <Input
                                            type="number"
                                            value={formData.currentStock}
                                            onChange={(e) =>
                                                setFormData({ ...formData, currentStock: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reorder Threshold</Label>
                                        <Input
                                            type="number"
                                            value={formData.reorderThreshold}
                                            onChange={(e) =>
                                                setFormData({ ...formData, reorderThreshold: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Supplier ID</Label>
                                        <Input
                                            type="number"
                                            value={formData.supplierId}
                                            onChange={(e) =>
                                                setFormData({ ...formData, supplierId: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Expiry Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={(e) =>
                                            setFormData({ ...formData, expiryDate: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate("/dashboard/products")}
                                        className="border border-primary p-2 bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleUpdate}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
