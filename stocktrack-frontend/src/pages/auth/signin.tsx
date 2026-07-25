import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { ArchiveBoxIcon } from "@heroicons/react/24/outline"

export default function SignInPage() {
    const [username, setUsername] = useState("ismai1")
    const [password, setPassword] = useState("ismai1")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { signIn, isLoading: authLoading } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            await signIn(username, password)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to sign in")
        } finally {
            setIsLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="auth-page">
                <Card className="auth-card">
                    <CardContent className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading...</span>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <Card className="auth-card">
                <CardHeader className="auth-card-header px-6 pt-8 pb-4 space-y-2 text-center">
                    <div className="auth-icon auth-icon--primary mb-2">
                        <ArchiveBoxIcon className="w-16 h-16" />
                    </div>

                    <CardTitle className="auth-title text-2xl">
                        Welcome back
                    </CardTitle>

                    <CardDescription className="auth-description">
                        Sign in to your StockTrack account
                    </CardDescription>

                    <p className="auth-helper mt-2">
                        Default username &amp; password:{" "}
                        <span className="auth-highlight">ismai1</span>
                    </p>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="auth-card-content px-6 py-4 space-y-5">
                        {error && (
                            <div className="auth-error px-3 py-2 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="auth-field space-y-1">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="auth-field space-y-1">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="auth-link-wrapper pt-1 text-right">
                            <Link to="/forgot-password" className="auth-link">
                                Forgot password?
                            </Link>
                        </div>
                    </CardContent>

                    <CardFooter className="auth-card-footer auth-card-footer--stacked px-6 pt-2 pb-6 space-y-4">
                        <Button
                            type="submit"
                            className="auth-button-primary w-full"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="auth-spinner-inline mr-2" />}
                            Sign In
                        </Button>

                        <p className="auth-text-muted text-sm text-center">
                            {"Don't have an account? "}
                            <Link to="/signup" className="auth-link">
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}