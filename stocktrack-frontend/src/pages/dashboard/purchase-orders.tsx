import { useState, useMemo, useEffect } from "react"
import useSWR from "swr"
import { useNavigate } from "react-router-dom"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { purchaseOrderApi, supplierApi, type PurchaseOrder, type Supplier } from "@/lib/api"
import { Search, Eye, Plus, FileDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { isInventoryManager, isUserAdmin } from "@/lib/utils"

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "outline",
    APPROVED: "default",
    RECEIVED: "secondary",
    CANCELLED: "destructive",
}

export default function PurchaseOrdersPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = isUserAdmin(user)
    const isManager = isInventoryManager(user)
    // Only Inventory Managers can create POs and export; General Managers (admins) are read-only
    const canCreate = isManager && !isAdmin

    const { data: orders, isLoading } = useSWR("purchase-orders", purchaseOrderApi.getAll)
    const { data: suppliers } = useSWR("suppliers", supplierApi.getAll)

    // Build a supplierId → supplier map for fast lookup
    const supplierMap = useMemo(() => {
        const map = new Map<number, Supplier>()
        suppliers?.forEach((s: Supplier) => map.set(s.id, s))
        return map
    }, [suppliers])

    const printPO = async (item: PurchaseOrder) => {
        // Fetch full details so we have the items array
        let fullOrder: PurchaseOrder = item
        try {
            const fetched = await purchaseOrderApi.getById(item.id)
            if (fetched) fullOrder = fetched
        } catch {
            // fall back to what we have in the list
        }

        const supplierName = fullOrder.supplierName || supplierMap.get(fullOrder.supplierId)?.name || `Supplier #${fullOrder.supplierId}`
        const status = fullOrder.status === "DRAFT" ? "PENDING" : fullOrder.status
        const date = fullOrder.orderDate ? new Date(fullOrder.orderDate).toLocaleDateString()
            : fullOrder.createdAt ? new Date(fullOrder.createdAt).toLocaleDateString() : "—"
        const delivery = fullOrder.expectedDeliveryDate ? new Date(fullOrder.expectedDeliveryDate).toLocaleDateString() : "—"
        const itemTotal = (it: { totalPrice?: number; quantity: number; unitPrice: number }) =>
            it.totalPrice ?? it.quantity * it.unitPrice
        const total = fullOrder.totalAmount != null
            ? `$${Number(fullOrder.totalAmount).toFixed(2)}`
            : fullOrder.items ? `$${fullOrder.items.reduce((s, i) => s + itemTotal(i), 0).toFixed(2)}` : "—"

        const itemRows = fullOrder.items?.map((it, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${it.productName || `Product #${it.productId}`}</td>
                <td style="text-align:right">${it.quantity}</td>
                <td style="text-align:right">$${Number(it.unitPrice).toFixed(2)}</td>
                <td style="text-align:right">$${Number(itemTotal(it)).toFixed(2)}</td>
            </tr>
        `).join("") ?? "<tr><td colspan='5'>No items</td></tr>"

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <title>Purchase Order ${fullOrder.poNumber || `PO-${fullOrder.id}`}</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 13px; color: #111; margin: 40px; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; margin: 20px 0; }
            .meta div { display: flex; flex-direction: column; }
            .meta label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta span { font-weight: 600; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th { background: #f4f4f4; text-align: left; padding: 8px 10px; font-size: 12px; border-bottom: 2px solid #ddd; }
            td { padding: 7px 10px; border-bottom: 1px solid #eee; }
            tr:last-child td { border-bottom: none; }
            .total-row td { font-weight: 700; background: #f9f9f9; border-top: 2px solid #ddd; }
            .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
                border: 1px solid #ccc; background: #fff; }
            @media print { body { margin: 20px; } }
        </style></head><body>
        <h1>Purchase Order</h1>
        <div style="font-size:18px; font-weight:700; color:#555; margin-bottom:16px">
            ${fullOrder.poNumber || `PO-${fullOrder.id}`}
        </div>
        <div class="meta">
            <div><label>Supplier ID</label><span>${fullOrder.supplierId}</span></div>
            <div><label>Supplier</label><span>${supplierName}</span></div>
            <div><label>Order Date</label><span>${date}</span></div>
            <div><label>Expected Delivery</label><span>${delivery}</span></div>
            <div><label>Status</label><span><span class="badge">${status}</span></span></div>
            <div><label>Total Amount</label><span>${total}</span></div>
            ${fullOrder.notes ? `<div style="grid-column:1/-1"><label>Notes</label><span>${fullOrder.notes}</span></div>` : ""}
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

    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(20)
    const [anyDropdownOpen, setAnyDropdownOpen] = useState(false)

    useEffect(() => {
        const app = document.getElementById("root") as HTMLElement | null
        if (!app) return
        app.style.transition = "filter 0.15s ease"
        app.style.filter = anyDropdownOpen ? "blur(4px)" : ""
        return () => { app.style.filter = "" }
    }, [anyDropdownOpen])

    const filtered = useMemo(() => {
        if (!orders) return []
        return orders.filter((o: PurchaseOrder) => {
            const q = searchTerm.toLowerCase()
            // Normalize DRAFT to PENDING for consistent filtering
            const normalizedStatus = o.status === "DRAFT" ? "PENDING" : o.status
            const matchesSearch = !searchTerm.trim() || (
                o.poNumber?.toLowerCase().includes(q) ||
                o.supplierName?.toLowerCase().includes(q) ||
                normalizedStatus?.toLowerCase().includes(q) ||
                o.id.toString().includes(q)
            )
            const matchesStatus = statusFilter === "ALL" || normalizedStatus === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [orders, searchTerm, statusFilter])

    const paginated = useMemo(() => {
        return filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    }, [filtered, currentPage, pageSize])

    const totalPages = Math.ceil(filtered.length / pageSize)

    const columns = [
        {
            key: "poNumber",
            label: "PO Number",
            render: (item: PurchaseOrder) => item.poNumber || `PO-${item.id}`,
        },
        {
            key: "supplierId",
            label: "Supplier ID",
            render: (item: PurchaseOrder) => item.supplierId,
        },
        {
            key: "supplierName",
            label: "Supplier",
            render: (item: PurchaseOrder) => {
                if (item.supplierName) return item.supplierName
                const s = supplierMap.get(item.supplierId)
                return s ? s.name : `Supplier #${item.supplierId}`
            },
        },
        {
            key: "orderDate",
            label: "Date",
            render: (item: PurchaseOrder) =>
                item.orderDate ? new Date(item.orderDate).toLocaleDateString()
                : item.createdAt ? new Date(item.createdAt).toLocaleDateString()
                : "—",
        },
        {
            key: "status",
            label: "Status",
            render: (item: PurchaseOrder) => {
                const status = item.status === "DRAFT" ? "PENDING" : item.status
                const isOverdue =
                    item.expectedDeliveryDate &&
                    status !== "RECEIVED" &&
                    status !== "CANCELLED" &&
                    new Date(item.expectedDeliveryDate) < new Date()
                return (
                    <div className="flex items-center gap-1.5">
                        <Badge variant={statusVariant[status] ?? "outline"}>
                            {status}
                        </Badge>
                        {isOverdue && (
                            <Badge variant="destructive">Overdue</Badge>
                        )}
                    </div>
                )
            },
        },
        {
            key: "totalAmount",
            label: "Total Amount",
            render: (item: PurchaseOrder) =>
                item.totalAmount != null ? `$${Number(item.totalAmount).toFixed(2)}` : "—",
        },
        {
            key: "actions",
            label: "Actions",
            render: (item: PurchaseOrder) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-muted"
                        title="View details"
                        onClick={() => navigate(`/dashboard/purchase-orders/${item.id}`)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {canCreate && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-muted"
                            title="Download as PDF"
                            onClick={() => printPO(item)}
                        >
                            <FileDown className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ]

    return (
        <div className="flex flex-col">
            <Header title="Purchase Orders" description="Manage supplier purchase orders" />

            <div className="flex-1 space-y-4 p-6">
                <div className="flex items-center justify-between gap-4 border-b pb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                            <Input
                                type="search"
                                placeholder="Search purchase orders..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="flex-1 min-w-0"
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter} onOpenChange={setAnyDropdownOpen}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="RECEIVED">Received</SelectItem>
                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm text-muted-foreground">Show:</span>
                            <Select value={pageSize.toString()} onValueChange={v => { setPageSize(parseInt(v)); setCurrentPage(0) }} onOpenChange={setAnyDropdownOpen}>
                                <SelectTrigger className="w-[80px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {canCreate && (
                        <Button onClick={() => navigate("/dashboard/purchase-orders/new")} className="shrink-0">
                            <Plus className="h-4 w-4 mr-2" /> New PO
                        </Button>
                    )}
                </div>

                {filtered.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            Showing {Math.min(currentPage * pageSize + 1, filtered.length)} to {Math.min((currentPage + 1) * pageSize, filtered.length)} of {filtered.length} entries
                        </div>
                        <div>Page {currentPage + 1} of {totalPages || 1}</div>
                    </div>
                )}

                <div className="rounded-lg border bg-card">
                    <DataTable
                        columns={columns}
                        data={paginated}
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        emptyMessage={isLoading ? "Loading..." : "No purchase orders found"}
                    />
                </div>
            </div>
        </div>
    )
}
