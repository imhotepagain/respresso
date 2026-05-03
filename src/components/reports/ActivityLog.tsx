import { useState, useEffect, useCallback } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { ChevronLeft, ChevronRight, Search, FilterX } from 'lucide-react'

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        return () => clearTimeout(handler)
    }, [value, delay])
    return debouncedValue
}

interface ActivityLogProps {
    initialUserId?: string
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}

export function ActivityLog({ initialUserId }: ActivityLogProps) {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)

    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 500)
    const [type, setType] = useState('ALL')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const result = await window.api.getActivityLogs({
                page,
                limit: 15,
                userId: initialUserId,
                search: debouncedSearch,
                type: type === 'ALL' ? undefined : type,
                from: fromDate ? new Date(fromDate) : undefined,
                to: toDate ? new Date(toDate) : undefined
            })
            if (result.success) {
                setLogs(result.logs)
                setTotalPages(result.totalPages)
                setTotalCount(result.totalCount)
            }
        } catch (error) {
            console.error("Failed to fetch logs:", error)
        } finally {
            setLoading(false)
        }
    }, [page, debouncedSearch, type, fromDate, toDate, initialUserId])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, type, fromDate, toDate])

    const clearFilters = () => {
        setSearch('')
        setType('ALL')
        setFromDate('')
        setToDate('')
        setPage(1)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end justify-between bg-muted/10 p-4 rounded-xl border-2 border-dashed border-muted">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Product or note..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-background h-10 font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Type</label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="bg-background h-10 font-medium">
                                <SelectValue placeholder="All Activity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Activity</SelectItem>
                                <SelectItem value="SALE">Sale (Out)</SelectItem>
                                <SelectItem value="PURCHASE_RECEIPT">Purchase Receipt (In)</SelectItem>
                                <SelectItem value="OPENING_BALANCE">Opening Balance (In)</SelectItem>
                                <SelectItem value="ADJUSTMENT_IN">Adjustment In</SelectItem>
                                <SelectItem value="ADJUSTMENT_OUT">Adjustment Out</SelectItem>
                                <SelectItem value="RESTOCK">Legacy Restock (In)</SelectItem>
                                <SelectItem value="PAYMENT">Debt Payment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">From</label>
                        <Input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="bg-background h-10 font-medium"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">To</label>
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="bg-background h-10 font-medium flex-1"
                            />
                            {(search || type !== 'ALL' || fromDate || toDate) && (
                                <Button variant="outline" size="icon" onClick={clearFilters} className="h-10 w-10 shrink-0">
                                    <FilterX className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border-2 shadow-none overflow-hidden bg-card">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-[180px] font-bold text-xs uppercase tracking-wider">Timestamp</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Performed By</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Action</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Product / Item</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-wider">Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} className="py-8">
                                        <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                    No activity logs found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-muted/20 transition-colors">
                                    <TableCell className="font-mono text-[11px] text-muted-foreground">
                                        {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                {(log.user?.name || 'S').charAt(0)}
                                            </div>
                                            <span className="font-bold text-sm">{log.user?.name || 'System'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {log.type === 'PAYMENT' ? (
                                            <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none font-bold text-[10px]">PAYMENT</Badge>
                                        ) : (
                                            <Badge variant={log.change > 0 ? 'outline' : 'secondary'} className={cn(
                                                "font-bold text-[10px]",
                                                log.change < 0 ? 'bg-blue-500/10 text-blue-600 border-blue-200' : 'bg-orange-500/10 text-orange-600 border-orange-200'
                                            )}>
                                                {log.change > 0 ? 'STOCK IN' : 'STOCK OUT'} ({Math.abs(log.change)})
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">
                                        {log.product?.name || (log.type === 'PAYMENT' ? <span className="text-muted-foreground">—</span> : 'Deleted Item')}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs italic max-w-[250px] truncate" title={log.note}>
                                        {log.note || "No notes"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between px-2 py-4">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Total: {totalCount} activities tracked
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-xs font-bold px-3">
                        PAGE {page} OF {Math.max(1, totalPages)}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || loading}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
