import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Loader2 } from "lucide-react"

export default function SignUpPage() {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { signUp } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setIsLoading(true)
        try {
            await signUp(username, email, password)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create account")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <Card className="auth-card">
                <CardHeader className="auth-card-header">
                    <div className="auth-icon auth-icon--primary">
                        <Package className="auth-icon__svg" />
                    </div>
                    <CardTitle className="auth-title">Create an account</CardTitle>
                    <CardDescription className="auth-description">
                        Get started with StockTrack
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="auth-card-content">
                        {error && <div className="auth-error">{error}</div>}

                        <div className="auth-field">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="auth-card-footer auth-card-footer--stacked">
                        <Button type="submit" className="auth-button-primary" disabled={isLoading}>
                            {isLoading && <Loader2 className="auth-spinner-inline" />}
                            Create Account
                        </Button>

                        <p className="auth-text-muted">
                            Already have an account?{" "}
                            <Link to="/signin" className="auth-link">
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}





