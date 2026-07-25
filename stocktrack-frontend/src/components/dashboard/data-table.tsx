import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Column<T> {
    key: keyof T | string
    label: string
    render?: (item: T) => React.ReactNode
    width?: string
}

export interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
    columns: Column<T>[]
    data: T[]
    page?: number
    totalPages?: number
    pageSize?: number
    onPageChange?: (page: number) => void
    emptyMessage?: string
    maxRows?: number
    indexColumnWidth?: string
}

type DataTableComponent = <T extends { id: string | number }>(
    props: DataTableProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement | null

const DataTableBase = <T extends { id: string | number }>(
    {
        columns,
        data,
        page,
        totalPages,
        pageSize,
        onPageChange,
        emptyMessage = "No data found",
        maxRows,
        indexColumnWidth = "64px",
        className,
        ...props
    }: DataTableProps<T>,
    ref: React.Ref<HTMLDivElement>
) => {
    const startIndex = page !== undefined && pageSize !== undefined ? page * pageSize : 0
    
    // Calculate max height based on maxRows (each row is approximately 49px)
    const maxHeight = maxRows ? `${maxRows * 49}px` : 'calc(100vh-280px)'
    
    return (
        <div ref={ref} className={cn("rounded-md border border-border overflow-hidden", className)} {...props}>
            <div className="overflow-auto" style={{ maxHeight }}>
                <Table className="w-full border-collapse">
                    <TableHeader className="sticky top-0 z-10 bg-card border-b border-border">
                        <TableRow>
                            <TableHead 
                                className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground border-b"
                                style={{ width: indexColumnWidth }}
                            >
                                #
                            </TableHead>
                            {columns.map((column) => (
                                <TableHead
                                    key={String(column.key)}
                                    className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground border-b"
                                    style={column.width ? { width: column.width } : undefined}
                                >
                                    {column.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + 1}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => (
                                <TableRow
                                    key={`row-${item.id}-${index}`}
                                    className="hover:bg-muted/50 transition-colors"
                                >
                                    <TableCell 
                                        className="px-4 py-3 text-sm border-b text-muted-foreground font-medium"
                                        style={{ width: indexColumnWidth }}
                                    >
                                        {startIndex + index + 1}
                                    </TableCell>
                                    {columns.map((column) => (
                                        <TableCell
                                            key={String(column.key)}
                                            className="px-4 py-3 text-sm border-b"
                                            style={column.width ? { width: column.width } : undefined}
                                        >
                                            {column.render
                                                ? column.render(item)
                                                : String((item as Record<string, unknown>)[column.key as string] ?? "")}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {page !== undefined && totalPages !== undefined && totalPages > 1 && (
                <div className="data-table mt-2 flex items-center justify-between rounded-xl border border-border bg-card p-2 shadow-sm">
                    <p className="text-sm text-muted-foreground">
                        Page {page + 1} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onPageChange?.(page - 1)} disabled={page === 0}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(page + 1)}
                            disabled={page >= totalPages - 1}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

const DataTableWithRef = React.forwardRef(DataTableBase) as DataTableComponent & { displayName?: string }

DataTableWithRef.displayName = "DataTable"

export { DataTableWithRef as DataTable }



