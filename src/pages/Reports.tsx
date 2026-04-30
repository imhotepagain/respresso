import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    BarChart as BarChartIcon,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    Download,
    Package,
    Loader2,
    Activity,
    PieChart as PieChartIcon
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/AuthProvider"
import { AnalyticsCharts } from "@/components/reports/AnalyticsCharts"
import { ActivityLog } from "@/components/reports/ActivityLog"
import { FinancialAnalytics } from "@/components/reports/FinancialAnalytics"

interface StatsType {
    revenue: {
        total: number;
        cash: number;
        debt: number;
    };
    expenses: {
        total: number;
    };
    orders: {
        count: number;
        totalAmount: number;
    };
    sessions: {
        count: number;
        totalCost: number;
        totalMinutes: number;
    };
    debtPayments: {
        total: number;
        count: number;
    };
    productStats: Record<string, {
        name: string;
        sold: number;
        revenue: number;
        restocked: number;
    }>;
}

const StatCard: React.FC<{ title: string, value: string, subValue?: string, icon: any, color?: string }> = ({ title, value, subValue, icon: Icon, color = "primary" }) => (
    <Card className="shadow-none border-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
            <div className={`p-2 rounded-lg bg-muted`}>
                <Icon className={`h-4 w-4 text-${color}`} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-black">{value}</div>
            {subValue && <p className="text-xs text-muted-foreground mt-1 font-medium">{subValue}</p>}
        </CardContent>
    </Card>
)

