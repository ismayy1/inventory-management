import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supplierApi } from "@/lib/api"
import { mutate } from "swr"
import { Header } from "@/components/dashboard/header"

export default function AddSupplierPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    url: "",
    active: true,
  })

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Name is required.", variant: "destructive" })
      return
    }

    if (!formData.email.trim()) {
      toast({ title: "Email is required.", variant: "destructive" })
      return
    }

    try {
      const createPayload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        url: formData.url.trim(),
        website: formData.url.trim(),
        active: formData.active,
      }

      await supplierApi.create(createPayload)
      await mutate("suppliers")
      toast({ title: "Supplier created successfully" })
      navigate("/dashboard/suppliers")
    } catch (err: any) {
      const msg = err?.message || "Failed to create supplier"
      toast({ title: msg, variant: "destructive" })
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Add Supplier" description="Create a new supplier" />

      <div className="max-w-2xl space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="supplier-name">Name</Label>
          <Input
            id="supplier-name"
            name="supplier-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-email">Email</Label>
            <Input
              id="supplier-email"
              name="supplier-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-phone">Phone</Label>
            <Input
              id="supplier-phone"
              name="supplier-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier-address">Address</Label>
          <Input
            id="supplier-address"
            name="supplier-address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier-url">Website / URL</Label>
          <Input
            id="supplier-url"
            name="supplier-url"
            type="url"
            placeholder="https://example.com"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Active Status</Label>
            <p className="text-sm text-muted-foreground">
              {formData.active ? "This supplier will be active" : "This supplier will be inactive"}
            </p>
          </div>
          <Switch
            checked={formData.active}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, active: checked })
            }
          />
        </div>



        <div className="flex gap-4">
          <Button className="border border-border rounded px-2 py-1" onClick={handleCreate}>Create Supplier</Button>
          <Button className="border border-border rounded px-2 py-1" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
