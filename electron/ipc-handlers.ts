import { ipcMain, BrowserWindow } from 'electron'
import { getDatabase } from './database'
import bcrypt from 'bcryptjs'
import pkg from 'electron-pos-printer'
const { PosPrinter } = pkg

const ALLOWED_PRODUCT_TYPES = new Set(['SNACK', 'DRINK', 'SERVICE'])
const STOCK_IN_TYPES = new Set(['PURCHASE_RECEIPT', 'OPENING_BALANCE', 'ADJUSTMENT_IN'])
const STOCK_OUT_TYPES = new Set(['SALE', 'ADJUSTMENT_OUT', 'WASTE', 'RETURN_TO_SUPPLIER'])
const SUPPORTED_LOG_TYPES = new Set([
    ...STOCK_IN_TYPES,
    ...STOCK_OUT_TYPES,
])

function normalizeInventoryType(type: string, change: number) {
    if (type === 'RESTOCK') return 'PURCHASE_RECEIPT'
    if (type === 'ADJUSTMENT') return change >= 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT'
    return type
}

export function setupIpcHandlers() {
    const db = getDatabase()

    // ==================== AUTH ====================

    ipcMain.handle('auth:login', async (_, { name, password }: { name: string; password: string }) => {
        try {
            const user = await db.user.findFirst({
                where: { name },
            })

            if (!user) {
                return { success: false, error: 'User not found' }
            }

            const isValid = await bcrypt.compare(password, user.password)
            if (!isValid) {
                return { success: false, error: 'Invalid password' }
            }

            // Return user without password
            const { password: _, ...userWithoutPassword } = user
            return { success: true, user: userWithoutPassword }
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, error: 'Login failed' }
        }
    })

    ipcMain.handle('auth:createUser', async (_, { name, password, role }: { name: string; password: string; role: string }) => {
        try {
            const hashedPassword = await bcrypt.hash(password, 10)
            const user = await db.user.create({
                data: {
                    name,
                    password: hashedPassword,
                    role,
                },
            })

            const { password: _, ...userWithoutPassword } = user
            return { success: true, user: userWithoutPassword }
        } catch (error) {
            console.error('Create user error:', error)
            return { success: false, error: 'Failed to create user' }
        }
    })

    ipcMain.handle('auth:checkHasUsers', async () => {
        try {
            const count = await db.user.count()
            return { success: true, hasUsers: count > 0 }
        } catch (error) {
            console.error('Check users error:', error)
            return { success: false, error: 'Failed to checks users' }
        }
    })

    // ==================== USERS ====================

    ipcMain.handle('users:getAll', async () => {
        try {
            const users = await db.user.findMany({
                select: {
                    id: true,
                    name: true,
                    role: true,
                    balance: true,
                    createdAt: true,
                    updatedAt: true,
                },
            })
            return { success: true, users }
        } catch (error) {
            console.error('Get users error:', error)
            return { success: false, error: 'Failed to fetch users' }
        }
    })

    ipcMain.handle('users:getById', async (_, id: string) => {
        try {
            const user = await db.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    role: true,
                    balance: true,
                    createdAt: true,
                    updatedAt: true,
                },
            })
            return { success: true, user }
        } catch (error) {
            console.error('Get user error:', error)
            return { success: false, error: 'Failed to fetch user' }
        }
    })

    ipcMain.handle('users:update', async (_, { id, data }: { id: string; data: any }) => {
        try {
            const user = await db.user.update({
                where: { id },
                data,
                select: {
                    id: true,
                    name: true,
                    role: true,
                    balance: true,
                    createdAt: true,
                    updatedAt: true,
                },
            })
            return { success: true, user }
        } catch (error) {
            console.error('Update user error:', error)
            return { success: false, error: 'Failed to update user' }
        }
    })

    ipcMain.handle('users:delete', async (_, id: string) => {
        try {
            await db.user.delete({ where: { id } })
            return { success: true }
        } catch (error) {
            console.error('Delete user error:', error)
            return { success: false, error: 'Failed to delete user' }
        }
    })

    ipcMain.handle('users:resetPassword', async (_, { userId, newPassword }: { userId: string; newPassword: string }) => {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10)
            await db.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            })
            return { success: true }
        } catch (error) {
            console.error('Reset password error:', error)
            return { success: false, error: 'Failed to reset password' }
        }
    })

    // ==================== PRODUCTS ====================

    ipcMain.handle('products:getAll', async () => {
        try {
            const products = await db.product.findMany({
                orderBy: { name: 'asc' },
            })
            return { success: true, products }
        } catch (error) {
            console.error('Get products error:', error)
            return { success: false, error: 'Failed to fetch products' }
        }
    })

    ipcMain.handle('products:getById', async (_, id: string) => {
        try {
            const product = await db.product.findUnique({
                where: { id },
            })
            return { success: true, product }
        } catch (error) {
            console.error('Get product error:', error)
            return { success: false, error: 'Failed to fetch product' }
        }
    })

    ipcMain.handle('products:create', async (_, data: any) => {
        try {
            const name = typeof data?.name === 'string' ? data.name.trim() : ''
            const type = typeof data?.type === 'string' ? data.type : ''
            const price = Number(data?.price)

            if (!name) {
                return { success: false, error: 'Product name is required' }
            }
            if (!Number.isFinite(price) || price < 0) {
                return { success: false, error: 'Price must be a valid positive number' }
            }
            if (!ALLOWED_PRODUCT_TYPES.has(type)) {
                return { success: false, error: 'Invalid product category' }
            }

            let stockMode: 'NONE' | 'PURCHASE_RECEIPT' | 'OPENING_BALANCE' = 'NONE'
            if (data?.stockMode === 'PURCHASE_RECEIPT' || data?.stockMode === 'OPENING_BALANCE') {
                stockMode = data.stockMode
            } else if (data?.stockMode === 'NONE') {
                stockMode = 'NONE'
            } else if (Number.isInteger(data?.stock) && data.stock > 0) {
                // Backward compatibility with old payloads that sent stock directly.
                stockMode = 'OPENING_BALANCE'
            }

            const initialStock = Number(data?.initialStock ?? data?.stock ?? 0)
            const initialCost = Number(data?.initialCost ?? 0)

            if (!Number.isInteger(initialStock) || initialStock < 0) {
                return { success: false, error: 'Initial stock must be a non-negative whole number' }
            }
            if (!Number.isFinite(initialCost) || initialCost < 0) {
                return { success: false, error: 'Initial cost must be a non-negative number' }
            }
            if (type !== 'SERVICE' && stockMode !== 'NONE' && initialStock <= 0) {
                return { success: false, error: 'Initial stock must be greater than zero for this setup' }
            }

            const product = await db.$transaction(async (tx: any) => {
                const createdProduct = await tx.product.create({
                    data: {
                        name,
                        price,
                        type,
                        category: data?.category ?? null,
                        imageUrl: data?.imageUrl ?? null,
                        stock: type === 'SERVICE' ? 900000 : 0,
                    }
                })

                if (type !== 'SERVICE' && stockMode !== 'NONE' && initialStock > 0) {
                    await tx.product.update({
                        where: { id: createdProduct.id },
                        data: {
                            stock: { increment: initialStock }
                        }
                    })

                    await tx.inventoryLog.create({
                        data: {
                            productId: createdProduct.id,
                            userId: data?.userId,
                            change: initialStock,
                            cost: initialCost,
                            type: stockMode,
                            note: stockMode === 'OPENING_BALANCE'
                                ? `Opening balance migration (+${initialStock})`
                                : `Initial purchase (+${initialStock})`
                        }
                    })
                }

                return tx.product.findUnique({ where: { id: createdProduct.id } })
            })

            return { success: true, product }
        } catch (error) {
            console.error('Create product error:', error)
            return { success: false, error: 'Failed to create product' }
        }
    })

    ipcMain.handle('products:update', async (_, { id, data }: { id: string; data: any }) => {
        try {
            const existingProduct = await db.product.findUnique({ where: { id } })
            if (!existingProduct) {
                return { success: false, error: 'Product not found' }
            }
            if (typeof data?.stock !== 'undefined') {
                return { success: false, error: 'Direct stock edits are disabled. Use inventory movements instead.' }
            }
            if (typeof data?.type === 'string' && !ALLOWED_PRODUCT_TYPES.has(data.type)) {
                return { success: false, error: 'Invalid product category' }
            }

            if (
                typeof data?.type === 'string' &&
                data.type !== existingProduct.type &&
                (data.type === 'SERVICE' || existingProduct.type === 'SERVICE')
            ) {
                return { success: false, error: 'Cannot switch product type to/from service after creation' }
            }

            const updateData: any = {}
            if (typeof data?.name === 'string') {
                const name = data.name.trim()
                if (!name) {
                    return { success: false, error: 'Product name is required' }
                }
                updateData.name = name
            }
            if (typeof data?.price !== 'undefined') {
                const price = Number(data.price)
                if (!Number.isFinite(price) || price < 0) {
                    return { success: false, error: 'Price must be a valid positive number' }
                }
                updateData.price = price
            }
            if (typeof data?.type === 'string') {
                updateData.type = data.type
            }
            if (typeof data?.category !== 'undefined') {
                updateData.category = data.category
            }
            if (typeof data?.imageUrl !== 'undefined') {
                updateData.imageUrl = data.imageUrl
            }

            const product = await db.product.update({
                where: { id },
                data: updateData,
            })
            return { success: true, product }
        } catch (error) {
            console.error('Update product error:', error)
            return { success: false, error: 'Failed to update product' }
        }
    })

    ipcMain.handle('products:delete', async (_, id: string) => {
        try {
            await db.product.delete({ where: { id } })
            return { success: true }
        } catch (error) {
            console.error('Delete product error:', error)
            return { success: false, error: 'Failed to delete product' }
        }
    })

    // ==================== ORDERS ====================

    ipcMain.handle('orders:getAll', async () => {
        try {
            const orders = await db.order.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                        },
                    },
                    staff: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            })
            return { success: true, orders }
        } catch (error) {
            console.error('Get orders error:', error)
            return { success: false, error: 'Failed to fetch orders' }
        }
    })

    ipcMain.handle('orders:create', async (_, data: any) => {
        try {
            if (!Array.isArray(data?.items) || data.items.length === 0) {
                return { success: false, error: 'Order must contain at least one item' }
            }

            const total = Number(data.total)
            if (!Number.isFinite(total) || total < 0) {
                return { success: false, error: 'Invalid order total' }
            }

            const normalizedItems = data.items.map((item: any) => ({
                productId: item?.productId,
                quantity: Number(item?.quantity),
                price: Number(item?.price),
            }))

            for (const item of normalizedItems) {
                if (typeof item.productId !== 'string' || !item.productId) {
                    return { success: false, error: 'Invalid product in order' }
                }
                if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                    return { success: false, error: 'Order quantities must be positive whole numbers' }
                }
                if (!Number.isFinite(item.price) || item.price < 0) {
                    return { success: false, error: 'Invalid item price in order' }
                }
            }

            const order = await db.$transaction(async (tx: any) => {
                const productIds = [...new Set(normalizedItems.map((item: any) => item.productId))]
                const orderProducts = await tx.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true, name: true, stock: true, type: true },
                })

                const productMap = new Map<string, { id: string; name: string; stock: number; type: string }>(
                    (orderProducts as any[]).map((product: any) => [product.id, product])
                )

                for (const item of normalizedItems) {
                    const product = productMap.get(item.productId)
                    if (!product) {
                        throw new Error('One or more products no longer exist')
                    }

                    if (product.type !== 'SERVICE' && product.stock < item.quantity) {
                        throw new Error(`Insufficient stock for ${product.name}`)
                    }
                }

                const createdOrder = await tx.order.create({
                    data: {
                        userId: data.userId,
                        staffId: data.staffId,
                        total,
                        isPaid: Boolean(data.isPaid),
                        items: {
                            create: normalizedItems,
                        },
                    },
                    include: {
                        items: {
                            include: {
                                product: true,
                            },
                        },
                    },
                })

                if (!data.isPaid && data.userId) {
                    await tx.user.update({
                        where: { id: data.userId },
                        data: {
                            balance: {
                                increment: total,
                            },
                        },
                    })
                }

                for (const item of normalizedItems) {
                    const product = productMap.get(item.productId)
                    if (!product || product.type === 'SERVICE') continue

                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                decrement: item.quantity,
                            },
                        },
                    })

                    await tx.inventoryLog.create({
                        data: {
                            productId: item.productId,
                            userId: data.staffId,
                            change: -item.quantity,
                            type: 'SALE',
                            note: `Order #${createdOrder.id}`,
                        },
                    })
                }

                return createdOrder
            })

            return { success: true, order }
        } catch (error) {
            console.error('Create order error:', error)
            const message = error instanceof Error ? error.message : 'Failed to create order'
            return { success: false, error: message }
        }
    })

    // ==================== SESSIONS ====================

    ipcMain.handle('sessions:getAll', async () => {
        try {
            const sessions = await db.session.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            })
            return { success: true, sessions }
        } catch (error) {
            console.error('Get sessions error:', error)
            return { success: false, error: 'Failed to fetch sessions' }
        }
    })

    ipcMain.handle('sessions:getActive', async () => {
        try {
            const sessions = await db.session.findMany({
                where: { status: 'ACTIVE' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            })
            return { success: true, sessions }
        } catch (error) {
            console.error('Get active sessions error:', error)
            return { success: false, error: 'Failed to fetch active sessions' }
        }
    })

    ipcMain.handle('sessions:create', async (_, data: any) => {
        try {
            const session = await db.session.create({
                data,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            })
            return { success: true, session }
        } catch (error) {
            console.error('Create session error:', error)
            return { success: false, error: 'Failed to create session' }
        }
    })

    ipcMain.handle('sessions:update', async (_, { id, data }: { id: string; data: any }) => {
        try {
            const session = await db.session.update({
                where: { id },
                data,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            })
            return { success: true, session }
        } catch (error) {
            console.error('Update session error:', error)
            return { success: false, error: 'Failed to update session' }
        }
    })

    // ==================== INVENTORY ====================

    ipcMain.handle('inventory:getLogs', async () => {
        try {
            const logs = await db.inventoryLog.findMany({
                include: {
                    product: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            })
            return { success: true, logs }
        } catch (error) {
            console.error('Get inventory logs error:', error)
            return { success: false, error: 'Failed to fetch inventory logs' }
        }
    })

    ipcMain.handle('inventory:addLog', async (_, data: any) => {
        try {
            if (typeof data?.productId !== 'string' || !data.productId) {
                return { success: false, error: 'A product is required for stock movements' }
            }

            const change = Number(data?.change)
            if (!Number.isInteger(change) || change === 0) {
                return { success: false, error: 'Stock movement must be a non-zero whole number' }
            }

            const type = normalizeInventoryType(String(data?.type || ''), change)
            if (!SUPPORTED_LOG_TYPES.has(type)) {
                return { success: false, error: 'Invalid inventory movement type' }
            }
            if (STOCK_IN_TYPES.has(type) && change < 0) {
                return { success: false, error: 'This movement type requires a positive quantity' }
            }
            if (STOCK_OUT_TYPES.has(type) && change > 0) {
                return { success: false, error: 'This movement type requires a negative quantity' }
            }

            const cost = Number(data?.cost ?? 0)
            if (!Number.isFinite(cost) || cost < 0) {
                return { success: false, error: 'Cost must be a non-negative number' }
            }

            const log = await db.$transaction(async (tx: any) => {
                const product = await tx.product.findUnique({
                    where: { id: data.productId },
                    select: { id: true, name: true, stock: true, type: true }
                })

                if (!product) {
                    throw new Error('Product not found')
                }
                if (product.type === 'SERVICE') {
                    throw new Error('Service items do not support stock movements')
                }

                const nextStock = product.stock + change
                if (nextStock < 0) {
                    throw new Error(`Insufficient stock for ${product.name}`)
                }

                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: nextStock }
                })

                return tx.inventoryLog.create({
                    data: {
                        productId: product.id,
                        userId: data?.userId,
                        change,
                        cost,
                        type,
                        note: typeof data?.note === 'string' ? data.note : null
                    },
                    include: {
                        product: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                })
            })

            return { success: true, log }
        } catch (error) {
            console.error('Add inventory log error:', error)
            const message = error instanceof Error ? error.message : 'Failed to add inventory log'
            return { success: false, error: message }
        }
    })

    // ==================== DEBT PAYMENTS ====================

    ipcMain.handle('debt:getPayments', async (_, userId?: string) => {
        try {
            const payments = await db.debtPayment.findMany({
                where: userId ? { userId } : undefined,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            })
            return { success: true, payments }
        } catch (error) {
            console.error('Get debt payments error:', error)
            return { success: false, error: 'Failed to fetch debt payments' }
        }
    })

    ipcMain.handle('debt:addPayment', async (_, data: { userId: string; amount: number }) => {
        try {
            const payment = await db.debtPayment.create({
                data,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            })

            // Update user balance
            await db.user.update({
                where: { id: data.userId },
                data: {
                    balance: {
                        decrement: data.amount,
                    },
                },
            })

            return { success: true, payment }
        } catch (error) {
            console.error('Add debt payment error:', error)
            return { success: false, error: 'Failed to add debt payment' }
        }
    })

    // ==================== EXPENSES ====================

    ipcMain.handle('expenses:getAll', async (_, options?: { from?: Date; to?: Date }) => {
        try {
            const where: any = {}
            if (options?.from || options?.to) {
                where.date = {}
                if (options.from) where.date.gte = new Date(options.from)
                if (options.to) where.date.lte = new Date(options.to)
            }

            const expenses = await db.expense.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { date: 'desc' },
            })
            return { success: true, expenses }
        } catch (error) {
            console.error('Get expenses error:', error)
            return { success: false, error: 'Failed to fetch expenses' }
        }
    })

    ipcMain.handle('expenses:create', async (_, data: any) => {
        try {
            const expense = await db.expense.create({
                data,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            })
            return { success: true, expense }
        } catch (error) {
            console.error('Create expense error:', error)
            return { success: false, error: 'Failed to create expense' }
        }
    })

    ipcMain.handle('expenses:delete', async (_, id: string) => {
        try {
            await db.expense.delete({ where: { id } })
            return { success: true }
        } catch (error) {
            console.error('Delete expense error:', error)
            return { success: false, error: 'Failed to delete expense' }
        }
    })

    // ==================== REPORTS ====================

    ipcMain.handle('reports:getStats', async (_, options: { from: string | Date; to: string | Date; userId?: string }) => {
        try {
            const { from, to, userId } = options
            const start = new Date(from)
            start.setHours(0, 0, 0, 0)
            const end = new Date(to)
            end.setHours(23, 59, 59, 999)

            const dateFilter = { gte: start, lte: end }

            const orders = await db.order.findMany({
                where: {
                    createdAt: dateFilter,
                    ...(userId ? { staffId: userId } : {})
                },
                include: {
                    items: {
                        include: { product: true }
                    }
                }
            })

            const sessions = await db.session.findMany({
                where: {
                    createdAt: dateFilter,
                    ...(userId ? { staffId: userId } : {})
                },
            })

            const debtPayments = await db.debtPayment.findMany({
                where: {
                    createdAt: dateFilter,
                    ...(userId ? { userId } : {}) // userId in DebtPayment is the client, but for staff reports we might want something else?
                },
            })

            const inventoryLogs = await db.inventoryLog.findMany({
                where: {
                    createdAt: dateFilter,
                    ...(userId ? { userId } : {})
                },
                include: { product: true }
            })

            // Initialize aggregation stats
            const stats = {
                revenue: {
                    total: 0,
                    cash: 0,
                    debt: 0
                },
                expenses: {
                    total: 0
                },
                orders: {
                    count: orders.length,
                    totalAmount: 0
                },
                sessions: {
                    count: sessions.length,
                    totalCost: 0,
                    totalMinutes: 0
                },
                debtPayments: {
                    total: 0,
                    count: debtPayments.length
                },
                productStats: {} as Record<string, {
                    name: string
                    sold: number
                    revenue: number
                    restocked: number
                }>
            }

            // Process Orders
            orders.forEach((order: any) => {
                stats.orders.totalAmount += order.total
                if (order.isPaid) {
                    stats.revenue.cash += order.total
                } else {
                    stats.revenue.debt += order.total
                }

                order.items.forEach((item: any) => {
                    if (!stats.productStats[item.productId]) {
                        stats.productStats[item.productId] = {
                            name: item.product?.name || 'Unknown',
                            sold: 0,
                            revenue: 0,
                            restocked: 0
                        }
                    }
                    stats.productStats[item.productId].sold += item.quantity
                    stats.productStats[item.productId].revenue += item.quantity * item.price
                })
            })

            // Process Sessions
            sessions.forEach((session: any) => {
                const cost = session.cost || 0
                stats.sessions.totalCost += cost
                stats.sessions.totalMinutes += session.duration || 0
                stats.revenue.cash += cost // Sessions are traditionally cash/paid at end
            })

            // Process Debt Payments
            debtPayments.forEach((payment: any) => {
                stats.debtPayments.total += payment.amount
                stats.revenue.cash += payment.amount // Paid debt is fresh cash
                // Note: We don't reduce stats.revenue.debt here as that represents *new* debt created in this period
            })

            // Process Expenses & Restocks
            inventoryLogs.forEach((log: any) => {
                if (log.productId && !stats.productStats[log.productId]) {
                    stats.productStats[log.productId] = {
                        name: log.product?.name || 'Unknown',
                        sold: 0,
                        revenue: 0,
                        restocked: 0
                    }
                }

                if (['RESTOCK', 'PURCHASE_RECEIPT', 'OPENING_BALANCE', 'ADJUSTMENT_IN'].includes(log.type)) {
                    if (log.productId) {
                        stats.productStats[log.productId].restocked += Math.max(0, log.change)
                    }
                }
                if (['RESTOCK', 'PURCHASE_RECEIPT'].includes(log.type) && log.cost) {
                    if (log.cost > 0) {
                        stats.expenses.total += log.cost
                    }
                }
            })

            stats.revenue.total = stats.revenue.cash + stats.revenue.debt

            return {
                success: true,
                stats
            }
        } catch (error) {
            console.error('Get stats error:', error)
            return { success: false, error: 'Failed to fetch statistics' }
        }
    })

    ipcMain.handle('inventory:getActivityLogs', async (_, options: {
        page?: number
        limit?: number
        userId?: string
        search?: string
        type?: string
        from?: Date
        to?: Date
    }) => {
        try {
            const { page = 1, limit = 10, userId, search, type, from, to } = options
            const skip = (page - 1) * limit

            const where: any = {}
            if (userId) where.userId = userId
            if (type && type !== 'ALL') where.type = type
            if (from || to) {
                where.createdAt = {}
                if (from) where.createdAt.gte = new Date(from)
                if (to) where.createdAt.lte = new Date(to)
            }
            if (search) {
                where.OR = [
                    { note: { contains: search } },
                    { product: { name: { contains: search } } }
                ]
            }

            const [logs, totalCount] = await Promise.all([
                db.inventoryLog.findMany({
                    where,
                    include: {
                        product: true,
                        user: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                db.inventoryLog.count({ where })
            ])

            return {
                success: true,
                logs,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        } catch (error) {
            console.error('Get activity logs error:', error)
            return { success: false, error: 'Failed to fetch activity logs' }
        }
    })

    ipcMain.handle('reports:getAnalytics', async (_, options: { days?: number } = {}) => {
        try {
            const days = options.days || 7
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - days)
            startDate.setHours(0, 0, 0, 0)

            const [orders, products, logs] = await Promise.all([
                db.order.findMany({
                    where: { createdAt: { gte: startDate } }
                }),
                db.product.findMany(),
                db.inventoryLog.findMany({
                    where: {
                        createdAt: { gte: startDate },
                        type: 'SALE'
                    }
                })
            ])

            // 1. Trend analysis
            const trendMap: Record<string, { date: string, revenue: number, cash: number, debt: number }> = {}
            for (let i = 0; i < days; i++) {
                const d = new Date()
                d.setDate(d.getDate() - i)
                const ds = d.toLocaleDateString()
                trendMap[ds] = { date: ds, revenue: 0, cash: 0, debt: 0 }
            }

            orders.forEach((order: any) => {
                const ds = new Date(order.createdAt).toLocaleDateString()
                if (trendMap[ds]) {
                    trendMap[ds].revenue += order.total
                    if (order.isPaid) trendMap[ds].cash += order.total
                    else trendMap[ds].debt += order.total
                }
            })

            const trend = Object.values(trendMap).reverse()

            // 2. Category data
            const catMap: Record<string, number> = {}
            const topProdMap: Record<string, number> = {}

            // For category and top products, we use inventory logs (SALES)
            logs.forEach((log: any) => {
                if (log.productId) {
                    const prod = products.find((p: any) => p.id === log.productId)
                    if (prod) {
                        const amount = Math.abs(log.change)
                        const categoryName = prod.category || 'UNCATEGORIZED'
                        catMap[categoryName] = (catMap[categoryName] || 0) + amount
                        topProdMap[prod.name] = (topProdMap[prod.name] || 0) + amount
                    }
                }
            })

            const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }))
            const topProducts = Object.entries(topProdMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)

            return {
                success: true,
                data: {
                    trend,
                    categoryData,
                    topProducts
                }
            }
        } catch (error) {
            console.error('Get analytics error:', error)
            return { success: false, data: { trend: [], categoryData: [], topProducts: [] } }
        }
    })

    ipcMain.handle('dashboard:getStats', async () => {
        try {
            const userCount = await db.user.count({ where: { role: 'CLIENT' } })
            const activeSessions = await db.session.count({ where: { status: 'ACTIVE' } })
            const productCount = await db.product.count()
            const debtAgg = await db.user.aggregate({
                _sum: { balance: true },
                where: { role: 'CLIENT' }
            })

            const lowStockProducts = await db.product.findMany({
                where: {
                    stock: { lte: 10 },
                    type: { not: 'SERVICE' }
                },
                take: 5,
                orderBy: { stock: 'asc' }
            })

            return {
                success: true,
                stats: {
                    userCount,
                    activeSessions,
                    productCount,
                    totalDebt: debtAgg._sum.balance || 0,
                    lowStock: lowStockProducts
                }
            }
        } catch (error) {
            console.error('Get dashboard stats error:', error)
            return { success: false, error: 'Failed to fetch dashboard stats' }
        }
    })

    ipcMain.handle('dashboard:getTodayTrend', async () => {
        try {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const dateFilter = { gte: today, lt: tomorrow }

            const [orders, sessions] = await Promise.all([
                db.order.findMany({ where: { createdAt: dateFilter } }),
                db.session.findMany({ where: { createdAt: dateFilter, status: 'COMPLETED' } }),
            ])

            // Build hourly buckets from 8:00 to 23:00
            const hours: { hour: string; cash: number; debt: number; sessions: number }[] = []
            for (let h = 8; h <= 23; h++) {
                hours.push({ hour: `${h.toString().padStart(2, '0')}:00`, cash: 0, debt: 0, sessions: 0 })
            }

            orders.forEach((order: any) => {
                const h = new Date(order.createdAt).getHours()
                const bucket = hours.find(b => parseInt(b.hour) === h)
                if (bucket) {
                    if (order.isPaid) bucket.cash += order.total
                    else bucket.debt += order.total
                }
            })

            sessions.forEach((session: any) => {
                const h = new Date(session.createdAt).getHours()
                const bucket = hours.find(b => parseInt(b.hour) === h)
                if (bucket) {
                    bucket.cash += session.cost || 0
                    bucket.sessions += 1
                }
            })

            return { success: true, trend: hours }
        } catch (error) {
            console.error('Get today trend error:', error)
            return { success: false, trend: [] }
        }
    })

    // ==================== SHIFTS ====================

    ipcMain.handle('shifts:start', async (_, data: { userId: string; startCash: number; notes?: string }) => {
        try {
            const activeShift = await db.shift.findFirst({
                where: { userId: data.userId, status: 'OPEN' }
            })

            if (activeShift) {
                return { success: false, error: 'You already have an active shift' }
            }

            const shift = await db.shift.create({
                data: {
                    userId: data.userId,
                    startCash: data.startCash,
                    notes: data.notes,
                    status: 'OPEN'
                },
                include: { user: { select: { name: true } } }
            })

            return { success: true, shift }
        } catch (error) {
            console.error('Start shift error:', error)
            return { success: false, error: 'Failed to start shift' }
        }
    })

    ipcMain.handle('shifts:end', async (_, data: { id: string; endCash: number; notes?: string }) => {
        try {
            const shift = await db.shift.findUnique({ where: { id: data.id } })
            if (!shift) return { success: false, error: 'Shift not found' }

            // Calculate expected cash
            // 1. Paid orders
            const orders = await db.order.findMany({
                where: {
                    staffId: shift.userId,
                    isPaid: true,
                    createdAt: { gte: shift.startTime, lte: new Date() }
                }
            })
            const ordersTotal = orders.reduce((sum: number, o: any) => sum + o.total, 0)

            // 2. Completed sessions
            const sessions = await db.session.findMany({
                where: {
                    status: 'COMPLETED',
                    updatedAt: { gte: shift.startTime, lte: new Date() }
                }
            })
            const sessionsTotal = sessions.reduce((sum: number, s: any) => sum + (s.cost || 0), 0)

            // 3. Debt payments
            // Note: Currently DebtPayment doesn't have a staffId, but we can filter by date
            // For a better implementation, we'd add staffId to DebtPayment too.
            const debtPayments = await db.debtPayment.findMany({
                where: {
                    createdAt: { gte: shift.startTime, lte: new Date() }
                }
            })
            const debtTotal = debtPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

            // 4. Expenses
            const expenses = await db.expense.findMany({
                where: {
                    userId: shift.userId,
                    date: { gte: shift.startTime, lte: new Date() }
                }
            })
            const expensesTotal = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)

            const expectedCash = shift.startCash + ordersTotal + sessionsTotal + debtTotal - expensesTotal

            const updatedShift = await db.shift.update({
                where: { id: data.id },
                data: {
                    endTime: new Date(),
                    endCash: data.endCash,
                    expectedCash,
                    status: 'CLOSED',
                    notes: data.notes ? `${shift.notes || ''}\n${data.notes}` : shift.notes
                }
            })

            return { success: true, shift: updatedShift }
        } catch (error) {
            console.error('End shift error:', error)
            return { success: false, error: 'Failed to end shift' }
        }
    })

    ipcMain.handle('shifts:getCurrent', async (_, userId: string) => {
        try {
            const shift = await db.shift.findFirst({
                where: { userId, status: 'OPEN' },
                include: { user: { select: { name: true } } }
            })
            return { success: true, shift }
        } catch (error) {
            console.error('Get current shift error:', error)
            return { success: false, error: 'Failed to fetch current shift' }
        }
    })

    ipcMain.handle('shifts:getAll', async () => {
        try {
            const shifts = await db.shift.findMany({
                include: { user: { select: { name: true } } },
                orderBy: { startTime: 'desc' }
            })
            return { success: true, shifts }
        } catch (error) {
            console.error('Get all shifts error:', error)
            return { success: false, error: 'Failed to fetch shifts' }
        }
    })

    ipcMain.handle('reports:getFinancialStats', async (_, options: { from: string; to: string }) => {
        try {
            const isSingleDayRange = options.from === options.to
            const startDate = new Date(options.from)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(options.to)
            endDate.setHours(23, 59, 59, 999)

            const dateFilter = { gte: startDate, lte: endDate }

            // Calculate the previous period of equal length for comparison
            const periodMs = endDate.getTime() - startDate.getTime()
            const prevEnd = new Date(startDate.getTime() - 1)
            prevEnd.setHours(23, 59, 59, 999)
            const prevStart = new Date(prevEnd.getTime() - periodMs)
            prevStart.setHours(0, 0, 0, 0)
            const prevDateFilter = { gte: prevStart, lte: prevEnd }

            // Current period data
            const [orders, sessions, expenses, debtPayments, inventoryPurchases] = await Promise.all([
                db.order.findMany({ 
                    where: { createdAt: dateFilter, isPaid: true },
                    include: { items: { include: { product: true } } }
                }),
                db.session.findMany({ where: { createdAt: dateFilter, status: 'COMPLETED' } }),
                db.expense.findMany({ where: { date: dateFilter } }),
                db.debtPayment.findMany({ where: { createdAt: dateFilter } }),
                db.inventoryLog.findMany({
                    where: {
                        createdAt: dateFilter,
                        type: { in: ['PURCHASE_RECEIPT', 'RESTOCK'] },
                        cost: { gt: 0 }
                    },
                    include: { product: true }
                })
            ])

            // Previous period data (for comparison)
            const [prevOrders, prevSessions, prevExpenses, prevDebtPayments, prevInventoryPurchases] = await Promise.all([
                db.order.findMany({ where: { createdAt: prevDateFilter, isPaid: true } }),
                db.session.findMany({ where: { createdAt: prevDateFilter, status: 'COMPLETED' } }),
                db.expense.findMany({ where: { date: prevDateFilter } }),
                db.debtPayment.findMany({ where: { createdAt: prevDateFilter } }),
                db.inventoryLog.findMany({
                    where: {
                        createdAt: prevDateFilter,
                        type: { in: ['PURCHASE_RECEIPT', 'RESTOCK'] },
                        cost: { gt: 0 }
                    }
                })
            ])

            // Current period calculations
            const revenueFromOrders = orders.reduce((sum: number, o: any) => sum + o.total, 0)
            const revenueFromSessions = sessions.reduce((sum: number, s: any) => sum + (s.cost || 0), 0)
            const revenueFromDebt = debtPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
            const totalRevenue = revenueFromOrders + revenueFromSessions + revenueFromDebt
            const explicitExpensesTotal = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
            const purchaseExpensesTotal = inventoryPurchases.reduce((sum: number, l: any) => sum + (l.cost || 0), 0)
            const totalExpenses = explicitExpensesTotal + purchaseExpensesTotal

            // Previous period calculations
            const prevRevenueFromOrders = prevOrders.reduce((sum: number, o: any) => sum + o.total, 0)
            const prevRevenueFromSessions = prevSessions.reduce((sum: number, s: any) => sum + (s.cost || 0), 0)
            const prevRevenueFromDebt = prevDebtPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
            const prevTotalRevenue = prevRevenueFromOrders + prevRevenueFromSessions + prevRevenueFromDebt
            const prevExplicitExpensesTotal = prevExpenses.reduce((sum: number, e: any) => sum + e.amount, 0)
            const prevPurchaseExpensesTotal = prevInventoryPurchases.reduce((sum: number, l: any) => sum + (l.cost || 0), 0)
            const prevTotalExpenses = prevExplicitExpensesTotal + prevPurchaseExpensesTotal
            const prevProfit = prevTotalRevenue - prevTotalExpenses

            // Delta calculations (percentage change)
            const calcDelta = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 100)

            // Group data for charts
            const revenueByDay: Record<string, number> = {}
            const expensesByDay: Record<string, number> = {}
            const revenueByHour: Record<string, number> = {}
            const expensesByHour: Record<string, number> = {}

            const fmt = (d: Date) => d.toISOString().split('T')[0]
            const fmtHour = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:00`

            // Initialize days in range
            const dayMs = 86400000
            const daysToCover = Math.max(1, Math.ceil(periodMs / dayMs))
            for (let i = 0; i < daysToCover; i++) {
                const d = new Date(startDate.getTime() + i * dayMs)
                const key = fmt(d)
                revenueByDay[key] = 0
                expensesByDay[key] = 0
            }

            if (isSingleDayRange) {
                for (let hour = 0; hour < 24; hour++) {
                    const key = `${String(hour).padStart(2, '0')}:00`
                    revenueByHour[key] = 0
                    expensesByHour[key] = 0
                }
            }

            orders.forEach((o: any) => { const k = fmt(o.createdAt); revenueByDay[k] = (revenueByDay[k] || 0) + o.total })
            sessions.forEach((s: any) => { const k = fmt(s.createdAt); revenueByDay[k] = (revenueByDay[k] || 0) + (s.cost || 0) })
            debtPayments.forEach((p: any) => { const k = fmt(p.createdAt); revenueByDay[k] = (revenueByDay[k] || 0) + p.amount })
            expenses.forEach((e: any) => { const k = fmt(e.date); expensesByDay[k] = (expensesByDay[k] || 0) + e.amount })
            inventoryPurchases.forEach((l: any) => {
                const k = fmt(l.createdAt)
                expensesByDay[k] = (expensesByDay[k] || 0) + (l.cost || 0)
            })

            if (isSingleDayRange) {
                orders.forEach((o: any) => {
                    const k = fmtHour(new Date(o.createdAt))
                    revenueByHour[k] = (revenueByHour[k] || 0) + o.total
                })
                sessions.forEach((s: any) => {
                    const k = fmtHour(new Date(s.createdAt))
                    revenueByHour[k] = (revenueByHour[k] || 0) + (s.cost || 0)
                })
                debtPayments.forEach((p: any) => {
                    const k = fmtHour(new Date(p.createdAt))
                    revenueByHour[k] = (revenueByHour[k] || 0) + p.amount
                })
                expenses.forEach((e: any) => {
                    const k = fmtHour(new Date(e.date))
                    expensesByHour[k] = (expensesByHour[k] || 0) + e.amount
                })
                inventoryPurchases.forEach((l: any) => {
                    const k = fmtHour(new Date(l.createdAt))
                    expensesByHour[k] = (expensesByHour[k] || 0) + (l.cost || 0)
                })
            }

            // Expense breakdown by category for P&L
            const expensesByCategory: Record<string, number> = {}
            expenses.forEach((e: any) => {
                const cat = e.category || 'Other'
                expensesByCategory[cat] = (expensesByCategory[cat] || 0) + e.amount
            })
            inventoryPurchases.forEach((l: any) => {
                const productName = l.product?.name || 'Unknown Product'
                const cat = `Inventory Purchase: ${productName}`
                expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (l.cost || 0)
            })

            // Product Sales Breakdown
            let snackRevenue = 0;
            let drinkRevenue = 0;
            let serviceRevenue = revenueFromSessions; // include session time
            const productSalesMap: Record<string, { name: string, amount: number, qty: number }> = {};

            orders.forEach((o: any) => {
                if (o.items) {
                    o.items.forEach((item: any) => {
                        const type = item.product?.type;
                        const name = item.product?.name || 'Unknown';
                        const amount = item.price * item.quantity;
                        const qty = item.quantity;

                        if (type === 'SNACK') snackRevenue += amount;
                        else if (type === 'DRINK') drinkRevenue += amount;
                        else if (type === 'SERVICE') serviceRevenue += amount;

                        if (type !== 'SERVICE') {
                            if (!productSalesMap[name]) {
                                productSalesMap[name] = { name, amount: 0, qty: 0 };
                            }
                            productSalesMap[name].amount += amount;
                            productSalesMap[name].qty += qty;
                        }
                    });
                }
            });

            const productComparison = [
                { name: 'Snacks', value: snackRevenue, fill: '#f59e0b' },
                { name: 'Drinks', value: drinkRevenue, fill: '#3b82f6' },
                { name: 'Services', value: serviceRevenue, fill: '#8b5cf6' }
            ];

            const topProducts = Object.values(productSalesMap)
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 5)
                .map((p, index) => ({
                    name: p.name,
                    value: p.qty,
                    revenue: p.amount,
                    fill: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index]
                }));

            return {
                success: true,
                stats: {
                    revenue: totalRevenue,
                    revenueFromOrders,
                    revenueFromSessions,
                    revenueFromDebt,
                    expenses: totalExpenses,
                    profit: totalRevenue - totalExpenses,
                    ordersCount: orders.length,
                    sessionsCount: sessions.length,
                    revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
                    expensesByDay: Object.entries(expensesByDay).map(([date, amount]) => ({ date, amount })),
                    revenueByHour: Object.entries(revenueByHour).map(([hour, amount]) => ({ hour, amount })),
                    expensesByHour: Object.entries(expensesByHour).map(([hour, amount]) => ({ hour, amount })),
                    expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({ category, amount })),
                    productComparison,
                    topProducts,
                    deltas: {
                        revenue: calcDelta(totalRevenue, prevTotalRevenue),
                        expenses: calcDelta(totalExpenses, prevTotalExpenses),
                        profit: calcDelta(totalRevenue - totalExpenses, prevProfit),
                        orders: calcDelta(orders.length, prevOrders.length),
                        sessions: calcDelta(sessions.length, prevSessions.length),
                    }
                }
            }
        } catch (error) {
            console.error('Financial stats error:', error)
            return { success: false, error: 'Failed to fetch financial stats' }
        }
    })

    ipcMain.handle('reports:getDailyDetails', async (_, options: { date: string }) => {
        try {
            const dayStart = new Date(options.date)
            if (Number.isNaN(dayStart.getTime())) {
                return { success: false, error: 'Invalid date' }
            }
            dayStart.setHours(0, 0, 0, 0)
            const dayEnd = new Date(dayStart)
            dayEnd.setHours(23, 59, 59, 999)
            const dateFilter = { gte: dayStart, lte: dayEnd }

            const [orders, sessions, debtPayments, expenses, inventoryLogs] = await Promise.all([
                db.order.findMany({
                    where: { createdAt: dateFilter },
                    include: {
                        items: {
                            include: { product: true }
                        },
                        user: { select: { name: true } },
                        staff: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
                db.session.findMany({
                    where: { createdAt: dateFilter },
                    include: { user: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }),
                db.debtPayment.findMany({
                    where: { createdAt: dateFilter },
                    include: { user: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }),
                db.expense.findMany({
                    where: { date: dateFilter },
                    orderBy: { date: 'desc' }
                }),
                db.inventoryLog.findMany({
                    where: { createdAt: dateFilter },
                    include: {
                        product: { select: { name: true } },
                        user: { select: { name: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }),
            ])

            const paidOrders = orders.filter((o: any) => o.isPaid)
            const revenueFromOrders = paidOrders.reduce((sum: number, o: any) => sum + o.total, 0)
            const revenueFromSessions = sessions.reduce((sum: number, s: any) => sum + (s.cost || 0), 0)
            const revenueFromDebt = debtPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
            const totalRevenue = revenueFromOrders + revenueFromSessions + revenueFromDebt

            const explicitExpensesTotal = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
            const purchaseLogs = inventoryLogs.filter((l: any) => ['PURCHASE_RECEIPT', 'RESTOCK'].includes(l.type))
            const purchaseExpensesTotal = purchaseLogs.reduce((sum: number, l: any) => sum + (l.cost || 0), 0)
            const totalExpenses = explicitExpensesTotal + purchaseExpensesTotal

            const expensesByCategoryMap: Record<string, number> = {}
            expenses.forEach((e: any) => {
                const category = e.category || 'Other'
                expensesByCategoryMap[category] = (expensesByCategoryMap[category] || 0) + e.amount
            })
            purchaseLogs.forEach((l: any) => {
                const category = `Inventory Purchase: ${l.product?.name || 'Unknown Product'}`
                expensesByCategoryMap[category] = (expensesByCategoryMap[category] || 0) + (l.cost || 0)
            })

            const productSalesMap: Record<string, { quantity: number; revenue: number }> = {}
            orders.forEach((order: any) => {
                order.items.forEach((item: any) => {
                    const name = item.product?.name || 'Unknown'
                    if (!productSalesMap[name]) {
                        productSalesMap[name] = { quantity: 0, revenue: 0 }
                    }
                    productSalesMap[name].quantity += item.quantity
                    productSalesMap[name].revenue += item.quantity * item.price
                })
            })

            const details = {
                date: options.date,
                summary: {
                    revenue: totalRevenue,
                    expenses: totalExpenses,
                    profit: totalRevenue - totalExpenses,
                    ordersCount: orders.length,
                    sessionsCount: sessions.length,
                    debtPaymentsCount: debtPayments.length,
                    inventoryMovementsCount: inventoryLogs.length,
                },
                revenue: {
                    orders: revenueFromOrders,
                    sessions: revenueFromSessions,
                    debtPayments: revenueFromDebt,
                },
                expensesByCategory: Object.entries(expensesByCategoryMap)
                    .map(([category, amount]) => ({ category, amount }))
                    .sort((a, b) => b.amount - a.amount),
                orders: orders.map((o: any) => ({
                    id: o.id,
                    total: o.total,
                    isPaid: o.isPaid,
                    createdAt: o.createdAt,
                    itemsCount: o.items.length,
                    staffName: o.staff?.name || null,
                    clientName: o.user?.name || null,
                })),
                sessions: sessions.map((s: any) => ({
                    id: s.id,
                    userName: s.user?.name || null,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    duration: s.duration,
                    cost: s.cost,
                    status: s.status,
                })),
                debtPayments: debtPayments.map((p: any) => ({
                    id: p.id,
                    userName: p.user?.name || 'Unknown',
                    amount: p.amount,
                    createdAt: p.createdAt,
                })),
                inventoryMovements: inventoryLogs.map((l: any) => ({
                    id: l.id,
                    type: l.type,
                    productName: l.product?.name || null,
                    change: l.change,
                    cost: l.cost || 0,
                    note: l.note || null,
                    createdAt: l.createdAt,
                    userName: l.user?.name || null,
                })),
                topProducts: Object.entries(productSalesMap)
                    .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 8),
            }

            return { success: true, details }
        } catch (error) {
            console.error('Daily details error:', error)
            return { success: false, error: 'Failed to fetch daily details' }
        }
    })

    ipcMain.handle('reports:getStaffPerformance', async (_, options: { from: string; to: string }) => {
        try {
            const startDate = new Date(options.from)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(options.to)
            endDate.setHours(23, 59, 59, 999)
            const dateFilter = { gte: startDate, lte: endDate }

            // Get all staff/owner users
            const staffUsers = await db.user.findMany({
                where: { role: { in: ['OWNER', 'STAFF'] } },
                select: { id: true, name: true, role: true }
            })

            const staffStats = await Promise.all(staffUsers.map(async (user: any) => {
                // Orders processed by this staff
                const orders = await db.order.findMany({
                    where: { staffId: user.id, createdAt: dateFilter }
                })
                const ordersCount = orders.length
                const ordersRevenue = orders.reduce((sum: number, o: any) => sum + o.total, 0)
                const cashRevenue = orders.filter((o: any) => o.isPaid).reduce((sum: number, o: any) => sum + o.total, 0)

                // Shifts worked
                const shifts = await db.shift.findMany({
                    where: { userId: user.id, startTime: dateFilter }
                })
                const shiftMinutes = shifts.reduce((sum: number, s: any) => {
                    const end = s.endTime ? new Date(s.endTime).getTime() : Date.now()
                    const start = new Date(s.startTime).getTime()
                    return sum + Math.floor((end - start) / 60000)
                }, 0)

                return {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    ordersCount,
                    ordersRevenue,
                    cashRevenue,
                    shiftsCount: shifts.length,
                    shiftMinutes,
                }
            }))

            // Sort by revenue descending
            staffStats.sort((a, b) => b.ordersRevenue - a.ordersRevenue)

            return { success: true, staff: staffStats }
        } catch (error) {
            console.error('Staff performance error:', error)
            return { success: false, error: 'Failed to fetch staff performance' }
        }
    })

    // ==================== BACKUPS ====================
    ipcMain.handle('backups:list', async () => {
        const { BackupService } = await import('./backup')
        return BackupService.listBackups()
    })

    ipcMain.handle('backups:create', async () => {
        const { BackupService } = await import('./backup')
        return BackupService.createBackup()
    })

    ipcMain.handle('backups:export', async () => {
        const { BackupService } = await import('./backup')
        return BackupService.exportBackup()
    })

    // ==================== PRINTING ====================
    ipcMain.handle('printers:get-list', async () => {
        try {
            const win = BrowserWindow.getFocusedWindow()
            if (!win) return []
            return await win.webContents.getPrintersAsync()
        } catch (error) {
            console.error('Get printers error:', error)
            return []
        }
    })

    ipcMain.handle('printer:print-receipt', async (_, data: {
        shopName?: string
        address?: string
        phone?: string
        order?: any
        session?: any
        footer?: string
        printerName?: string
    }) => {
        try {
            const receiptData: any[] = []

            // Header
            receiptData.push({
                type: 'text',
                value: data.shopName || 'GLISSA POS',
                style: { fontWeight: "700", textAlign: 'center', fontSize: "20px" }
            })

            if (data.address) {
                receiptData.push({
                    type: 'text',
                    value: data.address,
                    style: { textAlign: 'center', fontSize: "12px" }
                })
            }

            receiptData.push({
                type: 'text',
                value: '--------------------------------',
                style: { textAlign: 'center' }
            })

            // Order/Session Info
            const now = new Date().toLocaleString()
            receiptData.push({
                type: 'text',
                value: `Date: ${now}`,
                style: { fontSize: "12px" }
            })

            if (data.order) {
                receiptData.push({
                    type: 'text',
                    value: `Order ID: ${data.order.id.slice(-6).toUpperCase()}`,
                    style: { fontSize: "12px" }
                })
                receiptData.push({
                    type: 'text',
                    value: 'Items:',
                    style: { fontWeight: "700", marginTop: "10px" }
                })

                data.order.items.forEach((item: any) => {
                    receiptData.push({
                        type: 'text',
                        value: `${item.product.name} x${item.quantity}`,
                        style: { fontSize: "12px" }
                    })
                    receiptData.push({
                        type: 'text',
                        value: `   ${(item.price * item.quantity).toFixed(2)} DH`,
                        style: { textAlign: 'right', fontSize: "12px" }
                    })
                })

                receiptData.push({
                    type: 'text',
                    value: '--------------------------------',
                    style: { textAlign: 'center' }
                })

                receiptData.push({
                    type: 'text',
                    value: `TOTAL: ${data.order.total.toFixed(2)} DH`,
                    style: { fontWeight: "700", textAlign: 'right', fontSize: "16px" }
                })
            }

            if (data.session) {
                receiptData.push({
                    type: 'text',
                    value: `Post: PS ${data.session.postNumber || '?' }`,
                    style: { fontSize: "14px", fontWeight: "700" }
                })
                receiptData.push({
                    type: 'text',
                    value: `Duration: ${data.session.duration || 0} min`,
                    style: { fontSize: "12px" }
                })
                receiptData.push({
                    type: 'text',
                    value: `Cost: ${data.session.cost?.toFixed(2) || '0.00'} DH`,
                    style: { fontWeight: "700", fontSize: "14px" }
                })
            }

            receiptData.push({
                type: 'text',
                value: '--------------------------------',
                style: { textAlign: 'center', marginTop: "10px" }
            })

            receiptData.push({
                type: 'text',
                value: data.footer || 'Thank you for your visit!',
                style: { textAlign: 'center', fontSize: "10px", fontStyle: 'italic' }
            })

            const options = {
                preview: false,
                width: '300px',
                margin: '0 0 0 0',
                copies: 1,
                printerName: data.printerName || '',
                timeOutPerLine: 400,
                silent: true
            }

            await PosPrinter.print(receiptData, options)
            return { success: true }
        } catch (error) {
            console.error('Print receipt error:', error)
            return { success: false, error: 'Printing failed' }
        }
    })

    console.log('✅ IPC handlers registered')
}
