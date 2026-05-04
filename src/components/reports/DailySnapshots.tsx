import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { Loader2, Calendar, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface DailySnapshotsProps {
    from: string
    to: string
    onSelectDay: (date: string) => void
}

export const DailySnapshots: React.FC<DailySnapshotsProps> = ({ from, to, onSelectDay }) => {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [from, to])

    const fetchData = async () => {
        setLoading(true)
        try {
            const result = await window.api.getFinancialStats({ from, to })
            if (result.success && result.stats) {
                // Combine revenueByDay and expensesByDay
                const combined = result.stats.revenueByDay.map((rev: any) => {
                    const exp = result.stats!.expensesByDay.find((e: any) => e.date === rev.date) || { amount: 0 }
                    return {
                        date: rev.date,
                        revenue: rev.amount,
                        expenses: exp.amount,
                        net: rev.amount - exp.amount
                    }
                }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                
                setData(combined)
            } else {
                toast.error("Failed to load daily summaries")
            }
        } catch (error) {
            toast.error("An error occurred while loading summaries")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="h-60 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <Card className="border-2 border-dashed bg-muted/5">
                <CardContent className="h-40 flex flex-col items-center justify-center text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2 opacity-20" />
                    <p className="font-medium">No snapshots available for this period.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-2 shadow-sm overflow-hidden rounded-2xl">
            <CardHeader className="bg-muted/10 border-b px-8 py-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-black uppercase tracking-tight">Daily Snapshots</CardTitle>
                        <CardDescription className="text-xs font-medium">Click any day to open a full detail view of what happened.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {data.map((day) => (
                        <button
                            key={day.date}
                            onClick={() => onSelectDay(day.date)}
                            className="group flex flex-col text-left p-4 rounded-2xl border-2 hover:border-primary/50 hover:bg-primary/[0.02] transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-black text-lg">
                                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" /> Revenue
                                    </span>
                                    <span className="font-black text-emerald-600">+{day.revenue.toFixed(2)} DH</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                                        <TrendingDown className="h-3 w-3" /> Expenses
                                    </span>
                                    <span className="font-black text-red-500">-{day.expenses.toFixed(2)} DH</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                        <Wallet className="h-3 w-3" /> Net
                                    </span>
                                    <span className={cn(
                                        "font-black tabular-nums",
                                        day.net >= 0 ? "text-emerald-600" : "text-red-500"
                                    )}>
                                        {day.net.toFixed(2)} DH
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
