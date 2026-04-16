import { ipcMain } from 'electron'
import { getDatabase } from './database'
import bcrypt from 'bcryptjs'

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
            const product = await db.product.create({ data })
            return { success: true, product }
        } catch (error) {
            console.error('Create product error:', error)
            return { success: false, error: 'Failed to create product' }
        }
    })

    ipcMain.handle('products:update', async (_, { id, data }: { id: string; data: any }) => {
        try {
            const product = await db.product.update({
                where: { id },
                data,
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
            const order = await db.order.create({
                data: {
                    userId: data.userId,
                    staffId: data.staffId,
                    total: data.total,
                    isPaid: data.isPaid,
                    items: {
                        create: data.items,
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

            // Update user balance if not paid (debt)
            if (!data.isPaid && data.userId) {
                await db.user.update({
                    where: { id: data.userId },
                    data: {
                        balance: {
                            increment: data.total,
                        },
                    },
                })
            }

            // Update product stock
            for (const item of data.items) {
                await db.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                })

                // Log inventory change
                await db.inventoryLog.create({
                    data: {
                        productId: item.productId,
                        userId: data.staffId,
                        change: -item.quantity,
                        type: 'SALE',
                        note: `Order #${order.id}`,
                    },
                })
            }

            return { success: true, order }
        } catch (error) {
            console.error('Create order error:', error)
            return { success: false, error: 'Failed to create order' }
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
            const log = await db.inventoryLog.create({
                data,
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

            // Update product stock
            if (data.productId) {
                await db.product.update({
                    where: { id: data.productId },
                    data: {
                        stock: {
                            increment: data.change,
                        },
                    },
                })
            }

            return { success: true, log }
        } catch (error) {
            console.error('Add inventory log error:', error)
            return { success: false, error: 'Failed to add inventory log' }
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

                if (log.type === 'RESTOCK') {
                    if (log.productId) {
                        stats.productStats[log.productId].restocked += log.change
                    }
                    if (log.cost) {
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

    console.log('✅ IPC handlers registered')
}

