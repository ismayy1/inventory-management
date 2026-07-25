import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { productApi, supplierApi, type Supplier } from "@/lib/api"
import { Plus } from "lucide-react"
import { mutate } from "swr"
import { cn } from "@/lib/utils"

interface AddProductProps {
    className?: string
}

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

export function AddProduct({ className }: AddProductProps) {
    const [isOpen, setIsOpen] = useState(false)
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

    const resetForm = () => {
        setFormData({
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
        })
    }

    const handleCreate = async () => {
        if (!formData.name?.trim() || !formData.sku?.trim()) {
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
            toast({ title: "Please enter a valid price.", variant: "destructive" })
            return
        }

        if (isNaN(currentStock) || currentStock < 0) {
            toast({ title: "Please enter a valid current stock.", variant: "destructive" })
            return
        }

        if (isNaN(reorderThreshold) || reorderThreshold < 0) {
            toast({ title: "Please enter a valid reorder threshold.", variant: "destructive" })
            return
        }

        if (isNaN(supplierId) || supplierId <= 0) {
            toast({ title: "Please select a valid supplier.", variant: "destructive" })
            return
        }

        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description?.trim() || "",
                sku: formData.sku.trim(),
                category: formData.category,
                price,
                currentStock,
                reorderThreshold,
                unitOfMeasure: formData.unitOfMeasure,
                image: formData.image.trim() || undefined,
            }

            console.log("Sending payload to API:", payload)

            const response = await productApi.create(supplierId, payload)
            console.log("API response:", response)

            mutate("products")
            setIsOpen(false)
            resetForm()
            toast({ title: "Product created successfully" })
        } catch (err: any) {
            console.error("Create product error:", err)
            console.error("Error response:", err?.response)
            const msg =
                err?.response?.data?.message || err?.message || "Failed to create product"
            toast({ title: msg, variant: "destructive" })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    onClick={resetForm}
                    className={cn(
                        "border border-primary bg-primary text-primary-foreground hover:bg-primary/90 p-2 md:p-2 lg:p-2",
                        className
                    )}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                        Enter the product details below.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
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
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
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
                                setFormData({
                                    ...formData,
                                    image: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Price</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                inputMode="decimal"
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

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Current Stock</Label>
                            <Input
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
                            <Label>Reorder Threshold</Label>
                            <Input
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
                            <Label>Supplier</Label>
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
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="border border-primary"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreate}
                    >
                        Create Product
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
