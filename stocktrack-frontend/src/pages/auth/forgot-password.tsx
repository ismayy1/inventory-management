import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { authApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Loader2, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        try {
            await authApi.forgotPassword(email)
            setIsSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send reset email")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="auth-page">
                <Card className="auth-card">
                    <CardHeader className="auth-card-header">
                        <div className="auth-icon auth-icon--success">
                            <CheckCircle className="auth-icon__svg" />
                        </div>
                        <CardTitle className="auth-title">Check your email</CardTitle>
                        <CardDescription className="auth-description">
                            {"We've sent a password reset link to"} <strong>{email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="auth-card-footer">
                        <Link to="/signin" className="auth-full-link">
                            <Button variant="outline" className="auth-button-outline">
                                <ArrowLeft className="auth-button-icon" />
                                Back to Sign In
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <Card className="auth-card">
                <CardHeader className="auth-card-header">
                    <div className="auth-icon auth-icon--primary">
                        <Package className="auth-icon__svg" />
                    </div>
                    <CardTitle className="auth-title">Forgot password?</CardTitle>
                    <CardDescription className="auth-description">
                        {"Enter your email and we'll send you a reset link"}
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="auth-card-content">
                        {error && <div className="auth-error">{error}</div>}

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
                    </CardContent>

                    <CardFooter className="auth-card-footer auth-card-footer--stacked">
                        <Button type="submit" className="auth-button-primary" disabled={isLoading}>
                            {isLoading && <Loader2 className="auth-spinner-inline" />}
                            Send Reset Link
                        </Button>

                        <Link to="/signin" className="auth-back-link">
                            <ArrowLeft className="auth-back-icon" />
                            Back to Sign In
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}





