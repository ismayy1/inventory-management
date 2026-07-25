import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { mutate } from "swr"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { purchaseOrderApi, supplierApi, productApi, type Supplier, type Product } from "@/lib/api"
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { isInventoryManager, isUserAdmin } from "@/lib/utils"

interface OrderLine {
    productId: string
    quantity: string
    unitPrice: string
}

export default function NewPurchaseOrderPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuth()
    const isAdmin = isUserAdmin(user)
    const isManager = isInventoryManager(user)

    // Allow both General Manager (SYSTEM_ADMIN) and Inventory Manager
    const canCreate = isAdmin || isManager

    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loadingData, setLoadingData] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [supplierId, setSupplierId] = useState("")
    const [notes, setNotes] = useState("")
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("")
    const [lines, setLines] = useState<OrderLine[]>([{ productId: "", quantity: "", unitPrice: "" }])
    const [anyDropdownOpen, setAnyDropdownOpen] = useState(false)

    useEffect(() => {
        const app = document.getElementById("root") as HTMLElement | null
        if (!app) return
        app.style.transition = "filter 0.15s ease"
        app.style.filter = anyDropdownOpen ? "blur(4px)" : ""
        return () => { app.style.filter = "" }
    }, [anyDropdownOpen])

    useEffect(() => {
        Promise.all([supplierApi.getActive(), productApi.getAll()])
            .then(([s, p]) => { setSuppliers(s || []); setProducts(p || []) })
            .catch(() => toast({ title: "Failed to load data", variant: "destructive" }))
            .finally(() => setLoadingData(false))
    }, [])

    if (!canCreate) {
        return (
            <div className="flex flex-col">
                <Header title="Access Denied" description="Only Inventory Managers can create purchase orders" />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
                        <Button onClick={() => navigate("/dashboard/purchase-orders")}>Back</Button>
                    </div>
                </div>
            </div>
        )
    }

    const updateLine = (index: number, field: keyof OrderLine, value: string) => {
        const updated = [...lines]
        updated[index] = { ...updated[index], [field]: value }
        // Auto-fill unit price from product
        if (field === "productId" && value) {
            const product = products.find(p => p.id === Number(value))
            if (product) updated[index].unitPrice = product.price.toString()
        }
        setLines(updated)
    }

    const addLine = () => setLines([...lines, { productId: "", quantity: "", unitPrice: "" }])

    const removeLine = (index: number) => {
        if (lines.length === 1) return
        setLines(lines.filter((_, i) => i !== index))
    }

    const totalAmount = lines.reduce((sum, l) => {
        const qty = parseFloat(l.quantity) || 0
        const price = parseFloat(l.unitPrice) || 0
        return sum + qty * price
    }, 0)

    const handleSubmit = async () => {
        if (!supplierId) {
            toast({ title: "Please select a supplier.", variant: "destructive" })
            return
        }

        // Block submission if expected delivery date is already in the past
        if (expectedDeliveryDate && new Date(expectedDeliveryDate) < new Date(new Date().toDateString())) {
            toast({
                title: "Invalid delivery date",
                description: "The expected delivery date cannot be in the past. Please select a future date.",
                variant: "destructive",
            })
            return
        }
        for (const [i, line] of lines.entries()) {
            if (!line.productId) {
                toast({ title: `Line ${i + 1}: please select a product.`, variant: "destructive" })
                return
            }
            const qty = parseInt(line.quantity, 10)
            if (!Number.isInteger(qty) || qty <= 0) {
                toast({ title: `Line ${i + 1}: quantity must be a positive integer.`, variant: "destructive" })
                return
            }
            const price = parseFloat(line.unitPrice)
            if (isNaN(price) || price < 0) {
                toast({ title: `Line ${i + 1}: invalid unit price.`, variant: "destructive" })
                return
            }
        }

        // Generate a unique PO number to avoid data integrity violations
        const poNumber = `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        setIsSubmitting(true)
        try {
            await purchaseOrderApi.create({
                supplierId: parseInt(supplierId, 10),
                poNumber,
                status: "PENDING",
                notes: notes.trim() || undefined,
                expectedDeliveryDate: expectedDeliveryDate || undefined,
                items: lines.map(l => ({
                    productId: parseInt(l.productId, 10),
                    quantity: parseInt(l.quantity, 10),
                    unitPrice: parseFloat(l.unitPrice),
                })),
            })
            mutate("purchase-orders")
            toast({ title: "Purchase order created successfully" })
            navigate("/dashboard/purchase-orders")
        } catch (err: any) {
            toast({ title: err?.message || "Failed to create purchase order", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loadingData) {
        return (
            <div className="flex flex-col">
                <Header title="New Purchase Order" description="Create a supplier purchase order" />
                <div className="flex-1 flex items-center justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col">
            <Header title="New Purchase Order" description="Create a supplier purchase order" />

            <div className="flex-1 p-6">
                <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle>Purchase Order Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Header fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Supplier</Label>
                                <Select value={supplierId} onValueChange={setSupplierId} onOpenChange={setAnyDropdownOpen}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Expected Delivery Date</Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={expectedDeliveryDate}
                                        onChange={e => setExpectedDeliveryDate(e.target.value)}
                                        className={`h-9 [&::-webkit-calendar-picker-indicator]:invert ${
                                            expectedDeliveryDate && new Date(expectedDeliveryDate) < new Date(new Date().toDateString())
                                                ? "border-destructive pr-9 focus-visible:ring-destructive"
                                                : ""
                                        }`}
                                    />
                                    {expectedDeliveryDate && new Date(expectedDeliveryDate) < new Date(new Date().toDateString()) && (
                                        <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive pointer-events-none" />
                                    )}
                                </div>
                                {expectedDeliveryDate && new Date(expectedDeliveryDate) < new Date(new Date().toDateString()) && (
                                    <p className="text-xs text-destructive">Delivery date is in the past.</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Optional notes..."
                                rows={2}
                            />
                        </div>

                        {/* Line items */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Order Items</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                                    <Plus className="h-4 w-4 mr-1" /> Add Item
                                </Button>
                            </div>

                            {/* Column headers */}
                            <div className="grid grid-cols-12 gap-2 px-1 text-xs font-medium text-muted-foreground">
                                <span className="col-span-5">Product</span>
                                <span className="col-span-2">Qty</span>
                                <span className="col-span-2">Unit Price</span>
                                <span className="col-span-2">Subtotal</span>
                                <span className="col-span-1" />
                            </div>

                            {lines.map((line, i) => {
                                const qty = parseFloat(line.quantity) || 0
                                const price = parseFloat(line.unitPrice) || 0
                                const subtotal = qty * price
                                return (
                                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-5">
                                            <Select value={line.productId} onValueChange={v => updateLine(i, "productId", v)} onOpenChange={setAnyDropdownOpen}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Select product" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(() => {
                                                        const sid = supplierId ? parseInt(supplierId, 10) : null
                                                        const supplierProds = sid ? products.filter(p => p.supplierId === sid) : []
                                                        const otherProds = sid ? products.filter(p => p.supplierId !== sid) : products
                                                        return (
                                                            <>
                                                                {supplierProds.length > 0 && (
                                                                    <>
                                                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                                            Supplier Products
                                                                        </div>
                                                                        {supplierProds.map(p => (
                                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                                {p.name} ({p.sku})
                                                                            </SelectItem>
                                                                        ))}
                                                                        {otherProds.length > 0 && (
                                                                            <div className="my-1 border-t border-border" />
                                                                        )}
                                                                    </>
                                                                )}
                                                                {otherProds.length > 0 && (
                                                                    <>
                                                                        {supplierProds.length > 0 && (
                                                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                                                Other Products
                                                                            </div>
                                                                        )}
                                                                        {otherProds.map(p => (
                                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                                {p.name} ({p.sku})
                                                                            </SelectItem>
                                                                        ))}
                                                                    </>
                                                                )}
                                                            </>
                                                        )
                                                    })()}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={line.quantity}
                                                onChange={e => updateLine(i, "quantity", e.target.value)}
                                                className="h-9"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={line.unitPrice}
                                                onChange={e => updateLine(i, "unitPrice", e.target.value)}
                                                className="h-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="col-span-2 text-sm font-medium text-right pr-1">
                                            {subtotal > 0 ? `$${subtotal.toFixed(2)}` : "—"}
                                        </div>
                                        <div className="col-span-1 flex justify-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                onClick={() => removeLine(i)}
                                                disabled={lines.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Total */}
                            <div className="flex justify-end border-t pt-3">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                                    <Badge variant="outline" className="text-base px-3 py-1">
                                        ${totalAmount.toFixed(2)}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => navigate("/dashboard/purchase-orders")}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Purchase Order
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
