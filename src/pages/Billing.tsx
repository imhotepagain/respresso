import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from '@/providers/AuthProvider'
import { Expense } from '@/types/electron'
import { format } from 'date-fns'
import {
    Loader2, Plus, Wallet, Trash2, TrendingDown,
    Zap, Wifi, Home, ShoppingBag, Wrench,
    Megaphone, Users, MoreHorizontal, Calendar,
    ArrowDownRight, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const EXPENSE_CATEGORIES = [
    { name: 'Rent', icon: Home, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Electricity & Water', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { name: 'Internet & Phone', icon: Wifi, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { name: 'Cleaning Supplies', icon: ShoppingBag, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'Maintenance', icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { name: 'Marketing', icon: Megaphone, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { name: 'Salaries', icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { name: 'Other', icon: MoreHorizontal, color: 'text-slate-500', bg: 'bg-slate-500/10' }
]

export function Billing() {
    const { user } = useAuth()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('')
    const [description, setDescription] = useState('')

    useEffect(() => {
        fetchExpenses()
    }, [])

    const fetchExpenses = async () => {
        try {
            const result = await window.api.getExpenses()
            if (result.success && result.expenses) {
                setExpenses(result.expenses)
            }
        } catch (error) {
            toast.error("Failed to fetch expenses")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Please enter a valid amount")
            return
        }

        if (!category) {
            toast.error("Please select a category")
            return
        }

        setIsSubmitting(true)
        try {
            const result = await window.api.createExpense({
                amount: Number(amount),
                category,
                description,
                userId: user?.id
            })

            if (result.success && result.expense) {
                toast.success("Expense recorded successfully")
                setExpenses([result.expense, ...expenses])
                setAmount('')
                setCategory('')
                setDescription('')
            } else {
                toast.error(result.error || "Failed to record expense")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            const result = await window.api.deleteExpense(id)
            if (result.success) {
                toast.success("Expense deleted")
                setExpenses(expenses.filter(e => e.id !== id))
            } else {
                toast.error(result.error || "Failed to delete expense")
            }
        } catch (error) {
            toast.error("An error occurred while deleting")
        }
    }

    const currentMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).reduce((sum, e) => sum + e.amount, 0)

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                    <p className="text-xs font-bold tracking-[0.3em] text-muted-foreground uppercase animate-pulse">Syncing Treasury...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 w-full px-6 pb-12">
            {/* Premium Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-card border shadow-2xl p-8 md:p-12">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                            <Sparkles className="w-3 h-3" />
                            Financial Management
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-4">
                            <Wallet className="h-10 w-10 md:h-12 md:w-12 text-primary" />
                            Bills & Expenses
                        </h1>
                        <p className="text-muted-foreground text-lg font-medium max-w-md">
                            Track and analyze your operational costs to maintain a healthy bottom line.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Monthly Burn Rate</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl md:text-6xl font-black tracking-tighter">
                                    {currentMonthExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-xl font-bold text-primary">DH</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
                            <ArrowDownRight className="w-4 h-4" />
                            Outflow Monitoring Active
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Modern Form Section */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-2 shadow-xl overflow-hidden group">
                        <CardHeader className="bg-muted/30 border-b p-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" />
                                Record Outflow
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="amount" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Amount (DH)</Label>
                                    <div className="relative">
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="h-16 text-3xl font-black pl-6 border-2 focus-visible:ring-primary/20 bg-background/50"
                                            required
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground/30">DH</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category Selection</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {EXPENSE_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.name}
                                                type="button"
                                                onClick={() => setCategory(cat.name)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 group/btn",
                                                    category === cat.name
                                                        ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                                                        : "border-border bg-card hover:border-primary/40"
                                                )}
                                            >
                                                <cat.icon className={cn("w-6 h-6 transition-transform group-hover/btn:scale-110", cat.color)} />
                                                <span className="text-[10px] font-bold text-center leading-tight">{cat.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground text-foreground">Memo / Reference</Label>
                                    <Input
                                        id="description"
                                        placeholder="Add context for this expense..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="h-12 bg-muted/20 border-2"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full font-black h-16 text-lg rounded-2xl shadow-lg transition-transform active:scale-95 shadow-primary/20"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                                    CONFIRM RECORD
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* History Section */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-xl">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight uppercase tracking-widest">Transaction History</h2>
                        </div>
                    </div>

                    <Card className="border-2 shadow-xl flex-1 overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar h-full max-h-[600px]">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-20 backdrop-blur-md">
                                    <TableRow className="hover:bg-transparent border-b-2">
                                        <TableHead className="font-black text-xs uppercase tracking-[0.2em] py-5">Timestamp</TableHead>
                                        <TableHead className="font-black text-xs uppercase tracking-[0.2em] py-5">Category</TableHead>
                                        <TableHead className="font-black text-xs uppercase tracking-[0.2em] py-5">Details</TableHead>
                                        <TableHead className="font-black text-xs uppercase tracking-[0.2em] py-5 text-right">Outflow</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-24">
                                                <div className="flex flex-col items-center gap-4 opacity-20">
                                                    <TrendingDown className="w-16 h-16" />
                                                    <p className="font-black text-sm uppercase tracking-widest">No Expense Activity Detected</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        expenses.map(expense => {
                                            const catInfo = EXPENSE_CATEGORIES.find(c => c.name === expense.category) || EXPENSE_CATEGORIES[7]
                                            return (
                                                <TableRow key={expense.id} className="group hover:bg-muted/20 transition-colors border-b">
                                                    <TableCell className="font-bold py-5 whitespace-nowrap text-muted-foreground">
                                                        {format(new Date(expense.date), 'MMM dd, HH:mm')}
                                                    </TableCell>
                                                    <TableCell className="py-5">
                                                        <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 font-bold text-xs transition-colors", catInfo.bg, catInfo.color, "border-transparent")}>
                                                            <catInfo.icon className="w-3.5 h-3.5" />
                                                            {expense.category}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm">{expense.description || 'No notes provided'}</span>
                                                            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/50 flex items-center gap-1 mt-1">
                                                                <Users className="w-3 h-3" />
                                                                Admin: {expense.user?.name || 'ROOT'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 text-right">
                                                        <div className="font-black text-lg text-foreground flex items-center justify-end gap-1">
                                                            -{expense.amount.toFixed(2)}
                                                            <span className="text-[10px] font-bold text-primary">DH</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5 text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="opacity-0 group-hover:opacity-100 h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                                            onClick={() => handleDelete(expense.id)}
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
