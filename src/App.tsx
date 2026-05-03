import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
import { Shifts } from './pages/Shifts'
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
                <Route path="/shifts" element={<ProtectedRoute><MainLayout><Shifts /></MainLayout></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute role="OWNER"><MainLayout><Team /></MainLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute role="OWNER"><MainLayout><Settings /></MainLayout></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    )
}

import { ThemeProvider } from './providers/ThemeProvider'

function SplashScreen({ onFinish }: { onFinish: () => void }) {
    const [fadeOut, setFadeOut] = useState(false)

    useEffect(() => {
        const fadeTimer = setTimeout(() => setFadeOut(true), 1800)
        const doneTimer = setTimeout(() => onFinish(), 2300)
        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(doneTimer)
        }
    }, [onFinish])

    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] text-white overflow-hidden transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
        >
            {/* Ambient background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)',
                    animation: 'pulse 2s ease-in-out infinite'
                }}
            />

            {/* Secondary orbs */}
            <div className="absolute top-1/4 left-1/4 w-[200px] h-[200px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"
                style={{ animation: 'pulse 3s ease-in-out infinite 0.5s' }}
            />
            <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"
                style={{ animation: 'pulse 3s ease-in-out infinite 1s' }}
            />

            <div className="z-10 flex flex-col items-center"
                style={{ animation: 'splashZoomIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            >
                {/* Logo with glow ring */}
                <div className="relative mb-8">
                    <div className="absolute -inset-6 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute -inset-3 border-2 border-primary/10 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="relative bg-primary/10 p-6 rounded-full border border-primary/20 backdrop-blur-sm">
                        <Gamepad2 className="h-16 w-16 text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.6)]" />
                    </div>
                </div>

                {/* Brand name */}
                <h1 className="text-6xl font-black tracking-[0.25em] mb-3 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                    GLISSA
                </h1>

                {/* Tagline with delayed fade-in */}
                <p className="text-sm font-bold tracking-[0.3em] text-primary/70 uppercase"
                    style={{ animation: 'splashFadeIn 0.6s ease-out 0.4s both' }}
                >
                    Premium Gaming & Coffee
                </p>

                {/* Loading bar */}
                <div className="mt-12 w-48 h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                        style={{ animation: 'splashLoadBar 1.8s ease-in-out forwards' }}
                    />
                </div>
            </div>

            <style>{`
                @keyframes splashZoomIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes splashFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes splashLoadBar {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    )
}

function App() {
    const [showSplash, setShowSplash] = useState(true)

    return (
        <ThemeProvider defaultTheme="dark" storageKey="respresso-theme">
            {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
            <AuthProvider>
                <AppContent />
                <Toaster position="top-right" expand={false} richColors closeButton theme="dark" />
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
