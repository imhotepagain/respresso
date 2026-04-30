import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Button } from '../components/ui/button'
import { Gamepad2, Loader2, AlertCircle } from 'lucide-react'

export const Login: React.FC = () => {
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const result = await login(name, password)
            if (result.success) {
                navigate('/')
            } else {
                setError(result.error || 'Invalid credentials')
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

            <Card className="w-full max-w-[400px] shadow-xl border-t-4 border-t-primary animate-in zoom-in-95 duration-500">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">Login</CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access the manager
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
                        <div className="space-y-2">
                            <Label htmlFor="name">Username</Label>
                            <Input
                                id="name"
                                placeholder="Manager username"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="bg-background"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <p className="mt-8 text-sm text-muted-foreground italic">
                Offline Desktop App • Local Storage Only
            </p>
        </div>
    )
}
