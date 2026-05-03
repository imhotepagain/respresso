import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import { 
    Loader2, 
    TrendingUp, 
    TrendingDown, 
    Wallet, 
    ShoppingBag, 
    Gamepad2, 
    ArrowLeft, 
    Calendar,
    ChevronRight,
    Package,
    Clock,
    User,
    ArrowUpRight,
    ArrowDownRight,
    Trophy,
    History
} from 'lucide-react'
import { Button } from "../ui/button"
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface DailyReportDetailProps {
    date: string
    onBack: () => void
}

export const DailyReportDetail: React.FC<DailyReportDetailProps> = ({ date, onBack }) => {
    const [details, setDetails] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDetails()
    }, [date])

    const fetchDetails = async () => {
        setLoading(true)
        try {
            const result = await window.api.getDailyReportDetails({ date })
            if (result.success) {
                setDetails(result.details)
            } else {
                toast.error("Failed to load day details")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="h-96 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
            </div>
        )
    }

    if (!details) return null

    const { summary, revenue, expensesByCategory, orders, sessions, debtPayments, inventoryMovements, topProducts } = details

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="rounded-full h-12 w-12 border-2" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Calendar className="h-8 w-8 text-primary" /> 
                            {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </h1>
                        <p className="text-muted-foreground font-medium">Complete audit of all activities and financial movements for this day.</p>
                    </div>
                </div>
            </div>

            {/* KPI Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-2 bg-emerald-500/5 border-emerald-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Daily Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-600">{summary.revenue.toFixed(2)} DH</div>
                    </CardContent>
                </Card>
                <Card className="border-2 bg-red-500/5 border-red-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-red-500">Daily Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-red-500">-{summary.expenses.toFixed(2)} DH</div>
                    </CardContent>
                </Card>
                <Card className="border-2 bg-primary/5 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Net Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-black", summary.profit >= 0 ? "text-primary" : "text-red-500")}>
                            {summary.profit.toFixed(2)} DH
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{summary.ordersCount}</div>
                    </CardContent>
                </Card>
                <Card className="border-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{summary.sessionsCount}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Financial Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b px-6 py-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Wallet className="h-4 w-4" /> Financial Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="p-6 border-b md:border-b-0 md:border-r">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3" /> Revenue Sources
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-muted-foreground">Store Orders</span>
                                            <span className="font-black text-emerald-600">+{revenue.orders.toFixed(2)} DH</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-muted-foreground">Gaming Sessions</span>
                                            <span className="font-black text-emerald-600">+{revenue.sessions.toFixed(2)} DH</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-muted-foreground">Debt Payments</span>
                                            <span className="font-black text-emerald-600">+{revenue.debtPayments.toFixed(2)} DH</span>
                                        </div>
                                        <div className="pt-3 border-t flex justify-between items-center">
                                            <span className="text-sm font-black uppercase">Total Revenue</span>
                                            <span className="text-lg font-black text-emerald-600">+{summary.revenue.toFixed(2)} DH</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                                        <TrendingDown className="h-3 w-3" /> Expense Categories
                                    </h3>
                                    <div className="space-y-4">
                                        {expensesByCategory.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">No expenses recorded for today.</p>
                                        ) : (
                                            expensesByCategory.map((exp: any) => (
                                                <div key={exp.category} className="flex justify-between items-center">
                                                    <span className="text-sm font-bold text-muted-foreground">{exp.category}</span>
                                                    <span className="font-black text-red-500">-{exp.amount.toFixed(2)} DH</span>
                                                </div>
                                            ))
                                        )}
                                        <div className="pt-3 border-t flex justify-between items-center">
                                            <span className="text-sm font-black uppercase">Total Expenses</span>
                                            <span className="text-lg font-black text-red-500">-{summary.expenses.toFixed(2)} DH</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b px-6 py-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Trophy className="h-4 w-4" /> Top Selling Products
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {topProducts.map((p: any, idx: number) => (
                                    <div key={p.name} className="p-4 rounded-xl bg-muted/30 border-2 border-transparent hover:border-primary/20 transition-colors">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Rank #{idx+1}</div>
                                        <div className="font-black truncate mb-2">{p.name}</div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Quantity</div>
                                                <div className="text-xl font-black">{p.quantity}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Revenue</div>
                                                <div className="text-sm font-black text-emerald-600">{p.revenue.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {topProducts.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-muted-foreground font-medium italic">No products sold today.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Inventory & Staff */}
                <div className="space-y-6">
                    <Card className="border-2 shadow-sm rounded-2xl overflow-hidden h-full">
                        <CardHeader className="bg-muted/10 border-b px-6 py-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Package className="h-4 w-4" /> Inventory Movements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                            {inventoryMovements.length === 0 ? (
                                <p className="text-center py-10 text-muted-foreground font-medium italic">No inventory activity today.</p>
                            ) : (
                                inventoryMovements.map((log: any) => (
                                    <div key={log.id} className="p-3 rounded-xl border bg-card flex flex-col gap-2">
                                        <div className="flex justify-between items-start">
                                            <Badge variant={log.change > 0 ? "default" : "destructive"} className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                                                {log.type.replace('_', ' ')}
                                            </Badge>
                                            <span className="text-[10px] font-bold text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="font-black text-sm">{log.productName}</div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className={cn(
                                                "text-xs font-black px-2 py-0.5 rounded-lg",
                                                log.change > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"
                                            )}>
                                                {log.change > 0 ? '+' : ''}{log.change} units
                                            </span>
                                            {log.cost > 0 && <span className="text-[11px] font-black text-red-500">-{log.cost.toFixed(2)} DH</span>}
                                        </div>
                                        {log.note && <div className="text-[10px] text-muted-foreground italic border-t pt-2 mt-1">{log.note}</div>}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Full Transaction History */}
            <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/10 border-b px-8 py-5">
                    <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" /> Daily Activity Log
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">Detailed list of all orders, sessions and payments processed today.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[100px]">Time</TableHead>
                                <TableHead>Activity</TableHead>
                                <TableHead>Customer / Post</TableHead>
                                <TableHead>Staff</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Combine all events into a single sorted timeline */}
                            {[
                                ...orders.map(o => ({ ...o, eventType: 'ORDER', timestamp: new Date(o.createdAt).getTime() })),
                                ...sessions.map(s => ({ ...s, eventType: 'SESSION', timestamp: new Date(s.startTime).getTime() })),
                                ...debtPayments.map(p => ({ ...p, eventType: 'PAYMENT', timestamp: new Date(p.createdAt).getTime() }))
                            ].sort((a, b) => b.timestamp - a.timestamp).map((event: any, idx: number) => (
                                <TableRow key={idx} className="hover:bg-muted/20 transition-colors">
                                    <TableCell className="font-bold text-xs">
                                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {event.eventType === 'ORDER' ? <ShoppingBag className="h-3 w-3 text-blue-500" /> : 
                                             event.eventType === 'SESSION' ? <Gamepad2 className="h-3 w-3 text-purple-500" /> : 
                                             <Wallet className="h-3 w-3 text-emerald-500" />}
                                            <span className="font-black text-xs uppercase tracking-wider">{event.eventType}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs font-bold">
                                        {event.clientName || event.userName || (event.postNumber ? `PS ${event.postNumber}` : 'General')}
                                    </TableCell>
                                    <TableCell className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                                        {event.staffName || 'System'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="px-2 py-0 text-[9px] font-black uppercase">
                                            {event.isPaid === false ? 'Unpaid' : 'Completed'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-black tabular-nums text-emerald-600">
                                        +{(event.total || event.cost || event.amount || 0).toFixed(2)} DH
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(orders.length === 0 && sessions.length === 0 && debtPayments.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium italic">
                                        No transactions recorded for this day.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
