import React, { useState, useEffect } from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { Loader2, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'
import { toast } from 'sonner'

export function FinancialAnalytics() {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [period])

    const fetchStats = async () => {
        setLoading(true)
        try {
            const result = await window.api.getFinancialStats(period)
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <Tabs value={period} onValueChange={(v: any) => setPeriod(v)} className="bg-muted/50 p-1 border-2 rounded-xl">
                    <TabsList className="bg-transparent border-none">
                        <TabsTrigger value="daily" className="rounded-lg font-bold px-6">DAILY</TabsTrigger>
                        <TabsTrigger value="weekly" className="rounded-lg font-bold px-6">WEEKLY</TabsTrigger>
                        <TabsTrigger value="monthly" className="rounded-lg font-bold px-6">MONTHLY</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-2 shadow-sm bg-emerald-500/5 border-emerald-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" /> Gross Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-600">{stats?.revenue.toFixed(2)} DH</div>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Inflow from all sources</p>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm bg-destructive/5 border-destructive/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" /> Total Expenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-destructive">-{stats?.expenses.toFixed(2)} DH</div>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Bills, Restocks & Outflows</p>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Wallet className="w-4 h-4" /> Net Profit
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats?.profit.toFixed(2)} DH</div>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-widest">Take-home earnings</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-2 shadow-xl overflow-hidden rounded-3xl">
                <CardHeader className="bg-muted/10 border-b px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-black uppercase tracking-tight">Revenue vs Expenses</CardTitle>
                            <CardDescription className="font-medium">Comparing business inflow and outflow over time</CardDescription>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-destructive" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Expenses</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="h-[450px] p-8">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                                axisLine={false}
                                tickLine={false}
                                dx={-10}
                                tickFormatter={(value) => `${value} DH`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '16px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                            <Area
                                type="monotone"
                                dataKey="expenses"
                                stroke="hsl(var(--destructive))"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorExpenses)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
