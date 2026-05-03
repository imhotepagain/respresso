import React, { useState, useEffect, useRef } from "react"
import { Session } from "../types/electron"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Plus,
    Gamepad2,
    Square,
    History,
    Loader2,
    Clock,
    Infinity,
    Timer,
    Bell,
    Monitor
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const POSTS = [1, 2, 3, 4, 5, 6]
const PC_POSTS = [6]

const formatDuration = (seconds: number) => {
    const absSeconds = Math.abs(seconds)
    const h = Math.floor(absSeconds / 3600)
    const m = Math.floor((absSeconds % 3600) / 60)
    const s = absSeconds % 60
    const sign = seconds < 0 ? "-" : ""
    return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const TimerCard: React.FC<{
    postNumber: number;
    session: Session | null;
    onStart: (post: number) => void;
    onComplete: () => void
}> = ({ postNumber, session, onStart, onComplete }) => {
    const [elapsed, setElapsed] = useState(0)
    const [remaining, setRemaining] = useState<number | null>(null)
    const [isEndOpen, setIsEndOpen] = useState(false)
    const [cost, setCost] = useState(0)
    const notifiedRef = useRef(false)

    useEffect(() => {
        if (!session) return

        const start = new Date(session.startTime).getTime()
        const update = () => {
            const now = Date.now()
            const elapsedSecs = Math.floor((now - start) / 1000)
            setElapsed(elapsedSecs)

            if (session.limitMinutes) {
                const totalLimitSecs = session.limitMinutes * 60
                const rem = totalLimitSecs - elapsedSecs
                setRemaining(rem)

                if (rem <= 0 && !notifiedRef.current) {
                    notifiedRef.current = true
                    new Notification("Time's Up!", {
                        body: `${PC_POSTS.includes(postNumber) ? 'PC Gamer' : `Post ${postNumber}`} has finished its session.`,
                        silent: false
                    })
                }
            } else {
                setRemaining(null)
            }
        }

        update()
        const interval = setInterval(update, 1000)
        return () => {
            clearInterval(interval)
            notifiedRef.current = false
        }
    }, [session, postNumber])

    const calculateSuggestedCost = () => {
        let durationMinutes = session?.limitMinutes ? session.limitMinutes : Math.ceil(elapsed / 60)
        
        // Determine if Day or Evening session
        const startHour = session ? new Date(session.startTime).getHours() : new Date().getHours()
        const isDaySession = startHour >= 9 && startHour < 15

        if (isDaySession) {
            if (durationMinutes <= 12) return 5
            if (durationMinutes <= 30) return 10
            if (durationMinutes <= 60) return 20
            if (durationMinutes <= 120) return 25
            // Extra time extrapolation (approx 12.5 DH/hr after 2 hours, round to nearest 5)
            const extraHours = Math.ceil((durationMinutes - 120) / 60)
            return 25 + (extraHours * 15)
        } else {
            if (durationMinutes <= 12) return 5
            if (durationMinutes <= 30) return 15
            if (durationMinutes <= 60) return 25
            if (durationMinutes <= 120) return 35
            // Extra time extrapolation (approx 17.5 DH/hr after 2 hours, round to nearest 5)
            const extraHours = Math.ceil((durationMinutes - 120) / 60)
            return 35 + (extraHours * 15)
        }
    }

    const handleStop = async () => {
        if (!session) return
        const duration = Math.ceil(elapsed / 60)
        const result = await window.api.updateSession(session.id, {
            status: 'COMPLETED',
            endTime: new Date(),
            duration,
            cost
        })
        
        if (result.success && result.session) {
            // Print receipt
            const printerName = localStorage.getItem('thermal-printer') || ''
            if (printerName) {
                await window.api.printReceipt({
                    shopName: localStorage.getItem('shop-name') || 'GLISSA',
                    address: localStorage.getItem('shop-address') || undefined,
                    footer: localStorage.getItem('shop-footer') || undefined,
                    session: result.session,
                    printerName
                })
            }

            setIsEndOpen(false)
            onComplete()
        } else {
            alert("Error: " + result.error)
        }
    }

    const handleCancel = async () => {
        if (!session) return
        if (!confirm("Cancel this session? No data will be saved.")) return
        const result = await window.api.updateSession(session.id, {
            status: 'CANCELLED',
            endTime: new Date()
        })
        if (result.success) onComplete()
    }

    if (!session) {
        return (
            <Card className="border-2 border-dashed border-muted/50 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => onStart(postNumber)}>
                <CardContent className="h-[240px] flex flex-col items-center justify-center gap-4 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="bg-muted p-4 rounded-full group-hover:bg-primary/10 transition-colors">
                        <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-center">
                        <p className="font-black text-xl tracking-tighter uppercase">
                            {PC_POSTS.includes(postNumber) ? "PC GAMER" : `Post ${postNumber}`}
                        </p>
                        <p className="text-xs font-bold text-muted-foreground">CLICK TO START</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const isTimeUp = remaining !== null && remaining <= 0

    return (
        <Card className={cn(
            "overflow-hidden border-2 shadow-lg animate-in zoom-in-95 relative",
            isTimeUp ? "border-destructive animate-pulse shadow-destructive/20" : "border-primary/20"
        )}>
            <CardHeader className={cn(
                "flex flex-row items-center justify-between py-3",
                isTimeUp ? "bg-destructive/10" : "bg-primary/5 text-primary"
            )}>
                <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                    {PC_POSTS.includes(postNumber) ? <Monitor className="h-4 w-4" /> : <Gamepad2 className="h-4 w-4" />}
                    {PC_POSTS.includes(postNumber) ? "PC GAMER" : `POST ${postNumber}`}
                </CardTitle>
                <div className="flex gap-2">
                    {session.limitMinutes && <Badge variant="outline" className="font-mono text-[10px] uppercase border-primary/30">{session.limitMinutes}M</Badge>}
                    <Badge className={cn(
                        "animate-pulse border-white border-2 font-black",
                        isTimeUp ? "bg-destructive hover:bg-destructive" : "bg-emerald-500 hover:bg-emerald-500"
                    )}>
                        {isTimeUp ? "TIME UP" : "LIVE"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="py-8 relative">
                {isTimeUp && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2">
                        <Badge variant="destructive" className="animate-bounce font-black flex gap-1 items-center">
                            <Bell className="h-3 w-3" /> ALERT
                        </Badge>
                    </div>
                )}
                <div className={cn(
                    "text-5xl font-black text-center font-mono tracking-tighter",
                    isTimeUp ? "text-destructive" : "text-primary"
                )}>
                    {remaining !== null ? formatDuration(remaining) : formatDuration(elapsed)}
                </div>
                <div className="text-center mt-2 text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center justify-center gap-2">
                    {remaining !== null ? (
                        <><Timer className="h-3 w-3" /> Remaining Time</>
                    ) : (
                        <><Clock className="h-3 w-3" /> Elapsed Time</>
                    )}
                </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2 bg-muted/30 pt-3">
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 font-bold" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button variant={isTimeUp ? "destructive" : "default"} size="sm" className="font-black" onClick={() => {
                    setCost(calculateSuggestedCost())
                    setIsEndOpen(true)
                }}>
                    <Square className="h-3 w-3 mr-2 fill-current" /> FINISH
                </Button>
            </CardFooter>

            <Dialog open={isEndOpen} onOpenChange={setIsEndOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Session ({PC_POSTS.includes(postNumber) ? "PC Gamer" : `Post ${postNumber}`})</DialogTitle>
                        <DialogDescription>
                            Total Duration: {Math.ceil(elapsed / 60)} minutes<br />
                            GLISSA Rate: Calculated based on Day/Evening Menu.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label className="font-black uppercase text-xs tracking-widest text-muted-foreground">Session Cost (DH)</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={cost}
                                    onChange={e => setCost(parseFloat(e.target.value))}
                                    className="text-2xl font-black h-14 border-2 pr-12 text-primary"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground">DH</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 font-bold text-xs" onClick={() => setCost(calculateSuggestedCost())}>
                                <Clock className="h-3 w-3 mr-2" /> Reset to Suggested ({calculateSuggestedCost()} DH)
                            </Button>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsEndOpen(false)} className="font-bold">BACK</Button>
                        <Button onClick={handleStop} className="bg-emerald-600 hover:bg-emerald-700 font-black px-8">COLLECT & CLOSE</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

export const Sessions: React.FC = () => {
    const [activeSessions, setActiveSessions] = useState<Session[]>([])
    const [history, setHistory] = useState<Session[]>([])
    const [loading, setLoading] = useState(true)
    const [isStartOpen, setIsStartOpen] = useState(false)
    const [selectedPost, setSelectedPost] = useState<number | null>(null)
    const [limitMinutes, setLimitMinutes] = useState<number | null>(null)

    const fetchData = async () => {
        setLoading(true)
        const [activeRes, historyRes] = await Promise.all([
            window.api.getActiveSessions(),
            window.api.getAllSessions()
        ])
        if (activeRes.success && activeRes.sessions) setActiveSessions(activeRes.sessions)
        if (historyRes.success && historyRes.sessions) {
            setHistory(historyRes.sessions.filter(s => s.status !== 'ACTIVE').slice(0, 20))
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
        // Check for notification permission
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission()
        }
    }, [])

    const handleStartClick = (post: number) => {
        setSelectedPost(post)
        setLimitMinutes(null)
        setIsStartOpen(true)
    }

    const startSession = async () => {
        if (selectedPost === null) return

        const result = await window.api.createSession({
            status: 'ACTIVE',
            startTime: new Date(),
            postNumber: selectedPost,
            limitMinutes: limitMinutes
        })

        if (result.success) {
            setIsStartOpen(false)
            fetchData()
        } else {
            alert("Error: " + result.error)
        }
    }

    const presets = [
        { label: '30 MIN', value: 30 },
        { label: '1 HR', value: 60 },
        { label: '1.5 HR', value: 90 },
        { label: '2 HR', value: 120 },
    ]

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Gaming Station Tracker</h1>
                <p className="text-muted-foreground uppercase font-bold text-xs tracking-widest">Live Monitoring • 5 PS Posts & 1 PC Gamer</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {POSTS.map(postNum => {
                    const session = activeSessions.find(s => s.postNumber === postNum)
                    return (
                        <TimerCard
                            key={postNum}
                            postNumber={postNum}
                            session={session || null}
                            onStart={handleStartClick}
                            onComplete={fetchData}
                        />
                    )
                })}
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tighter">
                    <History className="h-6 w-6 text-primary" /> Recent History
                </h2>
                <div className="rounded-2xl border-2 bg-card overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-black text-xs uppercase tracking-widest">Post</TableHead>
                                <TableHead className="font-black text-xs uppercase tracking-widest">Duration</TableHead>
                                <TableHead className="font-black text-xs uppercase tracking-widest">Charge</TableHead>
                                <TableHead className="font-black text-xs uppercase tracking-widest">Target</TableHead>
                                <TableHead className="font-black text-xs uppercase tracking-widest text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" /></TableCell>
                                </TableRow>
                            ) : history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">No recent sessions found.</TableCell>
                                </TableRow>
                            ) : history.map(s => (
                                <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-black">
                                        {PC_POSTS.includes(s.postNumber || 0) ? "PC GAMER" : `POST ${s.postNumber || '-'}`}
                                    </TableCell>
                                    <TableCell className="font-bold">{s.duration || 0} min</TableCell>
                                    <TableCell className="font-black text-primary">{s.cost ? `${s.cost.toFixed(2)} DH` : '-'}</TableCell>
                                    <TableCell className="text-xs font-medium text-muted-foreground">
                                        {s.limitMinutes ? `${s.limitMinutes}M Fixed` : 'Unlimited'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={s.status === 'COMPLETED' ? 'outline' : 'destructive'} className={cn(
                                            "font-black text-[10px] uppercase",
                                            s.status === 'COMPLETED' ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""
                                        )}>
                                            {s.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Start Session Dialog */}
            <Dialog open={isStartOpen} onOpenChange={setIsStartOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">
                            START {PC_POSTS.includes(selectedPost || 0) ? "PC GAMER" : `POST ${selectedPost}`}
                        </DialogTitle>
                        <DialogDescription className="font-bold text-xs uppercase tracking-widest">
                            Choose session mode for {PC_POSTS.includes(selectedPost || 0) ? "PC Gamer Station" : `Station ${selectedPost}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <div className="space-y-3">
                            <Label className="font-black uppercase text-xs tracking-widest text-muted-foreground">Mode Selection</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant={limitMinutes === null ? "default" : "outline"}
                                    className={cn("h-20 flex flex-col gap-1 border-2 font-black", limitMinutes === null && "bg-primary text-primary-foreground")}
                                    onClick={() => setLimitMinutes(null)}
                                >
                                    <Infinity className="h-6 w-6" />
                                    UNLIMITED
                                </Button>
                                <Button
                                    variant={limitMinutes !== null ? "default" : "outline"}
                                    className={cn("h-20 flex flex-col gap-1 border-2 font-black", limitMinutes !== null && "bg-primary text-primary-foreground")}
                                    onClick={() => setLimitMinutes(30)}
                                >
                                    <Timer className="h-6 w-6" />
                                    TIMED
                                </Button>
                            </div>
                        </div>

                        {limitMinutes !== null && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-3">
                                    <Label className="font-black uppercase text-xs tracking-widest text-muted-foreground">Set Duration</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {presets.map(p => (
                                            <Button
                                                key={p.value}
                                                variant={limitMinutes === p.value ? "secondary" : "ghost"}
                                                className={cn("font-black border", limitMinutes === p.value && "bg-primary/10 border-primary")}
                                                onClick={() => setLimitMinutes(p.value)}
                                            >
                                                {p.label}
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="relative mt-2">
                                        <Input
                                            type="number"
                                            placeholder="Custom Minutes"
                                            value={limitMinutes}
                                            onChange={e => setLimitMinutes(parseInt(e.target.value) || 0)}
                                            className="font-black border-2 h-12 pr-12"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[10px] text-muted-foreground">MIN</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsStartOpen(false)} className="font-bold">CANCEL</Button>
                        <Button onClick={startSession} className="bg-emerald-600 hover:bg-emerald-700 font-black h-12 px-8 shadow-lg">
                            <Plus className="h-5 w-5 mr-2" /> BEGIN SESSION
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
