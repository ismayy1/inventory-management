import { useState } from "react"
import { useNavigate } from "react-router-dom"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { stockAdjustmentApi, productApi, type Product } from "@/lib/api"
import { Header } from "@/components/dashboard/header"

type AdjustmentType = "INCREMENT" | "DECREMENT"

export function NewAdjustment() {
  const navigate = useNavigate()
  const { data: products } = useSWR("products", productApi.getAll)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    productId: "",
    adjustmentType: "INCREMENT" as AdjustmentType,
    adjustmentQuantity: "",
    newStock: "",
    reason: "",
    adjustedBy: "",
    adjustedAt: new Date().toISOString().slice(0, 16),
    notes: "",
  })

  const selectedProduct = formData.productId ? products?.find((p: Product) => p.id === Number(formData.productId)) : undefined

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      if (["adjustmentQuantity", "adjustmentType"].includes(field) && selectedProduct) {
        const prevStock = Number(selectedProduct.currentStock || 0)
        const qty = Number(field === "adjustmentQuantity" ? value : prev.adjustmentQuantity || 0)
        const type = field === "adjustmentType" ? (value as AdjustmentType) : prev.adjustmentType
        updated.newStock = type === "INCREMENT" ? (prevStock + qty).toString() :
          type === "DECREMENT" ? (prevStock - qty).toString() :
            prevStock.toString()
      }

      return updated
    })
  }

  const handleCreate = async () => {
    if (!formData.productId || !formData.adjustmentQuantity || !formData.reason || !formData.adjustedBy) {
      toast({ title: "Please fill all required fields", variant: "destructive" })
      return
    }

    const selectedProduct = products?.find((p: Product) => p.id === Number(formData.productId))
    if (!selectedProduct) {
      toast({ title: "Please select a valid product.", variant: "destructive" })
      return
    }

    const prevStock = Number(selectedProduct.currentStock || 0)
    const qty = Number(formData.adjustmentQuantity)
    const unitPrice = Number(selectedProduct.price)

    if (isNaN(prevStock) || isNaN(qty) || prevStock < 0 || qty <= 0) {
      toast({ title: "Invalid input", description: "Please enter valid positive numbers.", variant: "destructive" })
      return
    }

    const calculatedNewStock = formData.adjustmentType === "INCREMENT" ? prevStock + qty : prevStock - qty

    if (calculatedNewStock < 0) {
      toast({ title: "Invalid adjustment", description: "New stock cannot be negative.", variant: "destructive" })
      return
    }

    try {
      const payload: any = {
        productId: Number(formData.productId),
        adjustmentType: formData.adjustmentType,
        adjustmentQuantity: qty,
        previousStock: prevStock,
        newStock: calculatedNewStock,
        reason: formData.reason.trim(),
        adjustedBy: formData.adjustedBy.trim(),
        adjustedAt: new Date(formData.adjustedAt).toISOString(),
        notes: formData.notes?.trim() || null,
        unitPrice,
      }

      await stockAdjustmentApi.create(payload)

      await mutate("adjustments", stockAdjustmentApi.getAll(), false)
      await mutate("products", productApi.getAll(), false)

      toast({ title: "Stock adjustment created successfully" })
      navigate("/dashboard/adjustments")
    } catch (error: any) {
      toast({
        title: "Failed to create adjustment",
        description: error?.message || "Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="New Stock Adjustment" description="Create a new stock adjustment" />

      <div className="max-w-2xl space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="productId">Product <span className="text-red-500">*</span></Label>
          <Select
            name="productId"
            value={formData.productId}
            onValueChange={v => handleChange("productId", v)}
          >
            <SelectTrigger id="productId">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products?.map((p: Product) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.name} ({p.sku})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adjustmentType">Adjustment Type</Label>
            <Select
              name="adjustmentType"
              value={formData.adjustmentType}
              onValueChange={v => handleChange("adjustmentType", v as AdjustmentType)}
            >
              <SelectTrigger id="adjustmentType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCREMENT">Increment</SelectItem>
                <SelectItem value="DECREMENT">Decrement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustmentQuantity">Adjustment Quantity <span className="text-red-500">*</span></Label>
            <Input
              id="adjustmentQuantity"
              name="adjustmentQuantity"
              type="number"
              min="0"
              value={formData.adjustmentQuantity}
              onChange={e => handleChange("adjustmentQuantity", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="previousStock">Previous Stock (Read-only)</Label>
            <Input
              id="previousStock"
              name="previousStock"
              type="number"
              min="0"
              value={selectedProduct ? selectedProduct.currentStock.toString() : ""}
              disabled
              className="bg-muted"
              placeholder="Select product first"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitPrice">Unit Price <span className="text-red-500">*</span></Label>
            <Input
              id="unitPrice"
              name="unitPrice"
              type="number"
              step="0.01"
              min="0"
              value={selectedProduct ? selectedProduct.price.toFixed(2) : ""}
              readOnly
              className="bg-muted"
              placeholder="Select product first"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStock">New Stock</Label>
            <Input
              id="newStock"
              name="newStock"
              type="number"
              value={formData.newStock}
              disabled
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason">Reason <span className="text-red-500">*</span></Label>
          <Textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={e => handleChange("reason", e.target.value)}
            placeholder="Enter reason for adjustment"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adjustedBy">Adjusted By <span className="text-red-500">*</span></Label>
            <Input
              id="adjustedBy"
              name="adjustedBy"
              value={formData.adjustedBy}
              onChange={e => handleChange("adjustedBy", e.target.value)}
              placeholder="Your username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustedAt">Date & Time</Label>
            <Input
              id="adjustedAt"
              name="adjustedAt"
              type="datetime-local"
              value={formData.adjustedAt}
              onChange={e => handleChange("adjustedAt", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={e => handleChange("notes", e.target.value)}
            placeholder="Additional notes..."
          />
        </div>

        <div className="flex gap-4">
          <Button className="border border-border rounded px-2 py-1" onClick={handleCreate}>
            Create Adjustment
          </Button>
          <Button className="border border-border rounded px-2 py-1" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
