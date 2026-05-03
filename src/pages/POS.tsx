import React, { useState, useEffect } from "react"
import { Product, User } from "../types/electron"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingCart, Trash2, CreditCard, Wallet, Plus, Minus, Search, Coffee, Utensils, Briefcase, ShoppingBag, Loader2, CheckCircle, Infinity } from "lucide-react"
import { useAuth } from "@/providers/AuthProvider"
import { cn } from "@/lib/utils"
import { Shift } from "@/types/electron"
import { useNavigate } from "react-router-dom"

type CartItem = Product & { cartQuantity: number }

export const POS: React.FC = () => {
    const { user: currentUser } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [clients, setClients] = useState<User[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedClient, setSelectedClient] = useState<string>("guest")
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeCategory, setActiveCategory] = useState("ALL")
    const [orderSuccess, setOrderSuccess] = useState(false)
    const [currentShift, setCurrentShift] = useState<Shift | null>(null)
    const navigate = useNavigate()

    const fetchData = async () => {
        setFetching(true)
        const [prodResult, userResult] = await Promise.all([
            window.api.getAllProducts(),
            window.api.getAllUsers()
        ])
        if (prodResult.success && prodResult.products) setProducts(prodResult.products)
        if (userResult.success && userResult.users) {
            setClients(userResult.users.filter(u => u.role === 'CLIENT'))
        }

        // Fetch current shift
        if (currentUser?.id) {
            const shiftRes = await window.api.getCurrentShift(currentUser.id)
            if (shiftRes.success) setCurrentShift(shiftRes.shift || null)
        }

        setFetching(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id)
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, cartQuantity: p.cartQuantity + 1 } : p)
            }
            return [...prev, { ...product, cartQuantity: 1 }]
        })
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(p => p.id !== id))
    }

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(p => {
            if (p.id === id) {
                const newQ = p.cartQuantity + delta
                return newQ > 0 ? { ...p, cartQuantity: newQ } : p
            }
            return p
        }))
    }

    const total = cart.reduce((acc, item) => acc + (item.price * item.cartQuantity), 0)

    const handleCheckout = async (isPaid: boolean) => {
        if (cart.length === 0) return

        if (!isPaid && selectedClient === 'guest') {
            alert("Cannot charge debt to Guest. Please select a client.")
            return
        }

        setLoading(true)
        const items = cart.map(p => ({
            productId: p.id,
            quantity: p.cartQuantity,
            price: p.price
        }))

        const result = await window.api.createOrder({
            userId: selectedClient === 'guest' ? undefined : selectedClient,
            staffId: currentUser?.id,
            total,
            isPaid,
            items
        })

        if (result.success && result.order) {
            // Print receipt
            const printerName = localStorage.getItem('thermal-printer') || ''
            if (printerName) {
                await window.api.printReceipt({
                    shopName: localStorage.getItem('shop-name') || 'GLISSA',
                    address: localStorage.getItem('shop-address') || undefined,
                    footer: localStorage.getItem('shop-footer') || undefined,
                    order: result.order,
                    printerName
                })
            }

            setCart([])
            if (isPaid) setSelectedClient("guest")
            setOrderSuccess(true)
            setTimeout(() => setOrderSuccess(false), 3000)
            fetchData() // Refresh stock
        } else {
            alert("Error processing order: " + result.error)
        }
        setLoading(false)
    }

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = activeCategory === "ALL" || p.type === activeCategory
        return matchesSearch && matchesCategory
    })

    if (fetching && products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-bold">Loading POS System...</p>
            </div>
        )
    }

    if (!currentShift) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] animate-in fade-in zoom-in duration-500">
                <div className="bg-card p-12 rounded-[3rem] border-4 border-dashed flex flex-col items-center gap-8 shadow-2xl text-center max-w-lg mx-auto">
                    <div className="bg-muted p-8 rounded-full">
                        <ShoppingBag className="h-20 w-20 text-muted-foreground opacity-20" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black tracking-tight">Register is Closed</h2>
                        <p className="text-muted-foreground font-medium">You must open your cash register and log your starting balance before making sales.</p>
                    </div>
                    <Button
                        size="lg"
                        className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
                        onClick={() => navigate('/shifts')}
                    >
                        OPEN REGISTER NOW
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] gap-6 animate-in fade-in duration-300">
            {/* Header Area */}
            <div className="flex justify-between items-end px-2">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-foreground">
                        Point of Sale
                    </h1>
                    <p className="text-muted-foreground font-medium flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        System Ready
                    </p>
                </div>
                {orderSuccess && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 animate-in slide-in-from-right-4 shadow-sm">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-bold text-sm tracking-wide">ORDER COMPLETED</span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {/* Top Controls: Search & Tabs */}
                    <div className="flex flex-col xl:flex-row gap-4 items-center bg-card p-3 rounded-2xl border shadow-sm">
                        <div className="relative w-full xl:w-80">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search menu..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 bg-background rounded-xl border-muted-foreground/20 focus-visible:ring-1 focus-visible:border-primary transition-all"
                            />
                        </div>

                        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 w-full overflow-x-auto hide-scrollbar">
                            <TabsList className="flex w-full h-11 bg-muted/50 p-1 rounded-xl">
                                {['ALL', 'SNACK', 'DRINK', 'SERVICE'].map((cat) => (
                                    <TabsTrigger
                                        key={cat}
                                        value={cat}
                                        className="flex-1 rounded-lg text-sm font-bold tracking-wide data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                                    >
                                        {cat === 'ALL' ? 'All Items' : cat.charAt(0) + cat.slice(1).toLowerCase() + 's'}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Product Grid Area */}
                    <div className="flex-1 overflow-y-auto rounded-2xl border bg-muted/20 p-5 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-10">
                            {filteredProducts.map(product => (
                                <Card
                                    key={product.id}
                                    className={cn(
                                        "cursor-pointer group relative overflow-hidden border-2 rounded-xl transition-transform active:scale-95 will-change-transform",
                                        "hover:border-primary/40 hover:-translate-y-1 hover:shadow-md",
                                        product.type !== 'SERVICE' && (product.stock || 0) <= 0
                                            ? 'opacity-60 bg-muted/50 cursor-not-allowed grayscale-[0.5]'
                                            : 'bg-card'
                                    )}
                                    onClick={() => {
                                        if (product.type !== 'SERVICE' && (product.stock || 0) <= 0) return
                                        addToCart(product)
                                    }}
                                >
                                    {/* Subdued Watermark Icon for performance */}
                                    <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                                        {product.type === 'DRINK' && <Coffee className="w-24 h-24" />}
                                        {product.type === 'SNACK' && <Utensils className="w-24 h-24" />}
                                        {product.type === 'SERVICE' && <Briefcase className="w-24 h-24" />}
                                    </div>

                                    <CardContent className="p-4 flex flex-col justify-between h-[140px] relative z-10">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                                {product.name}
                                            </h3>
                                        </div>

                                        <div className="mt-auto space-y-1.5">
                                            <div className="text-2xl font-black text-foreground flex items-baseline gap-1 group-hover:text-primary transition-colors">
                                                {product.price} <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">DH</span>
                                            </div>

                                            <div className="h-5">
                                                {product.type === 'SERVICE' || (product.stock || 0) >= 900000 ? (
                                                    <div className="inline-flex items-center gap-1 text-primary">
                                                        <Infinity className="h-3.5 w-3.5" />
                                                        <span className="text-[10px] font-bold tracking-widest uppercase">Available</span>
                                                    </div>
                                                ) : (product.stock || 0) <= 0 ? (
                                                    <Badge variant="destructive" className="font-bold px-2 py-0 h-5 text-[10px]">SOLD OUT</Badge>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-muted-foreground tracking-wider">
                                                        Stock: {product.stock}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Floating Add Button */}
                                        <div className="absolute top-3 right-3 bg-primary text-primary-foreground p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                            <Plus className="h-3.5 w-3.5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Clean Cart Sidebar */}
                <div className="w-[380px] flex flex-col border rounded-2xl bg-card shadow-lg overflow-hidden h-full">
                    {/* Cart Header */}
                    <div className="p-5 bg-muted/10 border-b space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-black text-xl flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-primary" /> Cart
                            </h2>
                            <Badge variant="secondary" className="font-bold rounded-full px-3">{cart.reduce((a, c) => a + c.cartQuantity, 0)} Items</Badge>
                        </div>

                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                            <SelectTrigger className="w-full bg-background border h-12 rounded-xl text-sm font-medium">
                                <SelectValue placeholder="Select Client" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] bg-card">
                                <SelectItem value="guest" className="font-bold py-2.5">Guest (Fast Cash)</SelectItem>
                                {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id} className="py-2.5">
                                        <div className="flex justify-between w-full gap-4 items-center">
                                            <span className="font-medium">{client.name}</span>
                                            {client.balance > 0 && <span className="text-destructive font-bold text-xs">-{client.balance} DH</span>}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto bg-muted/5 custom-scrollbar">
                        <div className="p-3 space-y-2">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground/40 gap-4">
                                    <ShoppingCart className="h-16 w-16" />
                                    <p className="font-bold text-lg">Cart is empty</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:border-primary/30 transition-colors group">
                                        {/* Standard Qty Controls */}
                                        <div className="flex flex-col items-center gap-1 bg-muted/30 rounded-lg p-1">
                                            <button
                                                className="h-6 w-6 flex items-center justify-center hover:bg-primary hover:text-primary-foreground rounded-md transition-colors"
                                                onClick={() => updateQuantity(item.id, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                            <span className="text-xs font-black w-6 text-center">{item.cartQuantity}</span>
                                            <button
                                                className="h-6 w-6 flex items-center justify-center hover:bg-destructive hover:text-white rounded-md transition-colors"
                                                onClick={() => updateQuantity(item.id, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                        </div>

                                        {/* Item Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate">{item.name}</div>
                                            <div className="text-xs font-semibold text-muted-foreground mt-0.5">
                                                {item.price.toFixed(2)} DH
                                            </div>
                                        </div>

                                        {/* Line Total */}
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="font-black text-base">
                                                {(item.price * item.cartQuantity).toFixed(2)}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Checkout Footer */}
                    <div className="p-5 bg-card border-t z-10 shadow-[0_-5px_15px_-3px_rgba(0,0,0,0.05)]">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-muted-foreground font-bold text-sm">Total Due</span>
                            <div className="text-4xl font-black text-foreground tracking-tight">
                                {total.toFixed(2)}
                                <span className="text-base font-bold text-muted-foreground ml-1">DH</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                className="h-14 text-base font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-all active:scale-95"
                                disabled={loading || cart.length === 0}
                                onClick={() => handleCheckout(true)}
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Wallet className="mr-2 h-5 w-5" />}
                                CASH
                            </Button>
                            <Button
                                className="h-14 text-base font-black rounded-xl shadow-sm transition-all active:scale-95"
                                variant="secondary"
                                disabled={loading || cart.length === 0 || selectedClient === 'guest'}
                                onClick={() => handleCheckout(false)}
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <CreditCard className="mr-2 h-5 w-5" />}
                                DEBT
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
