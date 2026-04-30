import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import { useAuth } from '../providers/AuthProvider'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../components/ui/tooltip'
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Gamepad2,
    LogOut,
    BarChart,
    ChevronLeft,
    ChevronRight,
    Shield,
    User,
    Settings as SettingsIcon,
    Sun,
    Moon,
    Receipt,
    Clock
} from 'lucide-react'
import { useTheme } from '../providers/ThemeProvider'

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth()
    const { theme, setTheme } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()
    const [isCollapsed, setIsCollapsed] = useState(false)

    const links = [
        { href: '/', label: 'Overview', icon: LayoutDashboard },
        { href: '/pos', label: 'Point of Sale', icon: ShoppingCart },
        { href: '/reports', label: 'Reports', icon: BarChart, adminOnly: true },
        { href: '/inventory', label: 'Inventory', icon: Package },
        { href: '/debts', label: 'Clients & Debts', icon: Users },
        { href: '/sessions', label: 'PS Sessions', icon: Gamepad2 },
        { href: '/billing', label: 'Bills & Expenses', icon: Receipt, adminOnly: true },
        { href: '/shifts', label: 'Shifts & Register', icon: Clock },
        { href: '/team', label: 'Team', icon: Shield, adminOnly: true },
        { href: '/settings', label: 'Settings', icon: SettingsIcon, adminOnly: true },
    ]

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <TooltipProvider>
                <nav
                    className={cn(
                        "flex flex-col gap-2 p-4 border-r border-border bg-card/50 h-screen transition-all duration-300 relative",
                        isCollapsed ? "w-[80px]" : "w-[250px]"
                    )}
                >
                    <div className={cn("flex items-center gap-2 px-2 py-4 mb-4", isCollapsed && "justify-center")}>
                        <Gamepad2 className="h-6 w-6 text-primary shrink-0" />
                        {!isCollapsed && <span className="text-xl font-bold tracking-tight truncate">GLISSA</span>}

                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-md z-10",
                                isCollapsed && "right-[-12px]"
                            )}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                        </Button>
                    </div>

                    <div className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
                        {links.map((link) => {
                            if (link.adminOnly && user?.role !== 'OWNER') return null

                            const Icon = link.icon
                            const isActive = location.pathname === link.href

                            return (
                                <Tooltip key={link.href} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Link to={link.href}>
                                            <Button
                                                variant={isActive ? "secondary" : "ghost"}
                                                className={cn(
                                                    "w-full transition-all",
                                                    isActive && "bg-secondary",
                                                    isCollapsed ? "justify-center px-0" : "justify-start"
                                                )}
                                            >
                                                <Icon className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-2")} />
                                                {!isCollapsed && <span>{link.label}</span>}
                                            </Button>
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && (
                                        <TooltipContent side="right">
                                            {link.label}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            )
                        })}
                    </div>

                    <div className="pt-4 border-t border-border mt-auto space-y-2">
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "w-full text-muted-foreground",
                                        isCollapsed ? "justify-center px-0" : "justify-start px-2"
                                    )}
                                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                >
                                    {theme === 'dark' ? (
                                        <>
                                            <Sun className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-2 text-yellow-500")} />
                                            {!isCollapsed && <span>Light Mode</span>}
                                        </>
                                    ) : (
                                        <>
                                            <Moon className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-2 text-blue-500")} />
                                            {!isCollapsed && <span>Dark Mode</span>}
                                        </>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Toggle Theme</TooltipContent>}
                        </Tooltip>

                        {!isCollapsed && (
                            <div className="px-2 py-3 mb-2 flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-medium truncate">{user?.name}</span>
                                    <span className="text-xs text-muted-foreground uppercase">{user?.role}</span>
                                </div>
                            </div>
                        )}

                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full text-destructive hover:text-destructive hover:bg-destructive/10",
                                        isCollapsed ? "justify-center px-0" : "justify-start"
                                    )}
                                    onClick={handleLogout}
                                >
                                    <LogOut className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-2")} />
                                    {!isCollapsed && "Logout"}
                                </Button>
                            </TooltipTrigger>
                            {isCollapsed && <TooltipContent side="right">Logout</TooltipContent>}
                        </Tooltip>
                    </div>
                </nav>
            </TooltipProvider>

            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="w-full h-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
