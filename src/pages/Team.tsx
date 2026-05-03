import React, { useState, useEffect } from "react"
import { User } from "../types/electron"
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
    Trash2,
    Shield,
    User as UserIcon,
    UserPlus,
    Loader2,
    Lock,
    Key,
    KeyRound
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/providers/AuthProvider"
import { cn } from "@/lib/utils"
import { toast } from 'sonner'

export const Team: React.FC = () => {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)

    // Form states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        password: "",
        role: "STAFF"
    })

    // Password reset states
    const [isResetOpen, setIsResetOpen] = useState(false)
    const [resetTarget, setResetTarget] = useState<User | null>(null)
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [resetLoading, setResetLoading] = useState(false)

    const fetchUsers = async () => {
        setLoading(true)
        const result = await window.api.getAllUsers()
        if (result.success && result.users) {
            setUsers(result.users.filter(u => u.role === 'OWNER' || u.role === 'STAFF'))
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleCreateUser = async () => {
        if (!formData.name || !formData.password) return

        const result = await window.api.createUser({
            name: formData.name,
            password: formData.password,
            role: formData.role as any
        })

        if (result.success) {
            setIsAddOpen(false)
            setFormData({ name: "", password: "", role: "STAFF" })
            fetchUsers()
        } else {
            alert("Error: " + result.error)
        }
    }

    const handleDelete = async (id: string) => {
        if (id === currentUser?.id) {
            alert("You cannot delete yourself!")
            return
        }
        if (!confirm("Remove this team member? they will lose access immediately.")) return

        const result = await window.api.deleteUser(id)
        if (result.success) {
            fetchUsers()
        } else {
            alert("Error: " + result.error)
        }
    }

    const handleResetPassword = async () => {
        if (!resetTarget || !newPassword) return
        if (newPassword.length < 4) {
            toast.error('Password must be at least 4 characters')
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setResetLoading(true)
        const result = await window.api.resetUserPassword(resetTarget.id, newPassword)
        setResetLoading(false)

        if (result.success) {
            toast.success(`Password reset for ${resetTarget.name}`)
            setIsResetOpen(false)
            setResetTarget(null)
            setNewPassword("")
            setConfirmPassword("")
        } else {
            toast.error(result.error || 'Failed to reset password')
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" /> Team Management
                    </h1>
                    <p className="text-muted-foreground">Control staff access and manager administrative privileges.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="font-bold h-12 px-6 shadow-lg border-b-4 border-primary/20 active:border-b-0 active:translate-y-1 transition-all">
                            <UserPlus className="h-5 w-5 mr-2" /> Add Staff Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Team Member</DialogTitle>
                            <DialogDescription>Grant administrative access to this application.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="johndoe"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Initial Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={formData.role} onValueChange={val => setFormData({ ...formData, role: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STAFF">Staff (Daily Operations)</SelectItem>
                                        <SelectItem value="OWNER">Owner (Full Permissions)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateUser} className="font-bold">Create Account</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-card rounded-3xl border-2 shadow-sm overflow-hidden mt-8">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[300px]">Team Member</TableHead>
                            <TableHead>Account Role</TableHead>
                            <TableHead>Access Level</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-40 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" />
                                </TableCell>
                            </TableRow>
                        ) : users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-muted/30 transition-colors group">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-full",
                                            user.role === 'OWNER' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                                        )}>
                                            {user.role === 'OWNER' ? <Shield className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-lg">{user.name}</span>
                                            {user.id === currentUser?.id && <span className="text-[10px] font-black uppercase text-primary tracking-widest">Active Session</span>}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'OWNER' ? 'default' : 'secondary'} className={cn(
                                        "px-3 py-1 font-bold tracking-wider",
                                        user.role === 'OWNER' ? "bg-purple-600" : ""
                                    )}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium italic">
                                        {user.role === 'OWNER' ? (
                                            <>
                                                <Lock className="h-3 w-3 text-purple-500" /> Full System Control
                                            </>
                                        ) : (
                                            <>
                                                <Key className="h-3 w-3 text-blue-500" /> Operational Only
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {user.id !== currentUser?.id && (
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-primary hover:bg-primary/10 rounded-full"
                                                onClick={() => {
                                                    setResetTarget(user)
                                                    setNewPassword("")
                                                    setConfirmPassword("")
                                                    setIsResetOpen(true)
                                                }}
                                            >
                                                <KeyRound className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-full"
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="p-8 border-2 border-dashed rounded-3xl bg-muted/5 flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Shield className="h-8 w-8" />
                </div>
                <div>
                    <h3 className="font-black text-xl mb-1">Security Notice</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                        Team members can access the manager application and perform business operations.
                        Owners have additional privileges to manage inventory, view full reports, and delete other team members.
                        Always ensure strong passwords are used for all accounts.
                    </p>
                </div>
            </div>

            {/* Reset Password Dialog */}
            <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-primary" />
                            Reset Password
                        </DialogTitle>
                        <DialogDescription>
                            Set a new password for <span className="font-bold text-foreground">{resetTarget?.name}</span>.
                            They will need to use this new password on their next login.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsResetOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleResetPassword}
                            disabled={resetLoading || !newPassword || !confirmPassword}
                            className="font-bold"
                        >
                            {resetLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
                            Reset Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
