import { useState } from "react"
import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { backupApi, type BackupInfo } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isUserAdmin } from "@/lib/utils"
import {
    Database,
    HardDrive,
    RotateCcw,
    Trash2,
    Loader2,
    Shield,
    Download,
} from "lucide-react"

// Resolve filename from any possible field name the backend may use
function resolveFilename(backup: BackupInfo): string {
    return (
        backup.filename ||
        backup.fileName ||
        backup.name ||
        backup.file ||
        // last resort: find any string field that looks like a filename
        Object.values(backup).find(
            (v) => typeof v === "string" && (v.includes(".sql") || v.includes(".zip") || v.includes(".bak") || v.includes("backup"))
        ) ||
        "Unknown"
    )
}

// Resolve size in bytes from any possible field name
// function resolveSize(backup: BackupInfo): number | undefined {
//     const raw =
//         backup.size ??
//         backup.fileSize ??
//         backup.sizeInBytes ??
//         backup.fileSizeBytes ??
//         backup.bytes ??
//         null

//     if (raw == null) return undefined
//     return Number(raw)
// }


// function _resolveSize(backup: BackupInfo): string {
//     return (
//         backup.sizeHumanReadable ??
//         backup.size ??
//         backup.fileSize ??
//         backup.sizeInBytes?.toString() ??
//         backup.fileSizeBytes?.toString() ??
//         backup.bytes?.toString() ??
//         "Unknown"
//     )
// }

// Resolve creation date from any possible field name
function resolveDate(backup: BackupInfo): string | undefined {
    return (
        backup.createdAt ||
        backup.createdDate ||
        backup.lastModified ||
        backup.modifiedAt ||
        backup.date ||
        backup.timestamp ||
        undefined
    )
}

function formatFileSize(bytes?: number): string {
    if (bytes == null || isNaN(bytes)) return "—"
    if (bytes === 0) return "0 B"
    if (bytes < 1) return `0.${String(bytes).split(".")[1] ?? "0"} B`
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb < 1 ? "0" + kb.toFixed(1).replace(/^0/, "") : kb.toFixed(1)} KB`
    const mb = bytes / (1024 * 1024)
    if (mb < 1024) return `${mb < 1 ? "0" + mb.toFixed(2).replace(/^0/, "") : mb.toFixed(2)} MB`
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb < 1 ? "0" + gb.toFixed(2).replace(/^0/, "") : gb.toFixed(2)} GB`
}

