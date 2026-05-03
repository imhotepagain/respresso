import { useState, useEffect } from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"

import { Loader2, TrendingUp, TrendingDown, Wallet, ShoppingBag, Gamepad2, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FinancialAnalyticsProps {
    from: string
    to: string
}

function DeltaBadge({ value }: { value: number }) {
    if (value === 0) return null
    const isPositive = value > 0
    return (
        <div className={cn(
            "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black",
            isPositive
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
        )}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {isPositive ? '+' : ''}{value}%
        </div>
    )
}

export function FinancialAnalytics({ from, to }: FinancialAnalyticsProps) {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [from, to])

    const fetchStats = async () => {
        setLoading(true)
        try {
            const result = await window.api.getFinancialStats({ from, to })
            if (result.success) {
                setStats(result.stats)
            } else {
                toast.error("Failed to fetch financial stats")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    if (loading && !stats) {
        return (
            <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            </div>
        )
    }

    // Combine revenue and expenses data for the chart
    const chartData = stats?.revenueByDay.map((rev: any, idx: number) => ({
        date: rev.date,
        revenue: rev.amount,
        expenses: stats.expensesByDay[idx]?.amount || 0
    }))

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="border-2 shadow-sm bg-emerald-500/5 border-emerald-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5" /> Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl font-black text-emerald-600">{stats?.revenue.toFixed(2)} <span className="text-xs font-bold text-muted-foreground">DH</span></div>
                        <div className="mt-1.5">
                            <DeltaBadge value={stats?.deltas?.revenue || 0} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm bg-destructive/5 border-destructive/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                            <TrendingDown className="w-3.5 h-3.5" /> Expenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl font-black text-destructive">-{stats?.expenses.toFixed(2)} <span className="text-xs font-bold text-muted-foreground">DH</span></div>
                        <div className="mt-1.5">
                            <DeltaBadge value={stats?.deltas?.expenses ? -stats.deltas.expenses : 0} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5" /> Net Profit
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className={cn("text-2xl font-black", (stats?.profit || 0) >= 0 ? "text-foreground" : "text-destructive")}>
                            {stats?.profit.toFixed(2)} <span className="text-xs font-bold text-muted-foreground">DH</span>
                        </div>
                        <div className="mt-1.5">
                            <DeltaBadge value={stats?.deltas?.profit || 0} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm bg-blue-500/5 border-blue-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5" /> Orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl font-black">{stats?.ordersCount || 0}</div>
                        <div className="mt-1.5">
                            <DeltaBadge value={stats?.deltas?.orders || 0} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm bg-purple-500/5 border-purple-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-purple-500 flex items-center gap-2">
                            <Gamepad2 className="w-3.5 h-3.5" /> Sessions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="text-2xl font-black">{stats?.sessionsCount || 0}</div>
                        <div className="mt-1.5">
                            <DeltaBadge value={stats?.deltas?.sessions || 0} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue vs Expenses Chart */}
            <Card className="border-2 shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="bg-muted/10 border-b px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-black uppercase tracking-tight">Revenue vs Expenses</CardTitle>
                            <CardDescription className="font-medium text-xs mt-0.5">Inflow and outflow over the selected period</CardDescription>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-destructive" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Expenses</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="h-[350px] p-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevFinance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpFinance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                dy={8}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                dx={-5}
                                tickFormatter={(value) => `${value}`}
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
                                formatter={(value: any, name: any) => [`${Number(value).toFixed(2)} DH`, name]}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorRevFinance)"
                            />
                            <Area
                                type="monotone"
                                dataKey="expenses"
                                name="Expenses"
                                stroke="hsl(var(--destructive))"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorExpFinance)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Product Comparison Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 shadow-sm overflow-hidden rounded-2xl">
                    <CardHeader className="bg-muted/10 border-b px-6 py-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4" /> Revenue Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={stats?.productComparison || []} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={70} 
                                    outerRadius={100} 
                                    paddingAngle={5}
                                >
                                    {(stats?.productComparison || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.2)'
                                    }}
                                    formatter={(value: any) => [`${Number(value).toFixed(2)} DH`, 'Revenue']}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm overflow-hidden rounded-2xl">
                    <CardHeader className="bg-muted/10 border-b px-6 py-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <BarChartIcon className="h-4 w-4" /> Category Comparison
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.productComparison || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={8} />
                                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip 
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.2)'
                                    }}
                                    formatter={(value: any) => [`${Number(value).toFixed(2)} DH`, 'Revenue']}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {(stats?.productComparison || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* P&L Statement */}
            <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/10 border-b px-6 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> Profit & Loss Statement
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                        {/* Revenue Column */}
                        <div className="flex-1 p-6 md:border-r border-b md:border-b-0">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b">
                                <span className="font-black text-xs uppercase tracking-wider text-muted-foreground">Revenue Sources</span>
                                <span className="font-black text-xs uppercase tracking-wider text-muted-foreground text-right">Amount (DH)</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                            <ShoppingBag className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <span className="font-bold text-sm text-foreground/80 group-hover:text-foreground transition-colors">Orders</span>
                                    </div>
                                    <span className="font-black text-emerald-600">+{(stats?.revenueFromOrders || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                            <Gamepad2 className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <span className="font-bold text-sm text-foreground/80 group-hover:text-foreground transition-colors">Sessions</span>
                                    </div>
                                    <span className="font-black text-emerald-600">+{(stats?.revenueFromSessions || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                            <Wallet className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <span className="font-bold text-sm text-foreground/80 group-hover:text-foreground transition-colors">Debt Payments</span>
                                    </div>
                                    <span className="font-black text-emerald-600">+{(stats?.revenueFromDebt || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t flex justify-between items-center bg-emerald-500/5 -mx-6 -mb-6 p-6">
                                <span className="font-black text-base uppercase tracking-tight text-emerald-700 dark:text-emerald-500">Total Revenue</span>
                                <span className="text-xl font-black text-emerald-600">+{(stats?.revenue || 0).toFixed(2)} DH</span>
                            </div>
                        </div>

                        {/* Expenses Column */}
                        <div className="flex-1 p-6 bg-muted/5 md:bg-transparent flex flex-col">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b">
                                <span className="font-black text-xs uppercase tracking-wider text-muted-foreground">Operating Expenses</span>
                                <span className="font-black text-xs uppercase tracking-wider text-muted-foreground text-right">Amount (DH)</span>
                            </div>
                            <div className="space-y-4 flex-1">
                                {(!stats?.expensesByCategory || stats.expensesByCategory.length === 0) ? (
                                    <div className="text-sm font-medium text-muted-foreground py-2 italic text-center mt-4">No expenses recorded for this period.</div>
                                ) : (
                                    stats?.expensesByCategory?.map((exp: any) => (
                                        <div key={exp.category} className="flex justify-between items-center group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                                                    <TrendingDown className="h-4 w-4 text-destructive" />
                                                </div>
                                                <span className="font-bold text-sm text-foreground/80 group-hover:text-foreground transition-colors">{exp.category}</span>
                                            </div>
                                            <span className="font-black text-destructive">-{exp.amount.toFixed(2)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-6 pt-4 border-t flex justify-between items-center bg-destructive/5 -mx-6 -mb-6 p-6">
                                <span className="font-black text-base uppercase tracking-tight text-destructive">Total Expenses</span>
                                <span className="text-xl font-black text-destructive">-{(stats?.expenses || 0).toFixed(2)} DH</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bottom Line Summary */}
                    <div className={cn(
                        "p-6 md:p-8 border-t-4 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors",
                        (stats?.profit || 0) >= 0 ? "bg-primary/[0.04] border-primary/20" : "bg-destructive/[0.04] border-destructive/20"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                                (stats?.profit || 0) >= 0 ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                            )}>
                                {(stats?.profit || 0) >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                            </div>
                            <div>
                                <span className="block font-black text-sm uppercase tracking-widest text-muted-foreground">Net Position</span>
                                <span className={cn("block text-2xl font-black tracking-tight", (stats?.profit || 0) >= 0 ? "text-primary" : "text-destructive")}>
                                    {(stats?.profit || 0) >= 0 ? 'PROFIT' : 'LOSS'}
                                </span>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <span className="block font-bold text-xs uppercase tracking-widest text-muted-foreground mb-1">Total Net Income</span>
                            <span className={cn(
                                "text-4xl font-black tracking-tighter drop-shadow-sm",
                                (stats?.profit || 0) >= 0 ? "text-primary" : "text-destructive"
                            )}>
                                {(stats?.profit || 0).toFixed(2)} <span className="text-xl font-bold opacity-70">DH</span>
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
