import React, { useState, useEffect } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    BarChart as BarChartIcon,
    Download,
    Loader2,
    Activity,
    PieChart as PieChartIcon,
    DollarSign
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/AuthProvider"
import { AnalyticsCharts } from "@/components/reports/AnalyticsCharts"
import { ActivityLog } from "@/components/reports/ActivityLog"
import { FinancialAnalytics } from "@/components/reports/FinancialAnalytics"





export const Reports: React.FC = () => {
    useAuth()
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



            const [analyticsResult] = await Promise.all([
                window.api.getAnalytics({ days: 7 })
            ])

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