export default function BackupsPage() {
    const { user: currentUser } = useAuth()
    const { toast } = useToast()

    const { data: rawBackups, mutate: mutateBackups, isLoading } = useSWR(
        "backups",
        backupApi.list
    )

    const [isCreatingBackup, setIsCreatingBackup] = useState(false)
    const [backupActionFile, setBackupActionFile] = useState<string | null>(null)
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null)

    if (!isUserAdmin(currentUser)) {
        return (
            <div className="flex h-full items-center justify-center">
                <Card className="w-96">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Access Denied
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            You need administrator privileges to access this page.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Normalise each backup entry so the rest of the UI always has consistent fields
    const backups = rawBackups?.map((b: BackupInfo) => ({
        ...b,
        _filename: resolveFilename(b),
        _size: b.sizeHumanReadable,
        _sizeBytes: b.sizeBytes ?? 0,
        _date: resolveDate(b),
    }))

    const totalSizeBytes = backups?.reduce((acc, b) => acc + (b._sizeBytes ?? 0), 0) ?? 0
    const latestDate = backups && backups.length > 0 ? backups[0]._date : undefined

    const handleCreateBackup = async () => {
        setIsCreatingBackup(true)
        try {
            const result = await backupApi.create()
            await mutateBackups()
            toast({ title: "Backup created", description: result.message || "Backup created successfully" })
        } catch {
            toast({ title: "Failed to create backup", variant: "destructive" })
        } finally {
            setIsCreatingBackup(false)
        }
    }

    const handleRestoreBackup = async (filename: string) => {
        setBackupActionFile(filename)
        try {
            const result = await backupApi.restore(filename)
            toast({ title: "Backup restored", description: result.message || `Restored from ${filename}` })
        } catch {
            toast({ title: "Failed to restore backup", variant: "destructive" })
        } finally {
            setBackupActionFile(null)
        }
    }

    const handleDeleteBackup = async (filename: string) => {
        setBackupActionFile(filename)
        try {
            const result = await backupApi.delete(filename)
            await mutateBackups()
            toast({ title: "Backup deleted", description: result.message || `Deleted ${filename}` })
        } catch {
            toast({ title: "Failed to delete backup", variant: "destructive" })
        } finally {
            setBackupActionFile(null)
        }
    }

    const handleDownloadBackup = async (filename: string) => {
        setDownloadingFile(filename)
        try {
            await backupApi.download(filename)
            toast({ title: "Download started", description: filename })
        } catch {
            toast({ title: "Failed to download backup", variant: "destructive" })
        } finally {
            setDownloadingFile(null)
        }
    }

    return (
        <div className="flex flex-col">
            <Header
                title="Backups"
                description="Create, restore, and manage database backups"
            />

            <div className="flex-1 space-y-6 p-6">
                {/* Summary stat cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-border/50">
                        <CardContent className="flex items-center gap-4 pt-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                                <Database className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{backups?.length ?? "—"}</p>
                                <p className="text-sm text-muted-foreground">Total Backups</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50">
                        <CardContent className="flex items-center gap-4 pt-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                <HardDrive className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {backups && backups.length > 0
                                        ? formatFileSize(totalSizeBytes)
                                        : "—"
                                    }
                                </p>
                                <p className="text-sm text-muted-foreground">Total Size</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50">
                        <CardContent className="flex items-center gap-4 pt-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <HardDrive className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    {latestDate
                                        ? new Date(latestDate).toLocaleString()
                                        : "—"
                                    }
                                </p>
                                <p className="text-sm text-muted-foreground">Latest Backup</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Backups table */}
                <Card className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Database className="h-5 w-5 text-orange-500" />
                            Database Backups
                        </CardTitle>
                        <Button
                            onClick={handleCreateBackup}
                            disabled={isCreatingBackup}
                            className="mb-3"
                        >
                            {isCreatingBackup
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                                : <><HardDrive className="mr-2 h-4 w-4" />Create Backup</>
                            }
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="text-sm">Loading backups...</span>
                            </div>
                        ) : !backups || backups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                <Database className="h-10 w-10 opacity-25" />
                                <p className="text-sm font-medium">No backups available</p>
                                <p className="text-xs">Click "Create Backup" to create your first backup.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border border-border overflow-hidden">
                                <div className="overflow-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead className="sticky top-0 z-10 backdrop-blur-md bg-background/80">
                                            <tr className="border-b">
                                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-12">#</th>
                                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Filename</th>
                                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Size</th>
                                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Created At</th>
                                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                                                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {backups.map((backup, index) => (
                                                <tr
                                                    key={backup._filename + index}
                                                    className="border-b hover:bg-muted/50 transition-colors"
                                                >
                                                    <td className="px-4 py-3 text-muted-foreground font-medium">{index + 1}</td>
                                                    <td className="px-4 py-3 font-mono text-xs max-w-xs truncate" title={backup._filename}>
                                                        {backup._filename}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                        {backup._size || "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                        {backup._date
                                                            ? new Date(backup._date).toLocaleString()
                                                            : "—"
                                                        }
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge className="bg-green-100 text-green-800 border-0">
                                                            Available
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:border-blue-300"
                                                                disabled={backupActionFile !== null || downloadingFile !== null}
                                                                onClick={() => handleDownloadBackup(backup._filename)}
                                                            >
                                                                {downloadingFile === backup._filename
                                                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                                                    : <Download className="h-3 w-3" />
                                                                }
                                                                Download
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 gap-1.5 text-xs"
                                                                disabled={backupActionFile !== null || downloadingFile !== null}
                                                                onClick={() => handleRestoreBackup(backup._filename)}
                                                            >
                                                                {backupActionFile === backup._filename
                                                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                                                    : <RotateCcw className="h-3 w-3" />
                                                                }
                                                                Restore
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 gap-1.5 text-xs text-red-600 hover:text-red-700 hover:border-red-300"
                                                                disabled={backupActionFile !== null || downloadingFile !== null}
                                                                onClick={() => {
                                                                    if (confirm(`Delete backup "${backup._filename}"?\nThis action cannot be undone.`)) {
                                                                        handleDeleteBackup(backup._filename)
                                                                    }
                                                                }}
                                                            >
                                                                {backupActionFile === backup._filename
                                                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                                                    : <Trash2 className="h-3 w-3" />
                                                                }
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
