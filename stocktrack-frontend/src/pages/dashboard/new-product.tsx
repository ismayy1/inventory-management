import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { mutate } from "swr"

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
import { productApi, supplierApi, type Supplier } from "@/lib/api"
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

export default function NewProductPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = isUserAdmin(user)
    const isManager = isInventoryManager(user)
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        sku: "",
        category: "",
        price: "",
        currentStock: "",
        reorderThreshold: "",
        supplierId: "",
        unitOfMeasure: "",
        image: "",
        expiryDate: "",
    })

    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [suppliersLoading, setSuppliersLoading] = useState(false)

    useEffect(() => {
        let active = true
        setSuppliersLoading(true)
        supplierApi.getActive()
            .then((data) => {
                if (active) setSuppliers(data || [])
            })
            .catch(() => {
                if (active) setSuppliers([])
            })
            .finally(() => {
                if (active) setSuppliersLoading(false)
            })
        return () => {
            active = false
        }
    }, [])

    if (isAdmin || !isManager) {
        return (
            <div className="flex flex-col">
                <Header title="Access Denied" description="You do not have permission to add products" />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
                        <p className="text-muted-foreground mb-6">Only Inventory Managers can add products.</p>
                        <Button onClick={() => navigate("/dashboard/products")}>Back to Products</Button>
                    </div>
                </div>
            </div>
        )
    }

    const handleCreate = async () => {
        if (!formData.name.trim() || !formData.sku.trim()) {
            toast({ title: "Name and SKU are required.", variant: "destructive" })
            return
        }

        if (!formData.category) {
            toast({ title: "Category is required.", variant: "destructive" })
            return
        }

        if (!formData.unitOfMeasure) {
            toast({ title: "Unit of measure is required.", variant: "destructive" })
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
            await productApi.create(supplierId, {
                name: formData.name,
                description: formData.description,
                sku: formData.sku,
                category: formData.category,
                price,
                currentStock,
                reorderThreshold,
                unitOfMeasure: formData.unitOfMeasure,
                image: formData.image.trim() || undefined,
                expiryDate: formData.expiryDate || undefined,
            })


            mutate("products")
            toast({ title: "Product created successfully" })
            navigate("/dashboard/products")
        } catch {
            toast({ title: "Failed to create product", variant: "destructive" })
        }
    }

    return (
        <div className="flex flex-col">
            <Header title="Add Product" description="Create a new product" />

            <div className="flex-1 p-6">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-product-name">Name</Label>
                                <Input
                                    id="new-product-name"
                                    name="new-product-name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-product-sku">SKU</Label>
                                <Input
                                    id="new-product-sku"
                                    name="new-product-sku"
                                    value={formData.sku}
                                    onChange={(e) =>
                                        setFormData({ ...formData, sku: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-product-description">Description</Label>
                            <Input
                                id="new-product-description"
                                name="new-product-description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-product-image">Image URL</Label>
                            <Input
                                id="new-product-image"
                                name="new-product-image"
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                value={formData.image}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        image: e.target.value,
                                    })
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
                                <Label htmlFor="new-product-price">Price</Label>
                                <Input
                                    id="new-product-price"
                                    name="new-product-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            price: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-product-current-stock">Current Stock</Label>
                                <Input
                                    id="new-product-current-stock"
                                    name="new-product-current-stock"
                                    type="number"
                                    value={formData.currentStock}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            currentStock: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-product-reorder-threshold">Reorder Threshold</Label>
                                <Input
                                    id="new-product-reorder-threshold"
                                    name="new-product-reorder-threshold"
                                    type="number"
                                    value={formData.reorderThreshold}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            reorderThreshold: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-product-supplier-id">Supplier</Label>
                                <Select
                                    value={formData.supplierId}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, supplierId: value })
                                    }
                                    disabled={suppliersLoading || suppliers.length === 0}
                                >
                                    <SelectTrigger className="w-full h-10 bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary">
                                        <SelectValue
                                            placeholder={
                                                suppliersLoading
                                                    ? "Loading suppliers..."
                                                    : suppliers.length === 0
                                                    ? "No active suppliers"
                                                    : "Select Supplier"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent className="z-50 bg-white border border-gray-300">
                                        {suppliers.map((supplier) => (
                                            <SelectItem
                                                key={supplier.id}
                                                value={supplier.id.toString()}
                                                className="text-gray-900"
                                            >
                                                {supplier.id} - {supplier.name ?? supplier.email ?? `Supplier ${supplier.id}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-product-expiry-date">Expiry Date</Label>
                            <Input
                                id="new-product-expiry-date"
                                name="new-product-expiry-date"
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
                                onClick={handleCreate}
                            >
                                Save Product
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

