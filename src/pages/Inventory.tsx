import React, { useState, useEffect } from "react"
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
    Infinity
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

export const Inventory: React.FC = () => {
    const { user: currentUser } = useAuth()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Form states
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isRestockOpen, setIsRestockOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        type: "SNACK",
        stock: "0"
    })
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
        if (!formData.name || !formData.price) return

        const result = await window.api.createProduct({
            name: formData.name,
            price: parseFloat(formData.price),
            type: formData.type as any,
            category: null,
            stock: parseInt(formData.stock) || 0,
            imageUrl: null
        })

        if (result.success) {
            setIsAddOpen(false)
            setFormData({ name: "", price: "", type: "SNACK", stock: "0" })
            fetchProducts()
        } else {
            alert("Error: " + result.error)
        }
    }

    const handleRestock = async () => {
        if (!selectedProduct || !restockAmount) return

        const amount = parseInt(restockAmount)
        const cost = parseFloat(restockCost) || 0

        const result = await window.api.addInventoryLog({
            productId: selectedProduct.id,
            userId: currentUser?.id,
            change: amount,
            cost: cost,
            type: 'RESTOCK',
            note: `Manual restock: +${amount}`
        })

        if (result.success) {
            setIsRestockOpen(false)
            setRestockAmount("")
            setRestockCost("")
            setSelectedProduct(null)
            fetchProducts()
        } else {
            alert("Error: " + result.error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return

        const result = await window.api.deleteProduct(id)
        if (result.success) {
            fetchProducts()
        } else {
            alert("Error: " + result.error)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Inventory</h1>
                    <p className="text-muted-foreground">Monitor stock levels and manage your offerings.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="font-bold">
                                <Plus className="h-4 w-4 mr-2" /> New Product
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Product</DialogTitle>
                                <DialogDescription>Create a new item for your inventory.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="price">Price (DH)</Label>
                                        <Input id="price" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="stock">Initial Stock</Label>
                                        <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Category</Label>
                                    <Select value={formData.type} onValueChange={val => setFormData({ ...formData, type: val })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SNACK">Snack</SelectItem>
                                            <SelectItem value="DRINK">Drink</SelectItem>
                                            <SelectItem value="SERVICE">Service</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateProduct}>Create Product</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="bg-card rounded-2xl border-2 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[300px]">Product Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Current Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts.map((product) => (
                            <TableRow key={product.id} className="hover:bg-muted/30 transition-colors group">
                                <TableCell className="font-bold">{product.name}</TableCell>
                                <TableCell>
                                    <Badge variant={product.type === 'SERVICE' ? 'secondary' : 'outline'} className="font-mono">
                                        {product.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono font-bold">{product.price.toFixed(2)} DH</TableCell>
                                <TableCell>
                                    {product.type === 'SERVICE' ? (
                                        <span className="text-muted-foreground text-xs uppercase tracking-tighter">Unlimited</span>
                                    ) : product.stock >= 900000 ? (
                                        <div className="flex items-center gap-1 text-muted-foreground font-bold">
                                            <Infinity className="h-4 w-4" />
                                            <span className="text-xs tracking-tighter uppercase">Available</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "font-bold",
                                                product.stock <= 5 ? "text-destructive" : ""
                                            )}>{product.stock}</span>
                                            {product.stock <= 5 && <AlertCircle className="h-3 w-3 text-destructive" />}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {product.type === 'SERVICE' ? (
                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Active</Badge>
                                    ) : product.stock >= 900000 ? (
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Always In Stock</Badge>
                                    ) : product.stock <= 0 ? (
                                        <Badge variant="destructive">Out of Stock</Badge>
                                    ) : product.stock <= 10 ? (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">Low Stock</Badge>
                                    ) : (
                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Healthy</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {product.type !== 'SERVICE' && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-8 px-3 font-bold"
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
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(product.id)}
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
                        <DialogDescription>Add items to current stock ({selectedProduct?.stock}).</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Add Amount</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    placeholder="e.g. 24"
                                    value={restockAmount}
                                    onChange={e => setRestockAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cost">Total Cost (DH)</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    placeholder="e.g. 100"
                                    value={restockCost}
                                    onChange={e => setRestockCost(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRestockOpen(false)}>Cancel</Button>
                        <Button onClick={handleRestock} className="bg-emerald-600 hover:bg-emerald-700">Add Stock</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
