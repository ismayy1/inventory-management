import { useState, useMemo } from "react"
import useSWR from "swr"
import { useNavigate } from "react-router-dom"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { transactionApi, type Transaction } from "@/lib/api"
import { Search, Filter } from "lucide-react"
import { isUserAdmin, isInventoryManager } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

const transactionTypes = [
    "PURCHASE",
    "SALE",
    "RETURN",
    "ADJUSTMENT",
    "TRANSFER",
    "DAMAGED",
    "EXPIRED",
] as const

const transactionTypeLabels: Record<string, string> = {
    PURCHASE: "Purchase",
    SALE: "Sale",
    RETURN: "Return",
    ADJUSTMENT: "Adjustment",
    TRANSFER: "Transfer",
    DAMAGED: "Damaged",
    EXPIRED: "Expired",
}

export default function TransactionsPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = isUserAdmin(user)
    const isManager = isInventoryManager(user)
    const canEdit = isManager && !isAdmin
    const { data: transactions, isLoading } = useSWR(
        "transactions",
        transactionApi.getAll
    )

    const [filterType, setFilterType] = useState<string>("ALL")
    const [searchTerm, setSearchTerm] = useState("")
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(20)

    const filteredTransactions = useMemo(() => {
        if (!transactions) return []

        let filtered = transactions

        if (filterType !== "ALL") {
            filtered = filtered.filter((t) => t.type === filterType)
        }

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase()
            filtered = filtered.filter(
                (t) =>
                    t.productName?.toLowerCase().includes(q) ||
                    t.type?.toLowerCase().includes(q) ||
                    t.createdBy?.toLowerCase().includes(q) ||
                    t.notes?.toLowerCase().includes(q) ||
                    t.id.toString().includes(q) ||
                    t.quantity.toString().includes(q) ||
                    t.unitPrice?.toString().includes(q) ||
                    t.totalPrice?.toString().includes(q) ||
                    new Date(t.createdAt).toLocaleDateString().includes(q)
            )
        }

        return filtered
    }, [transactions, filterType, searchTerm])

    const paginatedTransactions = useMemo(() => {
        const startIndex = currentPage * pageSize
        return filteredTransactions.slice(startIndex, startIndex + pageSize)
    }, [filteredTransactions, currentPage, pageSize])

    const totalPages = Math.ceil(filteredTransactions.length / pageSize)

    const getTypeBadgeVariant = (type: string) => {
        switch (type) {
            case "PURCHASE":
                return "default"
            case "SALE":
                return "secondary"
            case "RETURN":
            case "DAMAGED":
            case "EXPIRED":
                return "destructive"
            case "ADJUSTMENT":
            case "TRANSFER":
                return "outline"
            default:
                return "default"
        }
    }

    const columns = [
        { key: "productName", label: "Product" },
        {
            key: "type",
            label: "Type",
            render: (item: Transaction) => {
                const transactionType = (item.type || (item as any).transactionType || "UNKNOWN") as string
                const type = transactionType.toUpperCase()
                const displayLabel = transactionTypeLabels[type] || type

                return (
                    <Badge variant={getTypeBadgeVariant(type)}>
                        {displayLabel}
                    </Badge>
                )
            },
        },
        { key: "quantity", label: "Quantity" },
        {
            key: "unitPrice",
            label: "Unit Price",
            render: (item: Transaction) => {
                const val = item.unitPrice ?? (item as any).unit_price ?? 0
                return `$${Number(val).toFixed(2)}`
            },
        },
        {
            key: "totalPrice",
            label: "Total",
            render: (item: Transaction) => {
                // Try to get totalPrice from different possible field names
                let total = item.totalPrice ?? (item as any).total_price ?? (item as any).totalAmount
                
                // If totalPrice is not available or is 0, calculate it from quantity * unitPrice
                if (total == null || total === 0) {
                    const quantity = item.quantity ?? 0
                    const unitPrice = item.unitPrice ?? (item as any).unit_price ?? 0
                    total = quantity * unitPrice
                }
                
                return `$${Number(total).toFixed(2)}`
            },
        },
        { key: "createdBy", label: "Created By" },
        {
            key: "referenceNumber",
            label: "Reference No.",
            render: (item: Transaction) => item.referenceNumber || "—",
        },
        {
            key: "description",
            label: "Description",
            render: (item: Transaction) => item.description || "—",
        },
        {
            key: "createdAt",
            label: "Date",
            render: (item: Transaction) =>
                new Date(item.createdAt).toLocaleString(),
        },
    ]

    return (
        <div className="flex flex-col">
            <Header
                title="Transactions"
                description="Track inventory transactions"
            />

            <div className="flex-1 space-y-4 p-6">
                {isFilterOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={() => setIsFilterOpen(false)}
                    />
                )}

                <div className="flex items-center justify-between gap-4 border-b pb-4">
                    <div className="hidden md:flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            id="transactions-search"
                            name="transactions-search"
                            type="search"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                        />
                    </div>

                    <div className="flex items-center gap-2 relative z-50">
                        <Select
                            value={filterType}
                            onValueChange={setFilterType}
                            onOpenChange={setIsFilterOpen}
                        >
                            <SelectTrigger
                                className="
                                    w-10 h-10 p-0
                                    flex items-center justify-center
                                    bg-popover border border-border shadow-sm
                                    [&>svg:last-child]:hidden
                                "
                            >
                                <Filter className="h-4 w-4 text-muted-foreground" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                {transactionTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {transactionTypeLabels[type]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Show:</span>
                            <Select
                                value={pageSize.toString()}
                                onValueChange={(v) => {
                                    setPageSize(parseInt(v))
                                    setCurrentPage(0)
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

                        {canEdit && (
                          <Button
                              onClick={() => navigate("/dashboard/transactions/new")}
                          >
                              New Transaction
                          </Button>
                        )}
                    </div>
                </div>

                {filteredTransactions.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            Showing {Math.min((currentPage * pageSize) + 1, filteredTransactions.length)} to {Math.min((currentPage + 1) * pageSize, filteredTransactions.length)} of {filteredTransactions.length} entries
                        </div>
                        <div>
                            Page {currentPage + 1} of {totalPages || 1}
                        </div>
                    </div>
                )}

                <div className="rounded-lg border bg-card">
                    <DataTable
                        columns={columns}
                        data={paginatedTransactions}
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        emptyMessage={isLoading ? "Loading..." : "No transactions found"}
                    />
                </div>
            </div>
        </div>
    )
}


