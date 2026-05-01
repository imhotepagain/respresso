import React, { useState, useEffect } from 'react'
import { 
    Download, 
    Plus, 
    History, 
    HardDrive, 
    ShieldCheck, 
    AlertCircle,
    CheckCircle2,
    Calendar,
    Printer,
    RefreshCw
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"
import { format } from 'date-fns'

interface Backup {
    name: string
    path: string
    createdAt: Date
    size: number
}

export const Settings: React.FC = () => {
    const [backups, setBackups] = useState<Backup[]>([])
    const [printers, setPrinters] = useState<any[]>([])
    const [selectedPrinter, setSelectedPrinter] = useState<string>(localStorage.getItem('thermal-printer') || '')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const fetchBackups = async () => {
        setIsLoading(true)
        try {
            const list = await window.api.listBackups()
            setBackups(list)
        } catch (error) {
            console.error('Failed to fetch backups:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchPrinters = async () => {
        try {
            const list = await window.api.getPrinters()
            setPrinters(list)
        } catch (error) {
            console.error('Failed to fetch printers:', error)
        }
    }

    useEffect(() => {
        fetchBackups()
        fetchPrinters()
    }, [])

    const handleCreateBackup = async () => {
        setIsLoading(true)
        setMessage(null)
        try {
            const result = await window.api.createBackup()
            if (result.success) {
                setMessage({ type: 'success', text: `Backup created successfully: ${result.name}` })
                fetchBackups()
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to create backup' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleExportBackup = async () => {
        setIsLoading(true)
        setMessage(null)
        try {
            const result = await window.api.exportBackup()
            if (result.success) {
                setMessage({ type: 'success', text: 'Database exported successfully' })
            } else if (result.error !== 'Export cancelled') {
                setMessage({ type: 'error', text: result.error || 'Failed to export backup' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred' })
        } finally {
            setIsLoading(false)
        }
    }

    const handlePrinterChange = (value: string) => {
        setSelectedPrinter(value)
        localStorage.setItem('thermal-printer', value)
    }

    const handleTestPrint = async () => {
        setIsLoading(true)
        try {
            const result = await window.api.printReceipt({
                shopName: 'GLISSA POS TEST',
                footer: 'Printer configuration successful!',
                printerName: selectedPrinter
            })
            if (result.success) {
                setMessage({ type: 'success', text: 'Test receipt sent to printer' })
            } else {
                setMessage({ type: 'error', text: result.error || 'Test print failed' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Printing failed' })
        } finally {
            setIsLoading(false)
        }
    }

    const formatSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024)
        return `${mb.toFixed(2)} MB`
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground">Manage your data, backups, and local infrastructure.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="text-sm font-medium">{message.text}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-8 px-2"
                        onClick={() => setMessage(null)}
                    >
                        Dismiss
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Printer className="h-5 w-5 text-primary" />
                                Receipt Printer
                            </CardTitle>
                            <CardDescription>
                                Select your thermal printer (80mm).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Available Printers</label>
                                <Select value={selectedPrinter} onValueChange={handlePrinterChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a printer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {printers.map((p: any) => (
                                            <SelectItem key={p.name} value={p.name}>
                                                {p.name} {p.isDefault ? '(Default)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="pt-4 border-t space-y-3">
                                <Button
                                    variant="outline"
                                    onClick={handleTestPrint}
                                    disabled={isLoading || !selectedPrinter}
                                    className="w-full"
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Test Page
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchPrinters}
                                    className="w-full text-xs"
                                >
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Refresh Printer List
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Data Security
                            </CardTitle>
                            <CardDescription>
                                Configure how your shop data is protected.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <HardDrive className="h-4 w-4" />
                                    Local Storage
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Your data is stored locally on this PC using SQLite. This ensures high performance and offline capability.
                                </p>
                            </div>
                            <div className="pt-4 border-t space-y-3">
                                <Button
                                    onClick={handleCreateBackup}
                                    disabled={isLoading}
                                    className="w-full justify-start"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Manual Backup
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleExportBackup}
                                    disabled={isLoading}
                                    className="w-full justify-start"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Export to External Drive
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Backup History
                            </CardTitle>
                            <CardDescription>
                                Automatically kept last 10 snapshots of your system.
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={fetchBackups} disabled={isLoading}>
                            <History className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Backup Name</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {backups.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            No backups found yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    backups.map((backup: Backup) => (
                                        <TableRow key={backup.name}>
                                            <TableCell className="font-medium max-w-[200px] truncate">
                                                {backup.name}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(backup.createdAt), 'MMM d, yyyy HH:mm')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatSize(backup.size)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className="bg-green-500/5 text-green-500 border-green-500/20">
                                                    Valid
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
