import { useState, useEffect, useRef } from "react"
import useSWR from "swr"
import { useNavigate } from "react-router-dom"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { isUserAdmin } from "@/lib/utils"
import { profileApi, backupApi, healthApi, userApi } from "@/lib/api"
import {
    User, Lock, Database, Activity, Loader2,
    Eye, EyeOff, Camera, ZoomIn
} from "lucide-react"

export default function SettingsPage() {
    const { user } = useAuth()
    const isAdmin = isUserAdmin(user)
    const { toast } = useToast()
    const navigate = useNavigate()

    const { data: health, error: healthError, isLoading: healthLoading } = useSWR(isAdmin ? "health" : null, healthApi.check, { refreshInterval: 30000 })
    const { data: backups, isLoading: backupsLoading } = useSWR(isAdmin ? "backups-list" : null, backupApi.list, { refreshInterval: 60000 })

    // Load profile from backend
    const { data: profileFromApi, mutate: mutateProfile } = useSWR("profile", profileApi.get)

    const [profileData, setProfileData] = useState({
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        profileImage: "",
    })

    // Resolve the profile image URL — backend stores as /uploads/profile/filename.jpg
    const resolveImageUrl = (url: string): string => {
        if (!url) return ""
        // Already base64 preview
        if (url.startsWith("data:")) return url
        // Already a full URL
        if (url.startsWith("http")) return url
        // Relative path from backend — serve via Vite proxy (/api proxied to :8080)
        // Static files are served directly from :8080, not through /api
        return `http://localhost:8080${url.startsWith("/") ? url : `/${url}`}`
    }

    // Populate form once profile data arrives
    useEffect(() => {
        if (profileFromApi) {
            setProfileData({
                username: profileFromApi.username || "",
                email: profileFromApi.email || "",
                firstName: profileFromApi.firstName || "",
                lastName: profileFromApi.lastName || "",
                // Backend uses profilePicture; fallback to profileImage
                profileImage: profileFromApi.profilePicture || profileFromApi.profileImage || "",
            })
        }
    }, [profileFromApi])

    const [passwordData, setPasswordData] = useState({
        newPassword: "",
        confirmPassword: "",
    })
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const [showPhotoDialog, setShowPhotoDialog] = useState(false)
    const photoInputRef = useRef<HTMLInputElement>(null)
    const pendingPhotoFile = useRef<File | null>(null)
    const [isPhotoUploading, setIsPhotoUploading] = useState(false)

    const [isProfileLoading, setIsProfileLoading] = useState(false)
    const [isPasswordLoading, setIsPasswordLoading] = useState(false)

    const handleProfileUpdate = async () => {
        if (!profileData.username.trim()) {
            toast({ title: "Username is required.", variant: "destructive" })
            return
        }
        setIsProfileLoading(true)
        try {
            // If a new photo was selected, upload it first via POST /api/profile/picture
            if (pendingPhotoFile.current) {
                setIsPhotoUploading(true)
                try {
                    const updated = await profileApi.uploadPicture(pendingPhotoFile.current)
                    pendingPhotoFile.current = null
                    const newImage = updated?.profilePicture || updated?.profileImage
                    if (newImage) {
                        setProfileData(prev => ({ ...prev, profileImage: newImage }))
                    }
                } catch (err: any) {
                    toast({ title: err?.message || "Failed to upload photo", variant: "destructive" })
                    setIsPhotoUploading(false)
                    setIsProfileLoading(false)
                    return
                } finally {
                    setIsPhotoUploading(false)
                }
            }

            // Save the rest of the profile fields (no base64 in payload)
            const payload = {
                username: profileData.username.trim(),
                email: profileData.email.trim(),
                firstName: profileData.firstName.trim() || undefined,
                lastName: profileData.lastName.trim() || undefined,
            }

            // Try PUT /api/profile; only fall back to PUT /api/users/{id} for admins
            try {
                await profileApi.update(payload)
            } catch (profileErr: any) {
                if (isAdmin && profileFromApi?.id) {
                    await userApi.update(profileFromApi.id, payload)
                } else {
                    throw profileErr
                }
            }

            mutateProfile()
            toast({ title: "Profile updated successfully" })
        } catch (err: any) {
            toast({ title: err?.message || "Failed to update profile", variant: "destructive" })
        } finally {
            setIsProfileLoading(false)
        }
    }

    const handlePasswordChange = async () => {
        if (passwordData.newPassword.length < 6) {
            toast({ title: "New password must be at least 6 characters.", variant: "destructive" })
            return
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({ title: "New passwords do not match.", variant: "destructive" })
            return
        }
        setIsPasswordLoading(true)
        try {
            await profileApi.changePassword({
                currentPassword: "",
                newPassword: passwordData.newPassword,
            })
            setPasswordData({ newPassword: "", confirmPassword: "" })
            toast({ title: "Password changed successfully" })
        } catch (err: any) {
            // Only admins can use the users endpoint as fallback — non-admins get 403 from it
            if (isAdmin && profileFromApi?.id) {
                try {
                    await userApi.resetPassword(profileFromApi.id, passwordData.newPassword)
                    setPasswordData({ newPassword: "", confirmPassword: "" })
                    toast({ title: "Password changed successfully" })
                    return
                } catch {
                    // fall through to show original error
                }
            }
            toast({ title: err?.message || "Failed to change password", variant: "destructive" })
        } finally {
            setIsPasswordLoading(false)
        }
    }

    return (
        <div className="settings-page flex flex-col">
            <Header title="Settings" description="Manage your account and system settings" />
            <div className="settings-content flex-1 p-6">
                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="flex flex-row gap-2 bg-transparent p-0 h-auto">
                        <TabsTrigger
                            value="profile"
                            className="flex items-center gap-2 border border-border rounded-md px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                        >
                            <User className="h-4 w-4" /> Profile
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="flex items-center gap-2 border border-border rounded-md px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                        >
                            <Lock className="h-4 w-4" /> Security
                        </TabsTrigger>
                        {/* User Management tab hidden for now */}
                        {isAdmin && (
                        <TabsTrigger
                            value="system"
                            className="flex items-center gap-2 border border-border rounded-md px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                        >
                            <Database className="h-4 w-4" /> System
                        </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="profile">
                        <div className="max-w-3xl">
                            <Card className="border-border/50">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        Profile Information
                                    </CardTitle>
                                    <CardDescription>Update your account details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {!profileFromApi && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
                                        </p>
                                    )}
                                    <div className="grid grid-cols-3 gap-6 items-start">
                                        {/* Col 1: Username + Email */}
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-sm">Username</Label>
                                                <Input
                                                    value={profileData.username}
                                                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                                    disabled={!profileFromApi}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-sm">Email</Label>
                                                <Input
                                                    type="email"
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                                    disabled={!profileFromApi}
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>

                                        {/* Col 2: First Name + Last Name */}
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-sm">First Name</Label>
                                                <Input
                                                    value={profileData.firstName}
                                                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                                                    disabled={!profileFromApi}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-sm">Last Name</Label>
                                                <Input
                                                    value={profileData.lastName}
                                                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                                                    disabled={!profileFromApi}
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>

                                        {/* Col 3: Profile photo */}
                                        <div className="flex flex-col items-center gap-2">
                                            <Label className="text-sm self-start">Photo</Label>
                                            <div className="group relative w-60 h-60 rounded-lg border-2 border-border overflow-hidden bg-muted cursor-pointer shrink-0">
                                                {profileData.profileImage ? (
                                                    <img
                                                        src={resolveImageUrl(profileData.profileImage)}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                        onError={(_e) => {console.error("Image failed to load:", profileData.profileImage);
}}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                        <User className="h-20 w-20" />
                                                    </div>
                                                )}
                                                {/* Hover overlay */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                                                    <button
                                                        type="button"
                                                        className="flex items-center gap-1 text-white text-xs font-medium hover:text-primary-foreground bg-white/20 hover:bg-white/30 rounded px-2 py-1 w-full justify-center transition-colors"
                                                        onClick={() => setShowPhotoDialog(true)}
                                                        disabled={!profileData.profileImage}
                                                    >
                                                        <ZoomIn className="h-3 w-3" /> See photo
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="flex items-center gap-1 text-white text-xs font-medium hover:text-primary-foreground bg-white/20 hover:bg-white/30 rounded px-2 py-1 w-full justify-center transition-colors"
                                                        onClick={() => photoInputRef.current?.click()}
                                                    >
                                                        <Camera className="h-3 w-3" /> Change photo
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Hidden file input — file stored in ref, uploaded when Save Changes is clicked */}
                                            <input
                                                ref={photoInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (!file) return
                                                    // Keep the File object — it will be sent to POST /api/profile/picture on Save
                                                    pendingPhotoFile.current = file
                                                    // Show preview immediately via base64
                                                    const reader = new FileReader()
                                                    reader.onload = (ev) => {
                                                        setProfileData(prev => ({ ...prev, profileImage: ev.target?.result as string }))
                                                    }
                                                    reader.readAsDataURL(file)
                                                    e.target.value = ""
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleProfileUpdate}
                                        disabled={isProfileLoading || isPhotoUploading || !profileFromApi}
                                        className="h-9"
                                    >
                                        {(isProfileLoading || isPhotoUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Full-size photo dialog */}
                        <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle>Profile Photo</DialogTitle>
                                </DialogHeader>
                                {profileData.profileImage && (
                                    <img
                                        src={resolveImageUrl(profileData.profileImage)}
                                        alt="Profile"
                                        className="w-full rounded-lg object-contain max-h-80"
                                    />
                                )}
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="security">
                        <div className="max-w-sm">
                            <Card className="border-border/50">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        Change Password
                                    </CardTitle>
                                    <CardDescription>Keep your account secure</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm">New Password</Label>
                                        <div className="relative">
                                            <Input
                                                type={showNew ? "text" : "password"}
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="h-9 pr-9"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowNew(v => !v)}
                                            >
                                                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm">Confirm New Password</Label>
                                        <div className="relative">
                                            <Input
                                                type={showConfirm ? "text" : "password"}
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="h-9 pr-9"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowConfirm(v => !v)}
                                            >
                                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handlePasswordChange}
                                        disabled={isPasswordLoading}
                                        className="w-full h-9"
                                    >
                                        {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Change Password
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {isAdmin && (
                    <TabsContent value="system">
                        <div className="grid grid-cols-2 gap-6">
                            <Card className="border border-border rounded-xl">
                                <CardHeader className="pb-3 px-6 pt-6">
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" /> System Health
                                    </CardTitle>
                                    <CardDescription>Current system status</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 px-6 pb-6">
                                    {healthLoading && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Checking…
                                        </p>
                                    )}
                                    {!healthLoading && (healthError || !health || health.status !== "UP") ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2.5 w-2.5 rounded-full bg-destructive shrink-0" />
                                                <span className="text-sm font-medium text-destructive">System Status: Unavailable</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="h-2.5 w-2.5 rounded-full bg-destructive shrink-0" />
                                                <span className="text-sm font-medium text-destructive">Database: Disconnected</span>
                                            </div>
                                        </div>
                                    ) : !healthLoading && health?.status === "UP" ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" />
                                                <span className="text-sm font-medium text-green-600">System Operational</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" />
                                                <span className="text-sm font-medium text-green-600">Database Connected</span>
                                            </div>
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>

                            <Card className="border border-border rounded-xl">
                                <CardHeader className="pb-3 px-6 pt-6">
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="h-5 w-5" /> Database Backup
                                    </CardTitle>
                                    <CardDescription>Created Backups</CardDescription>
                                </CardHeader>
                                <CardContent className="px-6 pb-6 space-y-4">
                                    {backupsLoading && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Loading backups…
                                        </p>
                                    )}
                                    {!backupsLoading && (!backups || backups.length === 0) && (
                                        <p className="text-sm text-muted-foreground">No backups found.</p>
                                    )}
                                    {!backupsLoading && backups && backups.length > 0 && (
                                        <div className="rounded-md border overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/50 border-b">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Size</th>
                                                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Created</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {backups.map((b, i) => {
                                                        const name = b.filename ?? b.fileName ?? b.name ?? `backup-${i + 1}`
                                                        const size = b.sizeHumanReadable ?? b.sizeFormatted ?? (b.sizeBytes != null ? `${(b.sizeBytes / 1024).toFixed(1)} KB` : b.size != null ? `${(Number(b.size) / 1024).toFixed(1)} KB` : b.fileSize != null ? `${(Number(b.fileSize) / 1024).toFixed(1)} KB` : "—")
                                                        const date = b.createdAt ?? b.createdDate ?? b.lastModified
                                                        return (
                                                            <tr key={i} className="hover:bg-muted/20 transition-colors">
                                                                <td className="px-3 py-2 font-mono text-xs truncate max-w-[160px]" title={name}>{name}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">{size}</td>
                                                                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                                                    {date ? new Date(date).toLocaleDateString() : "—"}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/backups")}>
                                        Backups
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    )
}