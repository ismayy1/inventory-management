import { useMemo, useState } from "react"
import useSWR, { mutate } from "swr"
import { useNavigate } from "react-router-dom"

import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supplierApi, type Supplier } from "@/lib/api"
import { Search, Pencil, Trash2, Filter } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { isUserAdmin, isInventoryManager } from "@/lib/utils"

export default function SuppliersPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = isUserAdmin(user)
    const isManager = isInventoryManager(user)
    // Both General Manager and Inventory Manager can manage suppliers
    const canEdit = isAdmin || isManager
    const { toast } = useToast()

    const { data: suppliers, isLoading } = useSWR<Supplier[]>("suppliers", () =>
        supplierApi.getAll()
    )

    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize, setPageSize] = useState(20)

    const filteredSuppliers = useMemo(() => {
        if (!suppliers) return []

        const q = searchTerm.trim().toLowerCase()

        return suppliers.filter((s) => {
            const matchesSearch =
                !q ||
                s.name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q) ||
                s.phone?.toLowerCase().includes(q) ||
                s.address?.toLowerCase().includes(q) ||
                s.id.toString().includes(q)

            const isActive = Boolean(s.active)

            const matchesStatus =
                filterStatus === "ALL" ||
                (filterStatus === "ACTIVE" && isActive) ||
                (filterStatus === "INACTIVE" && !isActive)

            return matchesSearch && matchesStatus
        })
    }, [suppliers, searchTerm, filterStatus])

    const paginatedSuppliers = useMemo(() => {
        const startIndex = currentPage * pageSize
        return filteredSuppliers.slice(startIndex, startIndex + pageSize)
    }, [filteredSuppliers, currentPage, pageSize])

    const totalPages = Math.ceil(filteredSuppliers.length / pageSize)

    const openEdit = (supplier: Supplier) => {
        navigate(`/dashboard/suppliers/${supplier.id}/edit`)
    }

    const handleDeactivate = async (supplier: Supplier) => {
        const isActive = Boolean(supplier.active)
        const action = isActive ? "deactivate" : "activate"

        if (!confirm(`Are you sure you want to ${action} this supplier?`)) return

        try {
            mutate(
                "suppliers",
                suppliers?.map((s: Supplier) =>
                    s.id === supplier.id ? { ...s, active: !isActive } : s
                ),
                false
            )

            await supplierApi.update(supplier.id, {
                ...supplier,
                active: !isActive,
            })

            await mutate("suppliers")

            toast({ title: `Supplier ${action}d successfully` })
        } catch (err: any) {
            await mutate("suppliers")

            const msg = err?.message || `Failed to ${action} supplier`
            toast({ title: msg, variant: "destructive" })
        }
    }

    const columns = [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "address", label: "Address" },
        {
            key: "url",
            label: "Website",
            render: (item: Supplier) => {
                const link = item.url || item.website
                if (!link) return <span className="text-muted-foreground">-</span>
                const href = link.startsWith("http") ? link : `https://${link}`
                return (
                    <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
                        {link}
                    </a>
                )
            },
        },
        {
            key: "active",
            label: "Status",
            render: (item: Supplier) => {
                const isActive = Boolean(item.active)

                return (
                    <Badge
                        className={
                            isActive
                                ? "bg-emerald-600 text-white"
                                : "bg-muted text-muted-foreground"
                        }
                    >
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                )
            },
        },
        {
            key: "actions",
            label: "Actions",
            render: (item: Supplier) => {
                const isActive = Boolean(item.active)

                return (
                    <div className="flex items-center gap-3">
                        {canEdit && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-muted"
                                    onClick={() => openEdit(item)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-muted"
                                    onClick={() => handleDeactivate(item)}
                                    title={isActive ? "Deactivate supplier" : "Activate supplier"}
                                >
                                    <Trash2
                                        className={`h-4 w-4 ${
                                            isActive
                                                ? "text-destructive"
                                                : "text-emerald-600"
                                        }`}
                                    />
                                </Button>
                            </>
                        )}
                    </div>
                )
            },
        },
    ]

    return (
        <div className="flex flex-col">
            <Header title="Suppliers" description="Manage your suppliers" />

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
                            id="suppliers-search"
                            name="suppliers-search"
                            type="search"
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                        />
                    </div>

                    <div className="flex items-center gap-2 relative z-50">
                        <Select
                            value={filterStatus}
                            onValueChange={(v) =>
                                setFilterStatus(v as "ALL" | "ACTIVE" | "INACTIVE")
                            }
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
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
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
                                onClick={() => navigate("/dashboard/suppliers/new")}
                                className=""
                            >
                                Add Supplier
                            </Button>
                        )}
                    </div>
                </div>

                {filteredSuppliers.length > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            Showing {Math.min((currentPage * pageSize) + 1, filteredSuppliers.length)} to {Math.min((currentPage + 1) * pageSize, filteredSuppliers.length)} of {filteredSuppliers.length} entries
                        </div>
                        <div>
                            Page {currentPage + 1} of {totalPages || 1}
                        </div>
                    </div>
                )}

                <div className="rounded-lg border bg-card">
                    <DataTable
                        columns={columns}
                        data={paginatedSuppliers}
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        emptyMessage={isLoading ? "Loading..." : "No suppliers found"}
                    />
                </div>
            </div>
        </div>
    )
}
