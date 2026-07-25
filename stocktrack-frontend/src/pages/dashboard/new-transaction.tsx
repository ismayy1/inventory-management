import { useState } from "react"
import { useNavigate } from "react-router-dom"
import useSWR, { mutate } from "swr"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { transactionApi, productApi, type Product } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

const transactionTypes = ["PURCHASE", "SALE", "RETURN", "ADJUSTMENT", "TRANSFER", "DAMAGED", "EXPIRED"] as const

export default function NewTransactionPage() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuth()
    const { data: products } = useSWR("products", productApi.getAll)

    const [formData, setFormData] = useState({
        productId: "",
        type: "PURCHASE" as (typeof transactionTypes)[number],
        quantity: "",
        unitPrice: "",
        referenceNumber: "",
        description: "",
        notes: "",
    })

    const selectedProduct = formData.productId ? products?.find((p: Product) => p.id === Number(formData.productId)) : undefined

    const handleCreate = async () => {
        if (!formData.productId) {
            toast({ title: "Please select a product.", variant: "destructive" })
            return
        }

        const selectedProduct = products?.find((p: Product) => p.id === Number(formData.productId))
        if (!selectedProduct) {
            toast({ title: "Please select a valid product.", variant: "destructive" })
            return
        }

        const quantity = Number(formData.quantity)
        const unitPrice = Number(selectedProduct.price)

        if (!Number.isInteger(quantity) || quantity <= 0) {
            toast({ title: "Please enter a valid quantity greater than 0.", variant: "destructive" })
            return
        }

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            toast({ title: "Invalid product price", description: "Selected product has an invalid price.", variant: "destructive" })
            return
        }

        try {
            const transactionData: any = {
                productId: Number(formData.productId),
                transactionType: formData.type,
                quantity,
                unitPrice,
                totalPrice: quantity * unitPrice,
                createdBy: user?.username || "unknown",
            }
            
            if (formData.referenceNumber.trim()) {
                transactionData.referenceNumber = formData.referenceNumber.trim()
            }
            
            if (formData.description.trim()) {
                transactionData.description = formData.description.trim()
            }
            
            if (formData.notes.trim()) {
                transactionData.notes = formData.notes.trim()
            }

            await transactionApi.create(transactionData)

            mutate("transactions")
            mutate("products")
            toast({ title: "Transaction created successfully" })
            navigate("/dashboard/transactions")
        } catch (error: any) {
            const errorMessage = error?.message || "Failed to create transaction"
            toast({ title: errorMessage, variant: "destructive" })
        }
    }

    return (
        <div className="flex flex-col">
            <Header title="New Transaction" description="Record a new inventory transaction" />

            <div className="flex-1 p-6">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle>Transaction Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="transaction-product">Product</Label>
                            <Select
                                value={formData.productId}
                                onValueChange={(value) => {
                                    const selectedProduct = products?.find((p: Product) => p.id === Number(value))
                                    setFormData({
                                        ...formData,
                                        productId: value,
                                        unitPrice: selectedProduct ? selectedProduct.price.toString() : "",
                                    })
                                }}
                            >
                                <SelectTrigger id="transaction-product" name="transaction-product">
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
                            <Label htmlFor="transaction-type">Transaction Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: (typeof transactionTypes)[number]) =>
                                    setFormData({ ...formData, type: value })
                                }
                            >
                                <SelectTrigger id="transaction-type" name="transaction-type">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="transaction-quantity">Quantity</Label>
                                <Input
                                    id="transaction-quantity"
                                    name="transaction-quantity"
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="transaction-unit-price">Unit Price</Label>
                                <Input
                                    id="transaction-unit-price"
                                    name="transaction-unit-price"
                                    type="number"
                                    step="0.01"
                                    readOnly
                                    className="bg-muted"
                                    value={selectedProduct ? selectedProduct.price.toFixed(2) : ""}
                                    placeholder="Select product first"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="transaction-total">Total Price</Label>
                                <Input
                                    id="transaction-total"
                                    name="transaction-total"
                                    type="number"
                                    step="0.01"
                                    value={formData.quantity && selectedProduct ? (Number(formData.quantity) * selectedProduct.price).toFixed(2) : ""}
                                    readOnly
                                    className="bg-muted"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="transaction-reference">Reference Number</Label>
                                <Input
                                    id="transaction-reference"
                                    name="transaction-reference"
                                    type="text"
                                    value={formData.referenceNumber}
                                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                                    placeholder="Optional reference number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="transaction-description">Description</Label>
                                <Input
                                    id="transaction-description"
                                    name="transaction-description"
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="transaction-notes">Notes</Label>
                            <Textarea
                                id="transaction-notes"
                                name="transaction-notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Optional notes..."
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => navigate("/dashboard/transactions")}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate}>Save Transaction</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

