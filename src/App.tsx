import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import React, { useState, useEffect } from "react"
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
import { Setup } from './pages/Setup'
import './index.css'

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: 'OWNER' }) => {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-xl font-bold text-primary">Initializing Respresso...</div>
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
                <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute role="OWNER"><MainLayout><Team /></MainLayout></ProtectedRoute>} />

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
            </AuthProvider>
        </ThemeProvider>
    )
}

export default App
