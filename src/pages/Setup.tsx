import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Gamepad2, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'

export const Setup: React.FC = () => {
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 4) {
            setError("Password must be at least 4 characters")
            return
        }

        setIsLoading(true)

        try {
            // Create the first user as OWNER (full access to all gated pages)
            const createResult = await window.api.createUser({
                name,
                password,
                role: 'OWNER'
            })

            if (createResult.success) {
                setSuccess(true)
                // Auto login
                await login(name, password)
                setTimeout(() => {
                    navigate('/')
                }, 1500)
            } else {
                setError(createResult.error || 'Failed to create account')
            }
        } catch (err) {
            setError('An unexpected error occurred')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <Gamepad2 className="h-10 w-10 text-primary" />
                <h1 className="text-4xl font-extrabold tracking-tight">GLISSA</h1>
            </div>

            <Card className="w-full max-w-[400px] shadow-xl border-t-4 border-t-emerald-500 animate-in zoom-in-95 duration-500">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Welcome!</CardTitle>
                    <CardDescription className="text-center">
                        Let's set up your Administrator account to get started.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 animate-in head-shake duration-300">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-emerald-100 text-emerald-800 text-sm p-3 rounded-md flex items-center gap-2 animate-in zoom-in duration-300">
                                <CheckCircle className="h-4 w-4" />
                                Account created! Logging you in...
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Owner Username</Label>
                            <Input
                                id="name"
                                placeholder="Choose a username"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-background"
                                autoFocus
                                disabled={isLoading || success}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background"
                                disabled={isLoading || success}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Repeat password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="bg-background"
                                disabled={isLoading || success}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isLoading || success}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Profile...
                                </>
                            ) : success ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Redirecting...
                                </>
                            ) : (
                                'Create Admin Account'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <p className="mt-8 text-sm text-muted-foreground italic">
                First Run Setup • This will be your master account
            </p>
        </div>
    )
}
