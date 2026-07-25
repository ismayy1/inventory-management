import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type User } from "@/lib/api"

interface UserFormProps {
  user?: User
  onSubmit: (data: Partial<User> & { password?: string }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function UserForm({ user, onSubmit, onCancel, isLoading }: UserFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "user",
    password: "",
  })

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        role: user.role || "user",
        password: "",
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const payload: Partial<User> & { password?: string } = {
    username: formData.username,
    email: formData.email,
    role: formData.role,
  }

  if (!user) {
    payload.password = formData.password
  } else if (formData.password) {
    payload.password = formData.password
  }

  await onSubmit(payload)
}

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="password">
          {user ? "Password (leave blank to keep current)" : "Password"}
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required={!user}
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : user ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  )
}