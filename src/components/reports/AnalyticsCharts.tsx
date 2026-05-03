import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

type AnalyticsProps = {
    data: {
        trend: { date: string, revenue: number, cash: number, debt: number }[]
        categoryData: { name: string, value: number }[]
        topProducts: { name: string, value: number }[]
    }
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export function AnalyticsCharts({ data }: AnalyticsProps) {
    // Filter out rows with null/empty names and format category data
    const categoryData = data.categoryData
        .filter(cat => cat.name && cat.name !== 'null')
        .map(cat => ({ ...cat, name: cat.name.toUpperCase() }))

    const trendData = data.trend.map(d => ({
        ...d,
        // Shorten dates if they are long
        date: d.date.split('/').slice(0, 2).join('/') // mm/dd format
    }))

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Main Sales Trend Chart - spans 2 columns */}
                <Card className="md:col-span-2 border-2 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b px-6 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Sales Performance Trend</CardTitle>
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">LAST 7 DAYS</span>
                        </div>
                    </CardHeader>
                    <CardContent className="h-[400px] pt-8 px-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
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
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Legend
                                    verticalAlign="top"
                                    align="right"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '20px' }}
                                />
                                <Bar dataKey="cash" name="Cash Sales" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="debt" name="Credit (Debt)" stackId="a" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Breakdown (Donut) */}
                <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b px-6 py-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Units by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px] pt-4">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                    <Legend
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        formatter={(value) => <span className="text-[10px] uppercase font-bold text-muted-foreground">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">
                                No category data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top 5 Products (Vertical Bar) */}
                <Card className="md:col-span-3 border-2 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/10 border-b px-6 py-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary">Most Sold Items (Top 5)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] pt-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={data.topProducts}
                                margin={{ top: 5, right: 60, left: 40, bottom: 5 }}
                                barSize={40}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.3} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={140}
                                    tick={{ fontSize: 12, fontWeight: 800, fill: '#94a3b8' }}
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
                                />
                                <Bar
                                    dataKey="value"
                                    name="Units Sold"
                                    fill="#3b82f6"
                                    radius={[0, 8, 8, 0]}
                                    label={{ position: 'right', fontSize: 12, fontWeight: 900, fill: '#94a3b8' }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
