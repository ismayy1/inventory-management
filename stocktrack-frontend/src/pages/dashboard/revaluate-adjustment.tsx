import { useState, useEffect, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import useSWR, { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { stockAdjustmentApi, productApi, type Product } from "@/lib/api"
import { Header } from "@/components/dashboard/header"
import { ArrowUp, ArrowDown } from "lucide-react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const AdjustmentBadge = ({ type }: { type: "INCREMENT" | "DECREMENT" }) => {
  const badgeClasses = cva(
    "flex w-fit items-center gap-1",
    {
      variants: {
        type: {
          INCREMENT: "bg-green-100 text-green-800",
          DECREMENT: "bg-red-100 text-red-800",
        },
      },
      defaultVariants: { type: "INCREMENT" },
    }
  )
  return (
    <Badge className={cn(badgeClasses({ type }))}>
      {type === "INCREMENT" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {type}
    </Badge>
  )
}

export default function RevaluateAdjustmentPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { toast } = useToast()
  
  const { data: adjustment, isLoading: adjustmentLoading } = useSWR(
    id ? `adjustment-${id}` : null,
    () => id ? stockAdjustmentApi.getById(parseInt(id)) : null
  )
  const { data: products } = useSWR("products", productApi.getAll)

  const [formData, setFormData] = useState({
    financialValue: "",
    notes: "",
    additionalReason: "",
    unitPrice: "",
  })

  useEffect(() => {
    if (adjustment) {
      const adjustmentUnitPrice = adjustment.unitPrice?.toString() || (adjustment as any).unit_price?.toString() || ""

      setFormData({
        financialValue: adjustment.financialValue?.toString() || "",
        notes: adjustment.notes || "",
        additionalReason: "",
        unitPrice: adjustmentUnitPrice,
      })
    }
  }, [adjustment])

  const productMap = useMemo(() => {
    if (!products) return new Map<number, string>()
    return new Map(products.map((p: Product) => [p.id, p.name]))
  }, [products])

  const getProductName = () => {
    if (!adjustment) return "—"

    const productId = adjustment.productId ?? (adjustment as any).product_id
    const productName = adjustment.productName ?? (adjustment as any).product_name

    if (!productId) return productName || "—"

    return productName || productMap.get(productId) || `Product #${productId}`
  }

  const productName = getProductName()

  const handleRevaluate = async () => {
    if (!formData.notes.trim()) {
      toast({ title: "Notes field is required", variant: "destructive" })
      return
    }

    if (!formData.additionalReason.trim()) {
      toast({ title: "Additional reason is required", variant: "destructive" })
      return
    }

    if (formData.unitPrice && (!Number.isFinite(Number(formData.unitPrice)) || Number(formData.unitPrice) < 0)) {
      toast({ title: "Invalid unit price", description: "Please enter a valid unit price (0 or more).", variant: "destructive" })
      return
    }

    try {
      const updatedAdjustment = {
        ...adjustment,
        financialValue: formData.financialValue ? parseFloat(formData.financialValue) : adjustment?.financialValue,
        unitPrice: formData.unitPrice !== "" ? Number(formData.unitPrice) : adjustment?.unitPrice,
        notes: formData.notes.trim(),
        reason: adjustment?.reason 
          ? `${adjustment.reason} | Revaluation: ${formData.additionalReason.trim()}`
          : `Revaluation: ${formData.additionalReason.trim()}`
      }

      await stockAdjustmentApi.update(parseInt(id!), updatedAdjustment)
      await mutate("adjustments")
      await mutate(`adjustment-${id}`)
      toast({ title: "Stock adjustment revaluated successfully" })
      navigate("/dashboard/adjustments")
    } catch (error: any) {
      toast({ 
        title: "Failed to revaluate adjustment", 
        description: error?.message || "Please try again.", 
        variant: "destructive" 
      })
    }
  }

  if (adjustmentLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Revaluate Stock Adjustment" description="Loading adjustment details..." />
        <div className="flex-1 p-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!adjustment) {
    return (
      <div className="flex flex-col">
        <Header title="Revaluate Stock Adjustment" description="Adjustment not found" />
        <div className="flex-1 p-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">The requested adjustment could not be found.</p>
            <Button onClick={() => navigate("/dashboard/adjustments")}>
              Back to Adjustments
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header 
        title="Revaluate Stock Adjustment" 
        description={`Revaluate adjustment #${adjustment.id}`} 
      />

      <div className="max-w-2xl space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="revaluate-product">Product (Read-only)</Label>
          <Input 
            id="revaluate-product"
            name="revaluate-product"
            value={productName} 
            disabled 
            className="bg-muted"
          />
          {adjustment?.productId && productName !== "—" && (
            <p className="text-xs text-muted-foreground">
              Product ID: {adjustment.productId}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Adjustment Type (Read-only)</Label>
            <div className="p-2 border rounded-md bg-muted">
              <AdjustmentBadge type={adjustment.adjustmentType} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revaluate-adjustment-quantity">Adjustment Quantity (Read-only)</Label>
            <Input id="revaluate-adjustment-quantity" name="revaluate-adjustment-quantity" value={adjustment.adjustmentQuantity?.toString() || "0"} disabled />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="revaluate-previous-stock">Previous Stock (Read-only)</Label>
            <Input id="revaluate-previous-stock" name="revaluate-previous-stock" value={adjustment.previousStock?.toString() || "—"} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="revaluate-new-stock">New Stock (Read-only)</Label>
            <Input id="revaluate-new-stock" name="revaluate-new-stock" value={adjustment.newStock?.toString() || "—"} disabled />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="revaluate-unit-price">Unit Price</Label>
          <Input
            id="revaluate-unit-price"
            name="revaluate-unit-price"
            type="number"
            min="0"
            step="0.01"
            value={formData.unitPrice}
            readOnly
            className="bg-muted"
            placeholder="Product price only"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="revaluate-original-reason">Original Reason (Read-only)</Label>
          <Textarea id="revaluate-original-reason" name="revaluate-original-reason" value={adjustment.reason || "—"} disabled />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="revaluate-adjusted-by">Adjusted By (Read-only)</Label>
            <Input id="revaluate-adjusted-by" name="revaluate-adjusted-by" value={adjustment.adjustedBy || "—"} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="revaluate-adjusted-at">Date & Time (Read-only)</Label>
            <Input 
              id="revaluate-adjusted-at"
              name="revaluate-adjusted-at"
              value={adjustment.adjustedAt ? new Date(adjustment.adjustedAt).toLocaleString() : "—"} 
              disabled 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="revaluate-financial-value">Financial Value</Label>
          <Input
            id="revaluate-financial-value"
            name="revaluate-financial-value"
            type="number"
            step="0.01"
            min="0"
            value={formData.financialValue}
            onChange={(e) => setFormData({ ...formData, financialValue: e.target.value })}
            placeholder="Enter financial value"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="revaluate-additional-reason">Additional Reason <span className="text-red-500">*</span></Label>
          <Textarea
            id="revaluate-additional-reason"
            name="revaluate-additional-reason"
            value={formData.additionalReason}
            onChange={(e) => setFormData({ ...formData, additionalReason: e.target.value })}
            placeholder="Enter additional reason for revaluation"
          />
          <p className="text-sm text-muted-foreground">
            This will be appended to the existing reason
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="revaluate-notes">Notes <span className="text-red-500">*</span></Label>
          <Textarea
            id="revaluate-notes"
            name="revaluate-notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Enter notes for this revaluation"
          />
        </div>

        <div className="flex gap-4">
          <Button className="border border-border rounded px-2 py-1" onClick={handleRevaluate}>
            Save Revaluation
          </Button>
          <Button className="border border-border rounded px-2 py-1" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}