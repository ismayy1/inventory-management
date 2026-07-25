import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import useSWR, { mutate } from "swr"

import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supplierApi, type Supplier } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { isInventoryManager, isUserAdmin } from "@/lib/utils"

export default function EditSupplierPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = isUserAdmin(user)
    const isManager = isInventoryManager(user)
    const { toast } = useToast()

    const numericId = id ? Number(id) : NaN

    const { data: supplier, isLoading } = useSWR<Supplier | null>(
        Number.isFinite(numericId) ? ["supplier", numericId] : null,
        () => supplierApi.getById(numericId),
    )

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        url: "",
        active: true,
    })

    if (!isAdmin && !isManager) {
        return (
            <div className="flex flex-col">
                <Header title="Access Denied" description="You do not have permission to edit suppliers" />
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
                        <p className="text-muted-foreground mb-6">Only Inventory Managers or General Managers can edit suppliers.</p>
                        <Button onClick={() => navigate("/dashboard/suppliers")}>Back to Suppliers</Button>
                    </div>
                </div>
            </div>
        )
    }

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name || "",
                email: supplier.email || "",
                phone: supplier.phone || "",
                address: supplier.address || "",
                url: supplier.url || supplier.website || "",
                active: supplier.active ?? true,
            })
        }
    }, [supplier])

    const handleUpdate = async () => {
        if (!supplier) return

        if (!formData.name.trim()) {
            toast({ title: "Name is required.", variant: "destructive" })
            return
        }

        if (!formData.email.trim()) {
            toast({ title: "Email is required.", variant: "destructive" })
            return
        }

        try {
            const updatePayload = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                url: formData.url.trim(),
                website: formData.url.trim(),
                active: formData.active,
            }

            await supplierApi.update(supplier.id, updatePayload)

            await mutate("suppliers")
            toast({ title: "Supplier updated successfully" })
            navigate("/dashboard/suppliers")
        } catch (err: any) {
            const msg = err?.message || "Failed to update supplier"
            toast({ title: msg, variant: "destructive" })
        }
    }

    return (
        <div className="flex flex-col">
            <Header title="Edit Supplier" description="Update supplier details" />

            <div className="flex-1 p-6">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle>Supplier Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading && (
                            <p className="text-sm text-muted-foreground">Loading supplier...</p>
                        )}

                        {!isLoading && !supplier && (
                            <p className="text-sm text-destructive">Supplier not found.</p>
                        )}

                        {supplier && (
                            <div key={supplier.id}>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-supplier-name">Name</Label>
                                    <Input
                                        id="edit-supplier-name"
                                        name="edit-supplier-name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-supplier-email">Email</Label>
                                        <Input
                                            id="edit-supplier-email"
                                            name="edit-supplier-email"
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-supplier-phone">Phone</Label>
                                        <Input
                                            id="edit-supplier-phone"
                                            name="edit-supplier-phone"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-supplier-address">Address</Label>
                                    <Input
                                        id="edit-supplier-address"
                                        name="edit-supplier-address"
                                        value={formData.address}
                                        onChange={(e) =>
                                            setFormData({ ...formData, address: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit-supplier-url">Website / URL</Label>
                                    <Input
                                        id="edit-supplier-url"
                                        name="edit-supplier-url"
                                        type="url"
                                        placeholder="https://example.com"
                                        value={formData.url}
                                        onChange={(e) =>
                                            setFormData({ ...formData, url: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-medium">Active Status</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {formData.active ? "This supplier is currently active" : "This supplier is currently inactive"}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.active}
                                        onCheckedChange={(checked) => {
                                            setFormData({ ...formData, active: checked })
                                        }}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button className="border border-primary p-2 bg-primary text-primary-foreground hover:bg-primary/90" variant="outline" onClick={() => navigate("/dashboard/suppliers")}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleUpdate}>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

