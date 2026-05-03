import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from '@/providers/AuthProvider'
import { Shift } from '@/types/electron'
import { format } from 'date-fns'
import {
    Loader2, Play, Square, History,
    Wallet, CheckCircle2,
    Clock, User
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function Shifts() {
    const { user } = useAuth()
    const [shifts, setShifts] = useState<Shift[]>([])
    const [currentShift, setCurrentShift] = useState<Shift | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Dialog States
    const [isStartDialogOpen, setIsStartDialogOpen] = useState(false)
    const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)
    const [startCash, setStartCash] = useState('0')
    const [endCash, setEndCash] = useState('')
    const [notes, setNotes] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchData()
    }, [user?.id])

    const fetchData = async () => {
        if (!user?.id) return
        setIsLoading(true)
        try {
            const [currentRes, allRes] = await Promise.all([
                window.api.getCurrentShift(user.id),
                window.api.getAllShifts()
            ])

            if (currentRes.success) setCurrentShift(currentRes.shift || null)
            if (allRes.success && allRes.shifts) setShifts(allRes.shifts)
        } catch (error) {
            toast.error("Failed to fetch shift data")
        } finally {
            setIsLoading(false)
        }
    }

    const handleStartShift = async () => {
        if (!user?.id) return
        setIsSubmitting(true)
        try {
            const result = await window.api.startShift({
                userId: user.id,
                startCash: Number(startCash),
                notes
            })
            if (result.success && result.shift) {
                setCurrentShift(result.shift)
                setShifts([result.shift, ...shifts])
                setIsStartDialogOpen(false)
                setStartCash('0')
                setNotes('')
                toast.success("Shift started successfully")
            } else {
                toast.error(result.error || "Failed to start shift")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEndShift = async () => {
        if (!currentShift) return
        setIsSubmitting(true)
        try {
            const result = await window.api.endShift({
                id: currentShift.id,
                endCash: Number(endCash),
                notes
            })
            if (result.success && result.shift) {
                setCurrentShift(null)
                setShifts(shifts.map(s => s.id === result.shift?.id ? result.shift : s))
                setIsEndDialogOpen(false)
                setEndCash('')
                setNotes('')
                toast.success("Shift ended successfully")
            } else {
                toast.error(result.error || "Failed to end shift")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 w-full px-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <Clock className="h-10 w-10 text-primary" />
                        Shift Management
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Track staff sessions and daily cash flow
                    </p>
                </div>
                {!currentShift ? (
                    <Button
                        size="lg"
                        onClick={() => setIsStartDialogOpen(true)}
                        className="font-black h-14 px-8 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                        <Play className="mr-2 h-5 w-5 fill-current" />
                        START NEW SHIFT
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        variant="destructive"
                        onClick={() => setIsEndDialogOpen(true)}
                        className="font-black h-14 px-8 rounded-2xl shadow-lg shadow-destructive/20 active:scale-95 transition-all"
                    >
                        <Square className="mr-2 h-5 w-5 fill-current" />
                        CLOSE REGISTER
                    </Button>
                )}
            </div>

            {/* Current Shift Status */}
            {currentShift && (
                <Card className="border-primary/50 bg-primary/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Clock className="w-32 h-32" />
                    </div>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-primary">Active Session</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                        <User className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black">{currentShift.user?.name}</p>
                                        <p className="text-sm font-bold text-muted-foreground">
                                            Started at {format(new Date(currentShift.startTime), 'HH:mm')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-primary">Opening Balance</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                                        <Wallet className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black">{currentShift.startCash.toFixed(2)} <span className="text-sm">DH</span></p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <div className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest animate-pulse">
                                    REGISTER OPEN
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* History Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <History className="w-5 h-5 text-muted-foreground" />
                    <h2 className="text-xl font-black uppercase tracking-widest">Shift Logs</h2>
                </div>

                <Card className="border-2 shadow-xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-black text-xs uppercase tracking-widest py-4">User</TableHead>
                                <TableHead className="font-black text-xs uppercase tracking-widest py-4">Timeframe</TableHead>
                                <TableHead className="font-black text-xs uppercase tracking-widest py-4">Start Cash</TableHead>
                                <TableHead className="font-black text-xs uppercase tracking-widest py-4">End Cash</TableHead>
                                <TableHead className="font-black text-xs uppercase tracking-widest py-4">Expected</TableHead>
                                <TableHead className="font-black text-xs uppercase tracking-widest py-4">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shifts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-bold">
                                        No shift history found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                shifts.map(shift => {
                                    const diff = shift.endCash && shift.expectedCash ? shift.endCash - shift.expectedCash : 0
                                    return (
                                        <TableRow key={shift.id} className="group">
                                            <TableCell className="font-black py-4">
                                                {shift.user?.name}
                                            </TableCell>
                                            <TableCell className="font-bold text-sm text-muted-foreground py-4">
                                                {format(new Date(shift.startTime), 'MMM dd, HH:mm')}
                                                {shift.endTime && ` - ${format(new Date(shift.endTime), 'HH:mm')}`}
                                            </TableCell>
                                            <TableCell className="font-black py-4">
                                                {shift.startCash.toFixed(2)} DH
                                            </TableCell>
                                            <TableCell className="font-black py-4">
                                                {shift.endCash ? `${shift.endCash.toFixed(2)} DH` : '-'}
                                            </TableCell>
                                            <TableCell className="font-black py-4">
                                                <div className="flex flex-col">
                                                    <span>{shift.expectedCash ? `${shift.expectedCash.toFixed(2)} DH` : '-'}</span>
                                                    {shift.status === 'CLOSED' && (
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            diff === 0 ? "text-green-500" : "text-destructive"
                                                        )}>
                                                            {diff === 0 ? "Balanced" : `${diff > 0 ? '+' : ''}${diff.toFixed(2)} Discrepancy`}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                    shift.status === 'OPEN' ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                                                )}>
                                                    {shift.status === 'OPEN' ? (
                                                        <><Play className="w-3 h-3 mr-1 fill-current" /> Active</>
                                                    ) : (
                                                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Closed</>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* Start Shift Dialog */}
            <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
                <DialogContent className="max-w-md rounded-3xl border-2">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Open Cash Register</DialogTitle>
                        <DialogDescription className="font-medium">
                            Count the cash in your drawer before starting your shift.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <Label htmlFor="startCash" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Starting Cash (DH)</Label>
                            <Input
                                id="startCash"
                                type="number"
                                value={startCash}
                                onChange={(e) => setStartCash(e.target.value)}
                                className="h-16 text-3xl font-black border-2"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Opening Notes (Optional)</Label>
                            <Input
                                id="notes"
                                placeholder="e.g. Received 50DH in change"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="h-12 border-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="w-full h-14 font-black rounded-2xl text-lg"
                            onClick={handleStartShift}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
                            CONFIRM & START SHIFT
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* End Shift Dialog */}
            <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
                <DialogContent className="max-w-md rounded-3xl border-2">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-destructive">Close Cash Register</DialogTitle>
                        <DialogDescription className="font-medium">
                            Enter the final amount of cash currently in the drawer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <Label htmlFor="endCash" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Actual Final Cash (DH)</Label>
                            <Input
                                id="endCash"
                                type="number"
                                placeholder="0.00"
                                value={endCash}
                                onChange={(e) => setEndCash(e.target.value)}
                                className="h-16 text-3xl font-black border-2 border-destructive/20 focus-visible:ring-destructive"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="closeNotes" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Closing Notes</Label>
                            <Input
                                id="closeNotes"
                                placeholder="Any discrepancies or reasons?"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="h-12 border-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="destructive"
                            className="w-full h-14 font-black rounded-2xl text-lg"
                            onClick={handleEndShift}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Square className="mr-2 h-5 w-5 fill-current" />}
                            CLOSE REGISTER & LOG OUT
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
