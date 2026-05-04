import React, { useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    BarChart as BarChartIcon,
    Download,
    DollarSign,
    Users,
    Activity,
    CalendarDays,
    ArrowRight,
    ArrowLeft,
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/providers/AuthProvider"
import { FinancialAnalytics } from "@/components/reports/FinancialAnalytics"
import { ActivityLog } from "@/components/reports/ActivityLog"
import { StaffPerformance } from "@/components/reports/StaffPerformance"
import { DailySnapshots } from "@/components/reports/DailySnapshots"
import { DailyReportDetail } from "@/components/reports/DailyReportDetail"
import { toast } from "sonner"

// Helper to format date as YYYY-MM-DD for input[type="date"]
const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Preset range helpers
const getPresetRange = (preset: string): [string, string] => {
    const now = new Date()
    const end = formatDateInput(now)

    switch (preset) {
        case 'today': {
            return [end, end]
        }
        case 'week': {
            const start = new Date(now)
            start.setDate(start.getDate() - 7)
            return [formatDateInput(start), end]
        }
        case 'month': {
            const start = new Date(now)
            start.setDate(start.getDate() - 30)
            return [formatDateInput(start), end]
        }
        case 'quarter': {
            const start = new Date(now)
            start.setDate(start.getDate() - 90)
            return [formatDateInput(start), end]
        }
        default: {
            const start = new Date(now)
            start.setDate(start.getDate() - 7)
            return [formatDateInput(start), end]
        }
    }
}

export const Reports: React.FC = () => {
    useAuth()
    const [activeTab, setActiveTab] = useState("financial")
    const [view, setView] = useState<'main' | 'daily' | 'detail'>('main')
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const triggerRefresh = () => setRefreshKey(prev => prev + 1)

    // Date range state — default to last 7 days
    const [dateRange, setDateRange] = useState(() => {
        const [from, to] = getPresetRange('week')
        return { from, to }
    })
    const [activePreset, setActivePreset] = useState('week')

    const handlePreset = (preset: string) => {
        const [from, to] = getPresetRange(preset)
        setDateRange({ from, to })
        setActivePreset(preset)
    }

    const handleCustomDate = (field: 'from' | 'to', value: string) => {
        setDateRange(prev => ({ ...prev, [field]: value }))
        setActivePreset('')
    }

    // CSV Export
    const handleExport = async () => {
        // ... (existing export logic remains same)
        try {
            if (activeTab === 'financial') {
                const result = await window.api.getFinancialStats({ from: dateRange.from, to: dateRange.to })
                if (!result.success || !result.stats) {
                    toast.error('Failed to fetch data for export')
                    return
                }
                const s = result.stats

                // Build CSV rows
                const rows: string[][] = []
                rows.push(['GLISSA POS — Financial Report'])
                rows.push([`Period: ${dateRange.from} to ${dateRange.to}`])
                rows.push([])
                rows.push(['--- REVENUE ---'])
                rows.push(['Source', 'Amount (DH)'])
                rows.push(['Orders', s.revenueFromOrders.toFixed(2)])
                rows.push(['Sessions', s.revenueFromSessions.toFixed(2)])
                rows.push(['Debt Payments', s.revenueFromDebt.toFixed(2)])
                rows.push(['TOTAL REVENUE', s.revenue.toFixed(2)])
                rows.push([])
                rows.push(['--- EXPENSES ---'])
                rows.push(['Category', 'Amount (DH)'])
                s.expensesByCategory.forEach(e => {
                    rows.push([e.category, e.amount.toFixed(2)])
                })
                rows.push(['TOTAL EXPENSES', s.expenses.toFixed(2)])
                rows.push([])
                rows.push(['NET PROFIT', s.profit.toFixed(2)])
                rows.push([])
                rows.push(['--- DAILY BREAKDOWN ---'])
                rows.push(['Date', 'Revenue (DH)', 'Expenses (DH)'])
                s.revenueByDay.forEach((rev, idx) => {
                    rows.push([rev.date, rev.amount.toFixed(2), (s.expensesByDay[idx]?.amount || 0).toFixed(2)])
                })

                const csvContent = rows.map(r => r.join(',')).join('\n')
                downloadCSV(csvContent, `glissa-financials-${dateRange.from}-to-${dateRange.to}.csv`)
                toast.success('Financial report exported')

            } else if (activeTab === 'staff') {
                const result = await window.api.getStaffPerformance({ from: dateRange.from, to: dateRange.to })
                if (!result.success || !result.staff) {
                    toast.error('Failed to fetch data for export')
                    return
                }

                const rows: string[][] = []
                rows.push(['GLISSA POS — Staff Performance Report'])
                rows.push([`Period: ${dateRange.from} to ${dateRange.to}`])
                rows.push([])
                rows.push(['Name', 'Role', 'Orders', 'Revenue (DH)', 'Cash Revenue (DH)', 'Shifts', 'Hours Worked'])
                result.staff.forEach(s => {
                    const hours = Math.floor(s.shiftMinutes / 60)
                    const mins = s.shiftMinutes % 60
                    rows.push([s.name, s.role, String(s.ordersCount), s.ordersRevenue.toFixed(2), s.cashRevenue.toFixed(2), String(s.shiftsCount), `${hours}h ${mins}m`])
                })

                const csvContent = rows.map(r => r.join(',')).join('\n')
                downloadCSV(csvContent, `glissa-staff-${dateRange.from}-to-${dateRange.to}.csv`)
                toast.success('Staff report exported')

            } else {
                toast.info('Activity log export is not supported yet')
            }
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Export failed')
        }
    }

    const downloadCSV = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const presets = [
        { key: 'today', label: 'Today' },
        { key: 'week', label: '7 Days' },
        { key: 'month', label: '30 Days' },
        { key: 'quarter', label: '90 Days' },
    ]
    const selectedDays = Math.max(
        1,
        Math.floor(
            (new Date(dateRange.to).setHours(0, 0, 0, 0) - new Date(dateRange.from).setHours(0, 0, 0, 0)) /
            (24 * 60 * 60 * 1000)
        ) + 1
    )

    if (view === 'daily') {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="rounded-full border-2" onClick={() => setView('main')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Daily Snapshots</h1>
                        <p className="text-muted-foreground font-medium">Historical breakdown for the selected period.</p>
                    </div>
                </div>
                <DailySnapshots 
                    key={`snap-${refreshKey}`}
                    from={dateRange.from} 
                    to={dateRange.to} 
                    onSelectDay={(date) => {
                        setSelectedDate(date)
                        setView('detail')
                    }} 
                />
            </div>
        )
    }

    if (view === 'detail' && selectedDate) {
        return (
            <DailyReportDetail 
                date={selectedDate} 
                onBack={() => setView('daily')} 
            />
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <BarChartIcon className="h-10 w-10 text-primary" /> Reports & Analytics
                    </h1>
                    <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.2em] mt-1">Audit, Performance, and Business Intelligence</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="font-black h-10 border-2 gap-2" 
                        onClick={() => setView('daily')}
                    >
                        <CalendarDays className="h-4 w-4" /> Daily Audits
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="font-black h-10 border-2 gap-2 text-primary border-primary/20 bg-primary/5"
                        onClick={triggerRefresh}
                    >
                        <Activity className={cn("h-4 w-4", refreshKey > 0 && "animate-pulse")} /> Refresh
                    </Button>
                    <Button className="font-black h-10 px-6 gap-2" onClick={handleExport}>
                        <Download className="h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Date Range Controls */}
            <div className="p-4 bg-card border-2 rounded-2xl shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-end gap-4">
                    <div className="flex items-center gap-3 min-w-[220px]">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm font-black uppercase tracking-widest text-muted-foreground">Period</div>
                            <div className="text-xs font-semibold text-muted-foreground">{selectedDays} day{selectedDays > 1 ? 's' : ''} selected</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                    {presets.map(p => (
                        <Button
                            key={p.key}
                            variant={activePreset === p.key ? "default" : "outline"}
                            size="sm"
                            className="font-bold h-9 px-4 text-xs"
                            onClick={() => handlePreset(p.key)}
                        >
                            {p.label}
                        </Button>
                    ))}
                    </div>

                    <div className="flex items-end gap-3 xl:ml-auto">
                        <div className="space-y-1">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">From</Label>
                            <Input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => handleCustomDate('from', e.target.value)}
                                className="h-10 w-[170px] font-semibold text-sm bg-background rounded-xl"
                            />
                        </div>
                        <div className="pb-2 text-muted-foreground"><ArrowRight className="h-4 w-4" /></div>
                        <div className="space-y-1">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">To</Label>
                            <Input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => handleCustomDate('to', e.target.value)}
                                className="h-10 w-[170px] font-semibold text-sm bg-background rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-muted/50 p-1 border-2 rounded-xl">
                    <TabsTrigger value="financial" className="rounded-lg px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
                        <DollarSign className="h-4 w-4" /> FINANCIALS
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="rounded-lg px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
                        <Users className="h-4 w-4" /> STAFF
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="rounded-lg px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
                        <Activity className="h-4 w-4" /> ACTIVITY LOG
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="financial" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <FinancialAnalytics key={`fin-${refreshKey}`} from={dateRange.from} to={dateRange.to} />
                </TabsContent>

                <TabsContent value="staff" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <StaffPerformance key={`perf-${refreshKey}`} from={dateRange.from} to={dateRange.to} />
                </TabsContent>

                <TabsContent value="activity" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ActivityLog key={`act-${refreshKey}`} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
