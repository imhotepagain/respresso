import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Users, DollarSign, Gamepad2, Package, RefreshCw, TrendingUp } from 'lucide-react'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'

type TrendPoint = { hour: string; cash: number; debt: number; sessions: number }

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<{
        userCount: number
        activeSessions: number
        productCount: number
        totalDebt: number
        lowStock: any[]
    } | null>(null)
    const [trend, setTrend] = useState<TrendPoint[]>([])
    const [loading, setLoading] = useState(true)

    const fetchStats = async () => {
        setLoading(true)
        const [statsResult, trendResult] = await Promise.all([
            window.api.getDashboardStats(),
            window.api.getDashboardTrend()
        ])
        if (statsResult.success && statsResult.stats) {
            setStats(statsResult.stats as any)
        }
        if (trendResult.success && trendResult.trend) {
            setTrend(trendResult.trend)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchStats()
    }, [])

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const todayTotal = trend.reduce((sum, p) => sum + p.cash + p.debt, 0)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.userCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Registered customers</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <Gamepad2 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Players currently playing</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding Debt</CardTitle>
                        <DollarSign className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(stats?.totalDebt || 0).toFixed(2)} DH</div>
                        <p className="text-xs text-muted-foreground mt-1">Total client balance</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.productCount || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Items in inventory</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 border-2 shadow-none overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                Today's Revenue
                            </CardTitle>
                            <div className="text-right">
                                <div className="text-2xl font-black text-primary">{todayTotal.toFixed(2)} DH</div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Today</div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[280px] pt-6 pr-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                <XAxis
                                    dataKey="hour"
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={8}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-5}
                                    tickFormatter={(v) => `${v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.2)'
                                    }}
                                    formatter={(value: number, name: string) => [`${value.toFixed(2)} DH`, name]}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '10px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="cash"
                                    name="Cash"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#cashGradient)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="debt"
                                    name="Debt"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    fill="url(#debtGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3 border-2 shadow-none overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            Low Stock Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {stats?.lowStock?.length === 0 ? (
                                <div className="py-20 text-center text-muted-foreground text-sm">All items healthy!</div>
                            ) : (
                                stats?.lowStock?.map((p: any) => (
                                    <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                        <div className="font-bold text-sm">{p.name}</div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-mono font-bold text-destructive">{p.stock} left</span>
                                            <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold" onClick={() => window.location.href = '/inventory'}>RESTOCK</Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
