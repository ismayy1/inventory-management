import { useState } from "react"
import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { auditLogApi, type AuditLog } from "@/lib/api"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Download, Loader2 } from "lucide-react"

const actionTypes = [
    "USER_LOGIN",
    "USER_LOGOUT",
    "PRODUCT_CREATE",
    "PRODUCT_UPDATE",
    "PRODUCT_DELETE",
    "SUPPLIER_CREATE",
    "SUPPLIER_UPDATE",
    "SUPPLIER_DELETE",
    "STOCK_ADJUSTMENT",
    "TRANSACTION_CREATE",
]

const actionBadgeVariants = cva(
    "px-2 py-1 rounded text-xs font-medium",
    {
        variants: {
            type: {
                destructive: "bg-red-100 text-red-800",
                default: "bg-green-100 text-green-800",
                secondary: "bg-blue-100 text-blue-800",
                outline: "border border-gray-300 text-gray-700",
            },
        },
        defaultVariants: { type: "default" },
    }
)

const ActionBadge = ({ action }: { action: string }) => {
    let type: "default" | "destructive" | "secondary" | "outline" = "default"

    if (action.includes("DELETE")) type = "destructive"
    else if (action.includes("UPDATE")) type = "secondary"
    else if (action.includes("LOGIN")) type = "outline"

    return (
        <Badge className={cn(actionBadgeVariants({ type }))}>
            {action}
        </Badge>
    )
}

export default function AuditLogsPage() {
    const [page, setPage] = useState(0)
    const [pageSize, setPageSize] = useState(20)
    const [filterAction, setFilterAction] = useState("ALL")
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const { data, isLoading } = useSWR(
        filterAction === "ALL"
            ? ["audit-logs", page, pageSize]
            : ["audit-logs-action", filterAction, page, pageSize],
        () =>
            filterAction === "ALL"
                ? auditLogApi.getAll(page, pageSize)
                : auditLogApi.getByAction(filterAction, page, pageSize)
    )

    const handleExportCSV = async () => {
        setIsExporting(true)
        try {
            // Fetch all records (up to 10 000) for export
            const result = filterAction === "ALL"
                ? await auditLogApi.getAll(0, 10000)
                : await auditLogApi.getByAction(filterAction, 0, 10000)

            const rows = result?.content || []
            if (rows.length === 0) return

            const headers = ["ID", "User", "Action", "Details", "IP Address", "Timestamp"]
            const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`
            const csv = [
                headers.join(","),
                ...rows.map((r: AuditLog) => [
                    escape(r.id),
                    escape(r.username),
                    escape(r.action),
                    escape(r.details),
                    escape(r.ipAddress),
                    escape(new Date(r.createdAt).toLocaleString()),
                ].join(",")),
            ].join("\n")

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            // silently fail — user can retry
        } finally {
            setIsExporting(false)
        }
    }

    const columns = [
        { key: "username", label: "User" },
        {
            key: "action",
            label: "Action",
            render: (item: AuditLog) => (
                <ActionBadge action={item.action} />
            ),
        },
        { key: "details", label: "Details" },
        { key: "ipAddress", label: "IP Address" },
        {
            key: "createdAt",
            label: "Timestamp",
            render: (item: AuditLog) =>
                new Date(item.createdAt).toLocaleString(),
        },
    ]

    return (
        <div className="flex flex-col">
            <Header
                title="Audit Logs"
                description="System activity and user actions"
            />

            <div className="flex-1 space-y-6 p-6">
                {isFilterOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={() => setIsFilterOpen(false)}
                    />
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
                    <div className="flex items-center gap-4 relative z-50">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Filter:</span>
                            <Select
                                value={filterAction}
                                onValueChange={(v) => {
                                    setFilterAction(v)
                                    setPage(0)
                                }}
                                onOpenChange={setIsFilterOpen}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="All Actions" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="ALL">All Actions</SelectItem>
                                    {actionTypes.map((action) => (
                                        <SelectItem key={action} value={action}>
                                            {action.replace(/_/g, " ")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Show:</span>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(v) => {
                                    setPageSize(parseInt(v))
                                    setPage(0)
                                }}
                            >
                                <SelectTrigger className="w-[80px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                    <SelectItem value="150">150</SelectItem>
                                    <SelectItem value="200">200</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={isExporting || isLoading}
                        className="gap-2 shrink-0"
                    >
                        {isExporting
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Download className="h-4 w-4" />
                        }
                        Export CSV
                    </Button>
                </div>

                {data && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            Showing {Math.min((page * pageSize) + 1, data.totalElements)} to {Math.min((page + 1) * pageSize, data.totalElements)} of {data.totalElements} entries
                        </div>
                        <div>
                            Page {page + 1} of {data.totalPages || 1}
                        </div>
                    </div>
                )}

                <DataTable
                    columns={columns}
                    data={data?.content || []}
                    page={page}
                    totalPages={data?.totalPages || 0}
                    onPageChange={setPage}
                    emptyMessage={isLoading ? "Loading..." : "No audit logs found"}
                />
            </div>
        </div>
    )
}
