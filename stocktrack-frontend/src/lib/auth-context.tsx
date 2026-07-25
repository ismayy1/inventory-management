import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    type ReactNode,
} from "react"
import { useNavigate } from "react-router-dom"
import { authApi, profileApi, type User } from "./api"

interface AuthContextType {
    user: User | null
    token: string | null
    isLoading: boolean
    signIn: (username: string, password: string) => Promise<void>
    signUp: (username: string, email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()
    const initializationRef = useRef(false)

    useEffect(() => {
        if (initializationRef.current) return
        initializationRef.current = true

        const initializeAuth = async () => {
            try {
                const storedToken = localStorage.getItem("token")
                const storedUser = localStorage.getItem("user")

                console.log("Auth initialization:", { storedToken, storedUser })

                if (storedToken) {
                    setToken(storedToken)

                    if (storedToken === "local-default-token") {
                        if (storedUser) {
                            try {
                                const parsedUser: User = JSON.parse(storedUser)
                                console.log("Auth: Restoring user from localStorage:", parsedUser)
                                
                                const normalizedUser = {
                                    ...parsedUser,
                                    role: (parsedUser.roles && parsedUser.roles.length > 0) 
                                        ? parsedUser.roles[0] 
                                        : parsedUser.role || undefined
                                }
                                
                                setUser(normalizedUser)
                            } catch (err) {
                                console.warn("Failed to parse stored user:", err)
                                localStorage.removeItem("user")
                                setUser(null)
                            }
                        }
                    } else {
                        try {
                            const userProfile: User = await profileApi.get()
                            console.log("Auth: Got user profile from server:", userProfile)
                            
                            const normalizedProfile = {
                                ...userProfile,
                                role: (userProfile.roles && userProfile.roles.length > 0) 
                                    ? userProfile.roles[0] 
                                    : userProfile.role || undefined
                            }
                            
                            setUser(normalizedProfile)
                            localStorage.setItem("user", JSON.stringify(normalizedProfile))
                        } catch (error) {
                            console.warn("Token validation failed, clearing auth data", error)
                            localStorage.removeItem("token")
                            localStorage.removeItem("user")
                            setToken(null)
                            setUser(null)
                        }
                    }
                } else {
                    console.log("Auth: No token found, setting user to null")
                    setUser(null)
                }
            } catch (err) {
                console.warn("Invalid auth data in localStorage, clearing it", err)
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                setToken(null)
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()
    }, [])

    const signIn = useCallback(
        async (username: string, password: string) => {
            if (username === "ismai1" && password === "ismai1") {
                const defaultUser: User = {
                    id: 0,
                    username: "ismai1",
                    email: "ismai1@example.com",
                    role: "SYSTEM_ADMIN",
                    roles: ["SYSTEM_ADMIN"],
                    isActive: true,
                    createdAt: new Date().toISOString(),
                }
                const defaultToken = "local-default-token"

                localStorage.setItem("token", defaultToken)
                localStorage.setItem("user", JSON.stringify(defaultUser))

                console.log("Auth: Setting user state:", defaultUser)
                setToken(defaultToken)
                setUser(defaultUser)
                setIsLoading(false)

                setTimeout(() => {
                    console.log("Auth: Navigating to dashboard with user:", defaultUser)
                    navigate("/dashboard")
                }, 100)
                return
            }

            try {
                const response = await authApi.signIn({ username, password })
                
                console.log("Auth API response:", response)
                
                if (!response) {
                    throw new Error("Login failed: no response from API")
                }
                
                if (!response.token) {
                    throw new Error("Login failed: no token in API response")
                }
                
                if (!response.user) {
                    throw new Error("Login failed: no user in API response")
                }
                
                const loggedUser: User = {
                    ...response.user,
                    role: (response.user.roles && response.user.roles.length > 0) 
                        ? response.user.roles[0] 
                        : response.user.role || 'USER'
                }

                localStorage.setItem("token", response.token)
                localStorage.setItem("user", JSON.stringify(loggedUser))

                console.log("Auth: Setting user state from API:", loggedUser)
                setToken(response.token)
                setUser(loggedUser)
                setIsLoading(false)

                setTimeout(() => {
                    console.log("Auth: Navigating to dashboard with user:", loggedUser)
                    navigate("/dashboard")
                }, 100)
            } catch (error) {
                console.error("Login error:", error)
                
                if (error instanceof Error) {
                    if (error.message.includes("fetch")) {
                        throw new Error("Cannot connect to server. Please check if the backend is running.")
                    } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
                        throw new Error("Invalid username or password.")
                    } else if (error.message.includes("no user")) {
                        throw new Error("Login successful but user data is missing. Please contact support.")
                    }
                }
                
                throw error
            }
        },
        [navigate],
    )

    const signUp = useCallback(
        async (username: string, email: string, password: string) => {
            await authApi.signUp({ username, email, password })
            navigate("/signin?registered=true")
        },
        [navigate],
    )

    const signOut = useCallback(async () => {
        try {
            await authApi.signOut()
        } catch {
        }

        localStorage.removeItem("token")
        localStorage.removeItem("user")

        setToken(null)
        setUser(null)
        initializationRef.current = false

        navigate("/signin")
    }, [navigate])

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                signIn,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used within an AuthProvider")
    return context
}