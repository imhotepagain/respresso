import React, { useState, useEffect, useMemo } from "react"
import { Product } from "../types/electron"
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
    Plus,
    Search,
    Loader2,
    AlertCircle,
    Infinity,
    Edit2,
    Package,
    AlertTriangle,
    Boxes,
    ArrowUpDown,
    Filter
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
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/providers/AuthProvider"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export const Inventory: React.FC = () => {
    const { user: currentUser } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeCategory, setActiveCategory] = useState("ALL")
    
    // Sorting
    const [sortField, setSortField] = useState<keyof Product | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    // Form states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isRestockOpen, setIsRestockOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<string | null>(null)
    
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        type: "SNACK"
    })
    const [stockSetupMode, setStockSetupMode] = useState<'NONE' | 'PURCHASE_RECEIPT' | 'OPENING_BALANCE'>('NONE')
    const [initialStock, setInitialStock] = useState("")
    const [initialCost, setInitialCost] = useState("")
    
    const [restockAmount, setRestockAmount] = useState("")
    const [restockCost, setRestockCost] = useState("")

    const fetchProducts = async () => {
        setLoading(true)
        const result = await window.api.getAllProducts()
        if (result.success && result.products) {
            setProducts(result.products)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleCreateProduct = async () => {
        if (!formData.name || !formData.price) {
            toast.error("Please fill in required fields")
            return
        }

        const price = parseFloat(formData.price)
        if (!Number.isFinite(price) || price < 0) {
            toast.error("Price must be a valid positive number")
            return
        }

        const mode = formData.type === 'SERVICE' ? 'NONE' : stockSetupMode
        const parsedInitialStock = initialStock ? parseInt(initialStock) : 0
        const parsedInitialCost = initialCost ? parseFloat(initialCost) : 0

        if (mode !== 'NONE') {
            if (!Number.isInteger(parsedInitialStock) || parsedInitialStock <= 0) {
                toast.error("Initial stock must be greater than zero")
                return
            }
            if (!Number.isFinite(parsedInitialCost) || parsedInitialCost < 0) {
                toast.error("Initial cost must be a valid non-negative number")
                return
            }
        }

        const result = await window.api.createProduct({
            name: formData.name.trim(),
            price,
            type: formData.type as any,
            category: null,
            imageUrl: null,
            stockMode: mode,
            initialStock: mode === 'NONE' ? 0 : parsedInitialStock,
            initialCost: mode === 'NONE' ? 0 : parsedInitialCost,
            userId: currentUser?.id
        })

        if (result.success) {
            setIsAddOpen(false)
            setFormData({ name: "", price: "", type: "SNACK" })
            setStockSetupMode('NONE')
            setInitialStock("")
            setInitialCost("")
            fetchProducts()
            toast.success("Product created successfully")
        } else {
            toast.error(result.error || "Failed to create product")
        }
    }

    const handleEditProduct = async () => {
        if (!selectedProduct || !formData.name || !formData.price) {
            toast.error("Please fill in required fields")
            return
        }

        const price = parseFloat(formData.price)
        if (!Number.isFinite(price) || price < 0) {
            toast.error("Price must be a valid positive number")
            return
        }

        const result = await window.api.updateProduct(selectedProduct.id, {
            name: formData.name,
            price,
            type: formData.type as any,
        })

        if (result.success) {
            setIsEditOpen(false)
            setSelectedProduct(null)
            fetchProducts()
            toast.success("Product updated successfully")
        } else {
            toast.error(result.error || "Failed to update product")
        }
    }

    const openEditDialog = (product: Product) => {
        setSelectedProduct(product)
        setFormData({
            name: product.name,
            price: product.price.toString(),
            type: product.type,
        })
        setIsEditOpen(true)
    }

    const handleRestock = async () => {
        if (!selectedProduct || !restockAmount) {
            toast.error("Please enter a restock amount")
            return
        }

        const amount = parseInt(restockAmount)
        const cost = parseFloat(restockCost) || 0
        if (!Number.isInteger(amount) || amount <= 0) {
            toast.error("Restock amount must be greater than zero")
            return
        }
        if (!Number.isFinite(cost) || cost < 0) {
            toast.error("Restock cost must be a valid non-negative number")
            return
        }

        const result = await window.api.addInventoryLog({
            productId: selectedProduct.id,
            userId: currentUser?.id,
            change: amount,
            cost: cost,
            type: 'PURCHASE_RECEIPT',
            note: `Manual restock: +${amount}`
        })

        if (result.success) {
            setIsRestockOpen(false)
            setRestockAmount("")
            setRestockCost("")
            setSelectedProduct(null)
            fetchProducts()
            toast.success(`Successfully restocked ${selectedProduct.name}`)
        } else {
            toast.error(result.error || "Failed to restock product")
        }
    }

    const handleDelete = async () => {
        if (!itemToDelete) return

        const result = await window.api.deleteProduct(itemToDelete)
        if (result.success) {
            setItemToDelete(null)
            fetchProducts()
            toast.success("Product deleted successfully")
        } else {
            toast.error(result.error || "Failed to delete product")
        }
    }

    const handleSort = (field: keyof Product) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Derived Data
    const filteredAndSortedProducts = useMemo(() => {
        let result = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.type.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = activeCategory === "ALL" || p.type === activeCategory
            return matchesSearch && matchesCategory
        })

        if (sortField) {
            result.sort((a, b) => {
                let aVal: any = a[sortField] ?? ''
                let bVal: any = b[sortField] ?? ''
                
                if (typeof aVal === 'string') aVal = aVal.toLowerCase()
                if (typeof bVal === 'string') bVal = bVal.toLowerCase()

                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
                return 0
            })
        }

        return result
    }, [products, searchTerm, activeCategory, sortField, sortDirection])

    const kpis = useMemo(() => {
        const tangibleProducts = products.filter(p => p.type !== 'SERVICE')
        const finiteProducts = tangibleProducts.filter(p => p.stock < 900000)
        return {
            totalItems: products.length,
            lowStock: tangibleProducts.filter(p => p.stock > 0 && p.stock <= 10).length,
            outOfStock: tangibleProducts.filter(p => p.stock <= 0).length,
            totalUnits: finiteProducts.reduce((sum, p) => sum + Math.max(0, p.stock), 0)
        }
    }, [products])

    const lowStockItems = products.filter(p => p.type !== 'SERVICE' && p.stock <= 5)

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <Package className="h-10 w-10 text-primary" /> Inventory
                    </h1>
                    <p className="text-muted-foreground font-medium">Monitor stock levels, value, and manage your offerings.</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={(val) => {
                    setIsAddOpen(val)
                    if (val) {
                        setFormData({ name: "", price: "", type: "SNACK" })
                        setStockSetupMode('NONE')
                        setInitialStock("")
                        setInitialCost("")
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="font-bold h-12 px-6">
                            <Plus className="h-5 w-5 mr-2" /> New Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                            <DialogDescription>
                                Create a new item for your inventory.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="add-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</Label>
                                <Input id="add-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="add-price" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price (DH)</Label>
                                    <Input id="add-price" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="font-bold" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="add-type" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                                <Select value={formData.type} onValueChange={val => {
                                    setFormData({ ...formData, type: val })
                                    if (val === 'SERVICE') {
                                        setStockSetupMode('NONE')
                                        setInitialStock("")
                                        setInitialCost("")
                                    }
                                }}>
                                    <SelectTrigger className="font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SNACK" className="font-bold">Snack</SelectItem>
                                        <SelectItem value="DRINK" className="font-bold">Drink</SelectItem>
                                        <SelectItem value="SERVICE" className="font-bold">Service</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {formData.type !== 'SERVICE' && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="stock-mode" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            Initial Stock Source
                                        </Label>
                                        <Select value={stockSetupMode} onValueChange={(val: 'NONE' | 'PURCHASE_RECEIPT' | 'OPENING_BALANCE') => setStockSetupMode(val)}>
                                            <SelectTrigger id="stock-mode" className="font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NONE">No Opening Stock</SelectItem>
                                                <SelectItem value="PURCHASE_RECEIPT">Purchased Now (From Net Profit)</SelectItem>
                                                <SelectItem value="OPENING_BALANCE">Existed Before Software (Opening Balance)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {stockSetupMode !== 'NONE' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="initial-stock" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                    Initial Quantity
                                                </Label>
                                                <Input
                                                    id="initial-stock"
                                                    type="number"
                                                    value={initialStock}
                                                    onChange={e => setInitialStock(e.target.value)}
                                                    className="font-bold"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="initial-cost" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                    {stockSetupMode === 'OPENING_BALANCE' ? 'Initial Value (DH)' : 'Purchase Cost (DH)'}
                                                </Label>
                                                <Input
                                                    id="initial-cost"
                                                    type="number"
                                                    value={initialCost}
                                                    onChange={e => setInitialCost(e.target.value)}
                                                    className="font-bold"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)} className="font-bold">Cancel</Button>
                            <Button onClick={handleCreateProduct} className="font-bold">Create Product</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-2 shadow-sm bg-primary/5 border-primary/10">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-primary">Total Products</div>
                            <div className="text-2xl font-black">{kpis.totalItems}</div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-2 shadow-sm bg-amber-500/5 border-amber-500/10">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-amber-600">Low Stock</div>
                            <div className="text-2xl font-black text-amber-600">{kpis.lowStock}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm bg-destructive/5 border-destructive/10">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-destructive/10 rounded-2xl">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-destructive">Out of Stock</div>
                            <div className="text-2xl font-black text-destructive">{kpis.outOfStock}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 shadow-sm bg-blue-500/5 border-blue-500/10">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <Boxes className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">Total Units</div>
                            <div className="text-2xl font-black text-blue-600">{kpis.totalUnits}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Critical Low Stock Banner */}
            {lowStockItems.length > 0 && (
                <div className="bg-destructive/10 border-2 border-destructive/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-destructive">Critical Stock Alert</h4>
                        <p className="text-sm text-destructive/80 font-medium mt-1">
                            {lowStockItems.length} item(s) are critically low (≤ 5 units): {lowStockItems.map(i => i.name).join(', ')}.
                        </p>
                    </div>
                </div>
            )}

            {/* Filters and Search */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 bg-card border-2 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-black uppercase tracking-widest text-muted-foreground shrink-0 hidden md:inline">Category</span>
                    <div className="flex flex-wrap gap-2 ml-2">
                        {['ALL', 'SNACK', 'DRINK', 'SERVICE'].map(cat => (
                            <Button
                                key={cat}
                                variant={activeCategory === cat ? "default" : "outline"}
                                size="sm"
                                className="font-bold h-9 px-4 text-xs"
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="relative w-full lg:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-background font-medium"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-card rounded-2xl border-2 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-[300px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                                    Product Name <ArrowUpDown className="h-3 w-3 opacity-50" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('type')}>
                                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                                    Category <ArrowUpDown className="h-3 w-3 opacity-50" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('price')}>
                                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                                    Price <ArrowUpDown className="h-3 w-3 opacity-50" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('stock')}>
                                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                                    Current Stock <ArrowUpDown className="h-3 w-3 opacity-50" />
                                </div>
                            </TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-wider">Status</TableHead>
                            <TableHead className="text-right font-black text-xs uppercase tracking-wider">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : filteredAndSortedProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-medium">
                                    No products found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : filteredAndSortedProducts.map((product) => (
                            <TableRow key={product.id} className="hover:bg-muted/30 transition-colors group">
                                <TableCell className="font-bold text-base">{product.name}</TableCell>
                                <TableCell>
                                    <Badge variant={product.type === 'SERVICE' ? 'secondary' : 'outline'} className={cn(
                                        "font-mono text-xs",
                                        product.type === 'SERVICE' && "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200"
                                    )}>
                                        {product.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-black text-primary">{product.price.toFixed(2)} DH</TableCell>
                                <TableCell>
                                    {product.type === 'SERVICE' ? (
                                        <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Unlimited</span>
                                    ) : product.stock >= 900000 ? (
                                        <div className="flex items-center gap-1.5 text-muted-foreground font-bold">
                                            <Infinity className="h-4 w-4" />
                                            <span className="text-[10px] tracking-widest uppercase">Available</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "font-black text-lg",
                                                product.stock <= 5 ? "text-destructive" : ""
                                            )}>{product.stock}</span>
                                            {product.stock <= 5 && <AlertCircle className="h-4 w-4 text-destructive" />}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {product.type === 'SERVICE' ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20 font-bold">Active</Badge>
                                    ) : product.stock >= 900000 ? (
                                        <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/10 border-blue-500/20 font-bold">Always In Stock</Badge>
                                    ) : product.stock <= 0 ? (
                                        <Badge variant="destructive" className="font-bold">Out of Stock</Badge>
                                    ) : product.stock <= 10 ? (
                                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10 font-bold">Low Stock</Badge>
                                    ) : (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20 font-bold">Healthy</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {product.type !== 'SERVICE' && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-8 px-3 font-bold bg-primary/10 text-primary hover:bg-primary/20"
                                                onClick={() => {
                                                    setSelectedProduct(product)
                                                    setIsRestockOpen(true)
                                                }}
                                            >
                                                Restock
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            onClick={() => openEditDialog(product)}
                                            title="Edit Product"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setItemToDelete(product.id)}
                                            title="Delete Product"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!itemToDelete} onOpenChange={(val) => !val && setItemToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> Confirm Deletion
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this product? This action cannot be undone and might affect historical reports if not handled carefully.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setItemToDelete(null)} className="font-bold">Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} className="font-bold">Delete Product</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restock Dialog */}
            <Dialog open={isRestockOpen} onOpenChange={(val: boolean) => {
                setIsRestockOpen(val)
                if (!val) {
                    setSelectedProduct(null)
                    setRestockAmount("")
                    setRestockCost("")
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restock {selectedProduct?.name}</DialogTitle>
                        <DialogDescription>Add items to current stock ({selectedProduct?.stock} available).</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="e.g. 24"
                                    value={restockAmount}
                                    onChange={e => setRestockAmount(e.target.value)}
                                    autoFocus
                                    className="font-bold"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cost" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Cost (DH)</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    placeholder="e.g. 100"
                                    value={restockCost}
                                    onChange={e => setRestockCost(e.target.value)}
                                    className="font-bold"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRestockOpen(false)} className="font-bold">Cancel</Button>
                        <Button onClick={handleRestock} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Confirm Restock</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={(val) => {
                setIsEditOpen(val)
                if (!val) setSelectedProduct(null)
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                            Update details for {selectedProduct?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</Label>
                            <Input id="edit-name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="font-bold" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-price" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price (DH)</Label>
                            <Input id="edit-price" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="font-bold" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-type" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                            <Select value={formData.type} onValueChange={val => setFormData({ ...formData, type: val })}>
                                <SelectTrigger className="font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SNACK" className="font-bold">Snack</SelectItem>
                                    <SelectItem value="DRINK" className="font-bold">Drink</SelectItem>
                                    <SelectItem value="SERVICE" className="font-bold">Service</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            To change stock, use Restock or inventory movement actions so changes stay auditable.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsEditOpen(false); setSelectedProduct(null); }} className="font-bold">Cancel</Button>
                        <Button onClick={handleEditProduct} className="font-bold">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
