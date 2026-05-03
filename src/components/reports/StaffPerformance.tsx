import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Loader2, Trophy, ShoppingBag, Clock, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

interface StaffMember {
    id: string
    name: string
    role: string
    ordersCount: number
    ordersRevenue: number
    cashRevenue: number
    shiftsCount: number
    shiftMinutes: number
}

interface StaffPerformanceProps {
    from: string
    to: string
}

export function StaffPerformance({ from, to }: StaffPerformanceProps) {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [from, to])

    const fetchData = async () => {
        setLoading(true)
        try {
            const result = await window.api.getStaffPerformance({ from, to })
            if (result.success && result.staff) {
                setStaff(result.staff)
            }
        } catch (error) {
            console.error('Failed to fetch staff performance:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatMinutes = (mins: number) => {
        if (mins < 60) return `${mins}m`
        const h = Math.floor(mins / 60)
        const m = mins % 60
        return m > 0 ? `${h}h ${m}m` : `${h}h`
    }

    if (loading) {
        return (
            <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            </div>
        )
    }

    if (staff.length === 0) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <UserIcon className="h-16 w-16 opacity-20" />
                <p className="font-bold text-lg">No staff members found</p>
                <p className="text-sm">Add team members from the Team page to see their performance here.</p>
            </div>
        )
    }

    const chartData = staff.map(s => ({
        name: s.name,
        revenue: Math.round(s.ordersRevenue * 100) / 100,
    }))

    const totalRevenue = staff.reduce((sum, s) => sum + s.ordersRevenue, 0)
    const totalOrders = staff.reduce((sum, s) => sum + s.ordersCount, 0)

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 shadow-sm bg-primary/5 border-primary/10">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-primary">Team Orders</div>
                            <div className="text-2xl font-black">{totalOrders}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-2 shadow-sm bg-emerald-500/5 border-emerald-500/10">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <Trophy className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Team Revenue</div>
                            <div className="text-2xl font-black text-emerald-600">{totalRevenue.toFixed(2)} DH</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Staff Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map((member, index) => (
                    <Card
                        key={member.id}
                        className={cn(
                            "border-2 shadow-sm overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md",
                            index === 0 && member.ordersRevenue > 0 && "border-amber-400/40 bg-amber-500/[0.03]"
                        )}
                    >
                        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "h-11 w-11 rounded-full flex items-center justify-center font-black text-lg",
                                    index === 0 && member.ordersRevenue > 0
                                        ? "bg-amber-500/20 text-amber-500 ring-2 ring-amber-400/30"
                                        : member.role === 'OWNER'
                                            ? "bg-purple-500/10 text-purple-500"
                                            : "bg-blue-500/10 text-blue-500"
                                )}>
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-black text-base flex items-center gap-2">
                                        {member.name}
                                        {index === 0 && member.ordersRevenue > 0 && (
                                            <Trophy className="h-4 w-4 text-amber-500" />
                                        )}
                                    </div>
                                    <Badge variant={member.role === 'OWNER' ? 'default' : 'secondary'} className={cn(
                                        "text-[9px] font-bold px-2 py-0",
                                        member.role === 'OWNER' ? "bg-purple-600" : ""
                                    )}>
                                        {member.role}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="bg-muted/30 rounded-xl p-3">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Orders</div>
                                    <div className="text-xl font-black mt-0.5">{member.ordersCount}</div>
                                </div>
                                <div className="bg-muted/30 rounded-xl p-3">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Revenue</div>
                                    <div className="text-xl font-black mt-0.5 text-primary">{member.ordersRevenue.toFixed(0)} <span className="text-xs text-muted-foreground">DH</span></div>
                                </div>
                                <div className="bg-muted/30 rounded-xl p-3">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Shifts
                                    </div>
                                    <div className="text-xl font-black mt-0.5">{member.shiftsCount}</div>
                                </div>
                                <div className="bg-muted/30 rounded-xl p-3">
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Hours</div>
                                    <div className="text-xl font-black mt-0.5">{formatMinutes(member.shiftMinutes)}</div>
                                </div>
                            </div>
                            {member.shiftsCount > 0 && member.ordersRevenue > 0 && (
                                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg / Shift</span>
                                    <span className="font-black text-sm text-primary">
                                        {(member.ordersRevenue / member.shiftsCount).toFixed(0)} DH
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Revenue Ranking Chart */}
            {staff.some(s => s.ordersRevenue > 0) && (
                <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b px-6 py-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Trophy className="h-4 w-4" /> Revenue Ranking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px] pt-8 px-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={chartData.filter(d => d.revenue > 0)}
                                margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
                                barSize={32}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12, fontWeight: 800, fill: '#ffffff' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                    formatter={(value: any) => [`${Number(value).toFixed(2)} DH`, 'Revenue']}
                                />
                                <Bar
                                    dataKey="revenue"
                                    name="Revenue"
                                    fill="#10b981"
                                    radius={[0, 8, 8, 0]}
                                    label={{ position: 'right', fontSize: 12, fontWeight: 900, fill: '#ffffff', formatter: (v: any) => `${Number(v).toFixed(0)} DH` }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
