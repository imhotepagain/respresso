import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import React, { useState, useEffect } from "react"
import { Gamepad2, Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './providers/AuthProvider'
import { MainLayout } from './layouts/MainLayout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { POS } from './pages/POS'
import { Inventory } from './pages/Inventory'
import { Debts } from './pages/Debts'
import { Sessions } from './pages/Sessions'
import { Reports } from './pages/Reports'
import { Team } from './pages/Team'
import { Settings } from './pages/Settings'
import { Setup } from './pages/Setup'
import { Billing } from './pages/Billing'
import { Toaster } from 'sonner'
import './index.css'

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: 'OWNER' }) => {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white overflow-hidden relative">
                {/* Background ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
                
                <div className="z-10 flex flex-col items-center animate-in zoom-in-95 fade-in duration-1000 ease-out">
                    <div className="relative mb-8">
                        <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                        <Gamepad2 className="h-20 w-20 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-bounce relative z-10" style={{ animationDuration: '2s' }} />
                    </div>
                    
                    <h1 className="text-5xl font-black tracking-[0.2em] mb-2 drop-shadow-md">
                        GLISSA
                    </h1>
                    <p className="text-sm font-bold tracking-widest text-primary/80 uppercase mb-12">
                        Premium Gaming & Coffee
                    </p>
                    
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
                            Initializing System Protocol...
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" />
    }

    if (role && user.role !== role) {
        return <Navigate to="/" />
    }

    return <>{children}</>
}

function AppContent() {
    const [isChecking, setIsChecking] = useState(true)
    const [needsSetup, setNeedsSetup] = useState(false)

    useEffect(() => {
        const checkSetup = async () => {
            try {
                const result = await window.api.checkHasUsers()
                if (result.success && !result.hasUsers) {
                    setNeedsSetup(true)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setIsChecking(false)
            }
        }
        checkSetup()
    }, [])

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-xl font-bold text-primary">Initializing System...</div>
            </div>
        )
    }

    return (
        <Router>
            <Routes>
                <Route path="/setup" element={needsSetup ? <Setup /> : <Navigate to="/login" />} />
                <Route path="/login" element={needsSetup ? <Navigate to="/setup" /> : <Login />} />

                <Route path="/" element={
                    <ProtectedRoute>
                        <MainLayout>
                            <Dashboard />
                        </MainLayout>
                    </ProtectedRoute>
                } />

                <Route path="/pos" element={<ProtectedRoute><MainLayout><POS /></MainLayout></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute><MainLayout><Inventory /></MainLayout></ProtectedRoute>} />
                <Route path="/debts" element={<ProtectedRoute><MainLayout><Debts /></MainLayout></ProtectedRoute>} />
                <Route path="/sessions" element={<ProtectedRoute><MainLayout><Sessions /></MainLayout></ProtectedRoute>} />
                <Route path="/billing" element={<ProtectedRoute role="OWNER"><MainLayout><Billing /></MainLayout></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute role="OWNER"><MainLayout><Team /></MainLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute role="OWNER"><MainLayout><Settings /></MainLayout></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    )
}

import { ThemeProvider } from './providers/ThemeProvider'

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="respresso-theme">
            <AuthProvider>
                <AppContent />
                <Toaster position="top-right" expand={false} richColors closeButton theme="dark" />
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
