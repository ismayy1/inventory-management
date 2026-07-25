import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import useSWR, { mutate } from "swr"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { purchaseOrderApi, type PurchaseOrder, type PurchaseOrderItem } from "@/lib/api"
import { ArrowLeft, PackageCheck, Loader2, FileDown, XCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { isInventoryManager, isUserAdmin } from "@/lib/utils"

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "outline",
    APPROVED: "default",
    RECEIVED: "secondary",
    CANCELLED: "destructive",
}

export default function ViewPurchaseOrderPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuth()
    const isAdmin = isUserAdmin(user)
    const isManager = isInventoryManager(user)
    // Only Inventory Managers can receive, cancel, and export; General Managers are read-only
    const canManagePurchaseOrder = isManager && !isAdmin

    const numericId = id ? Number(id) : NaN

    const { data: order, isLoading } = useSWR<PurchaseOrder>(
        Number.isFinite(numericId) ? ["purchase-order", numericId] : null,
        () => purchaseOrderApi.getById(numericId)
    )

    const [isReceiving, setIsReceiving] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    const handleReceive = async () => {
        if (!order) return
        if (!confirm("Mark this purchase order as received? This will update stock levels.")) return
        setIsReceiving(true)
        try {
            await purchaseOrderApi.receive(order.id)
            mutate(["purchase-order", numericId])
            mutate("purchase-orders")
            mutate("products")
            toast({ title: "Purchase order marked as received" })
        } catch (err: any) {
            toast({ title: err?.message || "Failed to receive order", variant: "destructive" })
        } finally {
            setIsReceiving(false)
        }
    }

    const handleCancel = async () => {
        if (!order) return
        if (!confirm("Cancel this purchase order? This action cannot be undone.")) return
        setIsCancelling(true)
        try {
            await purchaseOrderApi.cancel(order.id)
            mutate(["purchase-order", numericId])
            mutate("purchase-orders")
            toast({ title: "Purchase order cancelled" })
        } catch (err: any) {
            toast({ title: err?.message || "Failed to cancel order", variant: "destructive" })
        } finally {
            setIsCancelling(false)
        }
    }

    const itemTotal = (item: PurchaseOrderItem) =>
        item.totalPrice ?? item.quantity * item.unitPrice

    const exportPO = () => {
        if (!order) return
        const status = order.status === "DRAFT" ? "PENDING" : order.status
        const date = order.orderDate ? new Date(order.orderDate).toLocaleDateString()
            : order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"
        const delivery = order.expectedDeliveryDate
            ? new Date(order.expectedDeliveryDate).toLocaleDateString() : "—"
        const total = order.totalAmount != null
            ? `$${Number(order.totalAmount).toFixed(2)}`
            : order.items ? `$${order.items.reduce((s, i) => s + itemTotal(i), 0).toFixed(2)}` : "—"

        const itemRows = order.items?.map((it, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${it.productName || `Product #${it.productId}`}</td>
                <td style="text-align:right">${it.quantity}</td>
                <td style="text-align:right">$${Number(it.unitPrice).toFixed(2)}</td>
                <td style="text-align:right">$${Number(itemTotal(it)).toFixed(2)}</td>
            </tr>`).join("") ?? "<tr><td colspan='5'>No items</td></tr>"

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <title>Purchase Order ${order.poNumber || `PO-${order.id}`}</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 40px; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .sub { font-size: 18px; font-weight: 700; color: #555; margin-bottom: 20px; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; margin: 20px 0; }
            .meta div { display: flex; flex-direction: column; }
            .meta label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta span { font-weight: 600; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th { background: #f4f4f4; text-align: left; padding: 8px 10px; font-size: 12px; border-bottom: 2px solid #ddd; }
            td { padding: 7px 10px; border-bottom: 1px solid #eee; }
            .total-row td { font-weight: 700; background: #f9f9f9; border-top: 2px solid #ddd; }
            .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px;
                font-weight: 600; border: 1px solid #ccc; }
            @media print { body { margin: 20px; } }
        </style></head><body>
        <h1>Purchase Order</h1>
        <div class="sub">${order.poNumber || `PO-${order.id}`}</div>
        <div class="meta">
            <div><label>Supplier ID</label><span>${order.supplierId}</span></div>
            <div><label>Supplier</label><span>${order.supplierName || `Supplier #${order.supplierId}`}</span></div>
            <div><label>Order Date</label><span>${date}</span></div>
            <div><label>Expected Delivery</label><span>${delivery}</span></div>
            <div><label>Status</label><span><span class="badge">${status}</span></span></div>
            <div><label>Total Amount</label><span>${total}</span></div>
            ${order.notes ? `<div style="grid-column:1/-1"><label>Notes</label><span>${order.notes}</span></div>` : ""}
        </div>
        <table>
            <thead><tr>
                <th>#</th><th>Product</th>
                <th style="text-align:right">Qty</th>
                <th style="text-align:right">Unit Price</th>
                <th style="text-align:right">Subtotal</th>
            </tr></thead>
            <tbody>${itemRows}</tbody>
            <tfoot><tr class="total-row">
                <td colspan="4" style="text-align:right">Total</td>
                <td style="text-align:right">${total}</td>
            </tr></tfoot>
        </table>
        </body></html>`

        const iframe = document.createElement("iframe")
        iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0"
        document.body.appendChild(iframe)
        iframe.contentDocument!.open()
        iframe.contentDocument!.write(html)
        iframe.contentDocument!.close()
        iframe.contentWindow!.focus()
        setTimeout(() => {
            iframe.contentWindow!.print()
            setTimeout(() => document.body.removeChild(iframe), 1000)
        }, 300)
    }

    return (
        <div className="flex flex-col">
            <Header title="Purchase Order Details" description="View purchase order information" />

            <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Back button */}
                    <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/purchase-orders")} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Purchase Orders
                    </Button>

                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {!isLoading && !order && (
                        <p className="text-sm text-destructive">Purchase order not found.</p>
                    )}

                    {order && (
                        <>
                            {/* PO Summary Card */}
                            <Card className="border-border/50">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">
                                            {order.poNumber || `PO-${order.id}`}
                                        </CardTitle>
                                        <div className="flex items-center gap-3">
                                            <Badge variant={statusVariant[order.status === "DRAFT" ? "PENDING" : order.status] ?? "outline"} className="text-sm px-3 py-1">
                                                {order.status === "DRAFT" ? "PENDING" : order.status}
                                            </Badge>
                                            {/* Overdue indicator — shown when delivery date has passed and order not yet received */}
                                            {order.expectedDeliveryDate &&
                                             order.status !== "RECEIVED" &&
                                             order.status !== "CANCELLED" &&
                                             new Date(order.expectedDeliveryDate) < new Date() && (
                                                <Badge variant="destructive" className="text-sm px-3 py-1">
                                                    Overdue
                                                </Badge>
                                            )}
                                            {canManagePurchaseOrder && order.status !== "RECEIVED" && order.status !== "CANCELLED" && (
                                                <Button
                                                    onClick={handleReceive}
                                                    disabled={isReceiving}
                                                    className="gap-2"
                                                >
                                                    {isReceiving
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <PackageCheck className="h-4 w-4" />
                                                    }
                                                    Receive Order
                                                </Button>
                                            )}
                                            {canManagePurchaseOrder && order.status !== "RECEIVED" && order.status !== "CANCELLED" && (
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleCancel}
                                                    disabled={isCancelling}
                                                    className="gap-2"
                                                >
                                                    {isCancelling
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <XCircle className="h-4 w-4" />
                                                    }
                                                    Cancel Order
                                                </Button>
                                            )}
                                            {canManagePurchaseOrder && (
                                                <Button
                                                    variant="outline"
                                                    onClick={exportPO}
                                                    className="gap-2"
                                                >
                                                    <FileDown className="h-4 w-4" />
                                                    Export
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Supplier</Label>
                                            <p className="text-sm font-medium mt-1">
                                                {order.supplierName || `Supplier #${order.supplierId}`}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Order Date</Label>
                                            <p className="text-sm font-medium mt-1">
                                                {order.orderDate
                                                    ? new Date(order.orderDate).toLocaleDateString()
                                                    : order.createdAt
                                                    ? new Date(order.createdAt).toLocaleDateString()
                                                    : "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Expected Delivery</Label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className={`text-sm font-medium ${
                                                    order.expectedDeliveryDate &&
                                                    order.status !== "RECEIVED" &&
                                                    order.status !== "CANCELLED" &&
                                                    new Date(order.expectedDeliveryDate) < new Date()
                                                        ? "text-destructive"
                                                        : ""
                                                }`}>
                                                    {order.expectedDeliveryDate
                                                        ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                                                        : "—"}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Total Amount</Label>
                                            <p className="text-sm font-semibold mt-1 text-green-600">
                                                {order.totalAmount != null
                                                    ? `$${Number(order.totalAmount).toFixed(2)}`
                                                    : order.items
                                                    ? `$${order.items.reduce((s, i) => s + itemTotal(i), 0).toFixed(2)}`
                                                    : "—"}
                                            </p>
                                        </div>
                                        {order.createdBy && (
                                            <div>
                                                <Label className="text-xs text-muted-foreground">Created By</Label>
                                                <p className="text-sm font-medium mt-1">{order.createdBy}</p>
                                            </div>
                                        )}
                                        {order.notes && (
                                            <div className="col-span-2 md:col-span-4">
                                                <Label className="text-xs text-muted-foreground">Notes</Label>
                                                <p className="text-sm mt-1 text-muted-foreground">{order.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Line Items Card */}
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-base">Order Items</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {!order.items || order.items.length === 0 ? (
                                        <p className="text-sm text-muted-foreground p-6">No items found for this order.</p>
                                    ) : (
                                        <div className="rounded-md overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="px-4 py-3">#</TableHead>
                                                        <TableHead className="px-4 py-3">Product</TableHead>
                                                        <TableHead className="px-4 py-3 text-right">Quantity</TableHead>
                                                        <TableHead className="px-4 py-3 text-right">Unit Price</TableHead>
                                                        <TableHead className="px-4 py-3 text-right">Subtotal</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {order.items.map((item, i) => (
                                                        <TableRow key={item.id ?? i} className="hover:bg-muted/50">
                                                            <TableCell className="px-4 py-3 text-muted-foreground">{i + 1}</TableCell>
                                                            <TableCell className="px-4 py-3 font-medium">
                                                                {item.productName || `Product #${item.productId}`}
                                                            </TableCell>
                                                            <TableCell className="px-4 py-3 text-right">{item.quantity}</TableCell>
                                                            <TableCell className="px-4 py-3 text-right">
                                                                ${Number(item.unitPrice).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell className="px-4 py-3 text-right font-medium">
                                                                ${Number(itemTotal(item)).toFixed(2)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {/* Total row */}
                                                    <TableRow className="bg-muted/30 font-semibold">
                                                        <TableCell colSpan={4} className="px-4 py-3 text-right">
                                                            Total
                                                        </TableCell>
                                                        <TableCell className="px-4 py-3 text-right text-green-600">
                                                            ${order.items.reduce((s, i) => s + itemTotal(i), 0).toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