const SummaryTab: React.FC<{ stats: StatsType | null, subtitle: string }> = ({ stats, subtitle }) => {
    if (!stats) return <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" /></div>

    const productRows = Object.values(stats.productStats).sort((a, b) => b.revenue - a.revenue)
    const netCash = stats.revenue.cash - stats.expenses.total

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-primary font-bold bg-primary/5 px-4 py-2 rounded-full w-fit border border-primary/10">
                <Calendar className="h-4 w-4" />
                {subtitle}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Volume"
                    value={`${stats.revenue.total.toFixed(2)} DH`}
                    subValue="Cash + New Debt Sales"
                    icon={DollarSign}
                    color="primary"
                />
                <StatCard
                    title="Unpaid / New Debt"
                    value={`${stats.revenue.debt.toFixed(2)} DH`}
                    subValue="To be collected later"
                    icon={TrendingUp}
                    color="orange-600"
                />
                <StatCard
                    title="Restock Expenses"
                    value={`-${stats.expenses.total.toFixed(2)} DH`}
                    subValue="Paid from drawer"
                    icon={Package}
                    color="red-600"
                />
                <StatCard
                    title="Net Cash in Drawer"
                    value={`${netCash.toFixed(2)} DH`}
                    subValue="Cash Sales + Payments - Expenses"
                    icon={TrendingDown}
                    color="emerald-600"
                />
            </div>

            <div className="bg-card rounded-2xl border-2 shadow-none overflow-hidden">
                <div className="p-4 border-b bg-muted/30">
                    <h2 className="font-black flex items-center gap-2 uppercase tracking-tight text-sm">
                        <Package className="h-4 w-4" /> Item Breakdown
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left p-4 font-bold">Product</th>
                                <th className="text-right p-4 font-bold">Restocked</th>
                                <th className="text-right p-4 font-bold">Sold</th>
                                <th className="text-right p-4 font-bold">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {productRows.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground italic">No activity for this period.</td>
                                </tr>
                            ) : (
                                productRows.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4 font-medium">{row.name}</td>
                                        <td className="p-4 text-right text-orange-600 font-mono">
                                            {row.restocked > 0 ? `+${row.restocked}` : '-'}
                                        </td>
                                        <td className="p-4 text-right text-blue-600 font-mono">
                                            {row.sold > 0 ? `-${row.sold}` : '-'}
                                        </td>
                                        <td className="p-4 text-right font-black font-mono">
                                            {row.revenue > 0 ? `${row.revenue.toFixed(2)} DH` : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export const Reports: React.FC = () => {
    const { user } = useAuth()
    const [dailyStats, setDailyStats] = useState<StatsType | null>(null)
    const [weeklyStats, setWeeklyStats] = useState<StatsType | null>(null)
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const now = new Date()

            // Calculate start of week (Monday)
            const weekStart = new Date(now)
            const day = weekStart.getDay() || 7 // Monday is 1, Sunday is 7
            weekStart.setDate(weekStart.getDate() - day + 1)
            weekStart.setHours(0, 0, 0, 0)

            const userId = user?.role === 'STAFF' ? user.id : undefined

            const [dailyResult, weeklyResult, analyticsResult] = await Promise.all([
                window.api.getStats({
                    from: now,
                    to: now,
                    userId
                }),
                window.api.getStats({
                    from: weekStart,
                    to: now,
                    userId
                }),
                window.api.getAnalytics({ days: 7 })
            ])

            if (dailyResult.success && dailyResult.stats) {
                setDailyStats(dailyResult.stats as any)
            }
            if (weeklyResult.success && weeklyResult.stats) {
                setWeeklyStats(weeklyResult.stats as any)
            }
            if (analyticsResult.success) {
                setAnalytics(analyticsResult.data)
            }
        } catch (error) {
            console.error("Failed to fetch reports data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <BarChartIcon className="h-10 w-10 text-primary" /> Reports
                    </h1>
                    <p className="text-muted-foreground font-medium">Business performance and financial summaries.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-2 font-bold h-12 px-6" onClick={fetchData} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Refresh
                    </Button>
                    <Button variant="default" className="font-bold h-12 px-6">
                        <Download className="h-4 w-4 mr-2" /> Export
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="financial" className="space-y-8">
                <TabsList className="bg-muted/50 p-1 border-2 rounded-xl">
                    <TabsTrigger value="financial" className="rounded-lg px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
                        <DollarSign className="h-4 w-4" /> FINANCIALS
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="rounded-lg px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
                        <PieChartIcon className="h-4 w-4" /> ANALYTICS
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-lg px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
                        <Activity className="h-4 w-4" /> ACTIVITY LOG
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="financial" className="space-y-6">
                    <FinancialAnalytics />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    {analytics ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-primary/5 border-2 border-primary/10 rounded-3xl p-6 flex flex-col justify-center">
                                    <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">7D Volume</div>
                                    <div className="text-3xl font-black">{analytics.trend.reduce((sum: number, d: any) => sum + d.revenue, 0).toFixed(2)} DH</div>
                                    <div className="text-[11px] font-bold text-muted-foreground mt-2">Aggregated sales & debt</div>
                                </div>
                                <div className="bg-emerald-500/5 border-2 border-emerald-500/10 rounded-3xl p-6 flex flex-col justify-center">
                                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">7D Cash</div>
                                    <div className="text-3xl font-black text-emerald-600">{analytics.trend.reduce((sum: number, d: any) => sum + d.cash, 0).toFixed(2)} DH</div>
                                    <div className="text-[11px] font-bold text-muted-foreground mt-2">Real liquidity collected</div>
                                </div>
                                <div className="bg-orange-500/5 border-2 border-orange-500/10 rounded-3xl p-6 flex flex-col justify-center">
                                    <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">7D New Debt</div>
                                    <div className="text-3xl font-black text-orange-600">{analytics.trend.reduce((sum: number, d: any) => sum + d.debt, 0).toFixed(2)} DH</div>
                                    <div className="text-[11px] font-bold text-muted-foreground mt-2">Unpaid credit transactions</div>
                                </div>
                            </div>
                            <AnalyticsCharts data={analytics} />
                        </>
                    ) : (
                        <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" /></div>
                    )}
                </TabsContent>

                <TabsContent value="activity" className="space-y-6">
                    <ActivityLog />
                </TabsContent>
            </Tabs>
        </div>
    )
}
