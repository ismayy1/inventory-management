import { useState } from "react"
import useSWR from "swr"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { transactionApi, productApi, type Product } from "@/lib/api"
import { Plus } from "lucide-react"
import { mutate } from "swr"

const transactionTypes = ["PURCHASE", "SALE", "RETURN", "ADJUSTMENT", "TRANSFER", "DAMAGED", "EXPIRED"] as const

export function NewTransaction() {
    const { data: products } = useSWR("products", productApi.getAll)
    const [isOpen, setIsOpen] = useState(false)
    const [formData, setFormData] = useState({
        productId: "",
        type: "PURCHASE" as (typeof transactionTypes)[number],
        quantity: "",
        unitPrice: "",
        notes: "",
    })
    const { toast } = useToast()

    const resetForm = () => {
        setFormData({ productId: "", type: "PURCHASE", quantity: "", unitPrice: "", notes: "" })
    }

    const handleCreate = async () => {
        if (!formData.productId) {
            toast({ title: "Please select a product.", variant: "destructive" })
            return
        }

        const quantity = Number(formData.quantity)
        const unitPrice = Number(formData.unitPrice)

        if (!Number.isInteger(quantity) || quantity <= 0) {
            toast({ title: "Please enter a valid quantity greater than 0.", variant: "destructive" })
            return
        }

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            toast({ title: "Please enter a valid unit price (0 or more).", variant: "destructive" })
            return
        }

        try {
            await transactionApi.create({
                productId: Number(formData.productId),
                type: formData.type,
                quantity,
                unitPrice,
                totalPrice: quantity * unitPrice,
                notes: formData.notes,
            })
            mutate("transactions")
            mutate("products")
            setIsOpen(false)
            resetForm()
            toast({ title: "Transaction created successfully" })
        } catch {
            toast({ title: "Failed to create transaction", variant: "destructive" })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    onClick={resetForm}
                    className="border border-primary bg-primary text-primary-foreground hover:bg-primary/90 p-2 md:p-2 lg:p-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Transaction
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Transaction</DialogTitle>
                    <DialogDescription>Record a new inventory transaction.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Product</Label>
                        <Select
                            value={formData.productId}
                            onValueChange={(value) => setFormData({ ...formData, productId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                                {products?.map((product: Product) => (
                                    <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.name} ({product.sku})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Transaction Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: (typeof transactionTypes)[number]) =>
                                setFormData({ ...formData, type: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {transactionTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Unit Price</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.unitPrice}
                                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Optional notes..."
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreate}>Create Transaction</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
