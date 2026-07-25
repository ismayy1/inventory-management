import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { DataTable, type Column } from "@/components/dashboard/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { stockAdjustmentApi, productApi, type StockAdjustment, type Product } from "@/lib/api"
import { ArrowUp, ArrowDown, Search, Filter, DollarSign } from "lucide-react"
import { cva } from "class-variance-authority"
import { cn, isUserAdmin, isInventoryManager } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

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

export default function AdjustmentsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = isUserAdmin(user)
  const isManager = isInventoryManager(user)
  const canEdit = isManager && !isAdmin
  const { data: adjustments, isLoading } = useSWR<StockAdjustment[]>("adjustments", stockAdjustmentApi.getAll)
  const { data: products } = useSWR("products", productApi.getAll)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"ALL" | "INCREMENT" | "DECREMENT">("ALL")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const productMap = useMemo(() => {
    if (!products) return new Map<number, string>()
    return new Map(products.map((p: Product) => [p.id, p.name]))
  }, [products])

  const filteredAdjustments = useMemo(() => {
    if (!adjustments) return []

    let filtered = adjustments

    if (filterType !== "ALL") {
      filtered = filtered.filter((adj) => adj.adjustmentType === filterType)
    }

    if (!searchTerm.trim()) return filtered

    const searchLower = searchTerm.toLowerCase()
    return filtered.filter((adj) => {
      const productName = String(adj.productName || productMap.get(adj.productId || 0) || "")
      return (
        productName.toLowerCase().includes(searchLower) ||
        adj.reason?.toLowerCase().includes(searchLower) ||
        adj.adjustedBy?.toLowerCase().includes(searchLower) ||
        adj.adjustmentType.toLowerCase().includes(searchLower) ||
        adj.notes?.toLowerCase().includes(searchLower) ||
        adj.id.toString().includes(searchLower) ||
        adj.adjustmentQuantity?.toString().includes(searchLower) ||
        adj.previousStock?.toString().includes(searchLower) ||
        adj.newStock?.toString().includes(searchLower) ||
        adj.unitPrice?.toString().includes(searchLower) ||
        (adj as any).unit_price?.toString().includes(searchLower) ||
        (adj.adjustedAt && new Date(adj.adjustedAt).toLocaleDateString().includes(searchLower))
      )
    })
  }, [adjustments, searchTerm, productMap, filterType])

  const paginatedAdjustments = useMemo(() => {
    const startIndex = currentPage * pageSize
    return filteredAdjustments.slice(startIndex, startIndex + pageSize)
  }, [filteredAdjustments, currentPage, pageSize])

  const totalPages = Math.ceil(filteredAdjustments.length / pageSize)

  const columns: Column<StockAdjustment>[] = [
    {
      key: "productName",
      label: "Product",
      render: (item) => {
        if (item.productId) {
          return item.productName || productMap.get(item.productId) || `Product #${item.productId}`
        }
        return "—"
      },
    },
    {
      key: "adjustmentType",
      label: "Type",
      render: (item) => <AdjustmentBadge type={item.adjustmentType} />,
    },
    {
      key: "unitPrice",
      label: "Unit Price",
      render: (item) => {
        // Get the product to show its current price
        const product = products?.find((p: Product) => p.id === item.productId)
        if (product?.price != null) {
          return `$${Number(product.price).toFixed(2)}`
        }
        // Fallback to adjustment's unit price if product not found
        const val = item.unitPrice ?? (item as any).unit_price
        return val != null ? `$${Number(val).toFixed(2)}` : "—"
      },
    },
    {
      key: "adjustmentQuantity",
      label: "Adjustment Qty",
      render: (item) => item.adjustmentQuantity ?? "—",
    },
    {
      key: "previousStock",
      label: "Previous Stock",
      render: (item) => item.previousStock ?? "—",
    },
    {
      key: "newStock",
      label: "New Stock",
      render: (item) => item.newStock ?? "—",
    },
    {
      key: "reason",
      label: "Reason",
      render: (item) => item.reason || "—",
    },
    {
      key: "adjustedBy",
      label: "Adjusted By",
      render: (item) => item.adjustedBy || "—",
    },
    {
      key: "adjustedAt",
      label: "Date",
      render: (item) => {
        if (item.adjustedAt) {
          const date = new Date(item.adjustedAt)
          if (!isNaN(date.getTime())) return date.toLocaleString()
        }
        return "—"
      },
    },
    {
      key: "notes",
      label: "Notes",
      render: (item) => item.notes ?? "—",
    },
    ...(canEdit ? [{
      key: "actions" as const,
      label: "Actions",
      render: (item: StockAdjustment) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/dashboard/adjustments/${item.id}/revaluate`)}
          className="flex items-center gap-1"
        >
          <DollarSign className="h-3 w-3" />
          Revaluation
        </Button>
      ),
    }] : []),
  ]

  return (
    <div className="flex flex-col">
      <Header title="Stock Adjustments" description="Track inventory adjustments" />

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
              id="adjustments-search"
              name="adjustments-search"
              type="search"
              placeholder="Search adjustments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          <div className="flex items-center gap-2 relative z-50">
            <Select
              value={filterType}
              onValueChange={(v) => setFilterType(v as "ALL" | "INCREMENT" | "DECREMENT")}
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
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="INCREMENT">Increment</SelectItem>
                <SelectItem value="DECREMENT">Decrement</SelectItem>
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
                onClick={() => navigate("/dashboard/adjustments/new")}
              >
                New Adjustment
              </Button>
            )}
          </div>
        </div>

        {filteredAdjustments.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {Math.min((currentPage * pageSize) + 1, filteredAdjustments.length)} to {Math.min((currentPage + 1) * pageSize, filteredAdjustments.length)} of {filteredAdjustments.length} entries
            </div>
            <div>
              Page {currentPage + 1} of {totalPages || 1}
            </div>
          </div>
        )}

        <div className="rounded-lg border bg-card">
          <DataTable
            columns={columns}
            data={paginatedAdjustments}
            page={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            emptyMessage={isLoading ? "Loading..." : "No adjustments found"}
          />
        </div>
      </div>
    </div>
  )
}
