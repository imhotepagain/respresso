// Type definitions for the IPC API exposed to the renderer process

export interface User {
    id: string
    name: string
    role: string
    balance: number
    createdAt: Date
    updatedAt: Date
}

export interface Product {
    id: string
    name: string
    price: number
    type: string
    category: string | null
    stock: number
    imageUrl: string | null
    createdAt: Date
    updatedAt: Date
}

export interface Session {
    id: string
    userId: string | null
    user: { id: string; name: string } | null
    startTime: Date
    endTime: Date | null
    duration: number | null
    limitMinutes: number | null
    postNumber: number | null
    cost: number | null
    status: string
    createdAt: Date
    updatedAt: Date
}

export interface OrderItem {
    id: string
    orderId: string
    productId: string
    product: Product
    quantity: number
    price: number
}

export interface Order {
    id: string
    userId: string | null
    user: { id: string; name: string; role: string } | null
    staffId: string | null
    staff: { id: string; name: string } | null
    items: OrderItem[]
    total: number
    isPaid: boolean
    createdAt: Date
    updatedAt: Date
}

export interface InventoryLog {
    id: string
    productId: string | null
    product: Product | null
    userId: string | null
    user: { id: string; name: string } | null
    change: number
    cost: number | null
    type: string
    note: string | null
    createdAt: Date
}

export interface DebtPayment {
    id: string
    userId: string
    user: { id: string; name: string }
    amount: number
    createdAt: Date
}

export interface Expense {
    id: string
    amount: number
    category: string
    description: string | null
    date: Date
    createdAt: Date
    updatedAt: Date
    userId: string | null
    user: { id: string; name: string } | null
}

export interface Shift {
    id: string
    userId: string
    user?: { name: string }
    startTime: Date
    endTime: Date | null
    startCash: number
    endCash: number | null
    expectedCash: number | null
    status: 'OPEN' | 'CLOSED'
    notes: string | null
    createdAt: Date
    updatedAt: Date
}

export interface DailyStats {
    revenue: {
        total: number
        cash: number
        debt: number
    }
    expenses: {
        total: number
    }
    orders: {
        count: number
        totalAmount: number
    }
    sessions: {
        count: number
        totalCost: number
        totalMinutes: number
    }
    debtPayments: {
        total: number
        count: number
    }
    productStats: Record<string, {
        name: string
        sold: number
        revenue: number
        restocked: number
    }>
}

export interface DailyReportDetails {
    date: string
    summary: {
        revenue: number
        expenses: number
        profit: number
        ordersCount: number
        sessionsCount: number
        debtPaymentsCount: number
        inventoryMovementsCount: number
    }
    revenue: {
        orders: number
        sessions: number
        debtPayments: number
    }
    expensesByCategory: Array<{ category: string; amount: number }>
    orders: Array<{
        id: string
        total: number
        isPaid: boolean
        createdAt: Date
        itemsCount: number
        staffName: string | null
        clientName: string | null
    }>
    sessions: Array<{
        id: string
        userName: string | null
        startTime: Date
        endTime: Date | null
        duration: number | null
        cost: number | null
        status: string
    }>
    debtPayments: Array<{
        id: string
        userName: string
        amount: number
        createdAt: Date
    }>
    inventoryMovements: Array<{
        id: string
        type: string
        productName: string | null
        change: number
        cost: number
        note: string | null
        createdAt: Date
        userName: string | null
    }>
    topProducts: Array<{
        name: string
        quantity: number
        revenue: number
    }>
}

export interface ApiResponse<T> {
    success: boolean
    error?: string
    data?: T
}

export type InventoryMovementType =
    | 'SALE'
    | 'PURCHASE_RECEIPT'
    | 'OPENING_BALANCE'
    | 'ADJUSTMENT_IN'
    | 'ADJUSTMENT_OUT'
    | 'WASTE'
    | 'RETURN_TO_SUPPLIER'
    | 'RESTOCK'
    | 'ADJUSTMENT'

export interface CreateProductInput {
    name: string
    price: number
    type: string
    category: string | null
    imageUrl: string | null
    stockMode?: 'NONE' | 'PURCHASE_RECEIPT' | 'OPENING_BALANCE'
    initialStock?: number
    initialCost?: number
    userId?: string
    // Backward compatibility for older calls.
    stock?: number
}

// API interface that will be exposed via window.api
export interface ElectronAPI {
    // Auth
    login: (credentials: { name: string; password: string }) => Promise<{ success: boolean; user?: User; error?: string }>
    createUser: (data: { name: string; password: string; role: string }) => Promise<{ success: boolean; user?: User; error?: string }>
    checkHasUsers: () => Promise<{ success: boolean; hasUsers: boolean; error?: string }>

    // Users
    getAllUsers: () => Promise<{ success: boolean; users?: User[]; error?: string }>
    getUserById: (id: string) => Promise<{ success: boolean; user?: User; error?: string }>
    updateUser: (id: string, data: Partial<User>) => Promise<{ success: boolean; user?: User; error?: string }>
    deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>
    resetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>

    // Products
    getAllProducts: () => Promise<{ success: boolean; products?: Product[]; error?: string }>
    getProductById: (id: string) => Promise<{ success: boolean; product?: Product; error?: string }>
    createProduct: (data: CreateProductInput) => Promise<{ success: boolean; product?: Product; error?: string }>
    updateProduct: (id: string, data: Partial<Product>) => Promise<{ success: boolean; product?: Product; error?: string }>
    deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>

    // Orders
    getAllOrders: () => Promise<{ success: boolean; orders?: Order[]; error?: string }>
    createOrder: (data: {
        userId?: string
        staffId?: string
        total: number
        isPaid: boolean
        items: Array<{ productId: string; quantity: number; price: number }>
    }) => Promise<{ success: boolean; order?: Order; error?: string }>

    // Sessions
    getAllSessions: () => Promise<{ success: boolean; sessions?: Session[]; error?: string }>
    getActiveSessions: () => Promise<{ success: boolean; sessions?: Session[]; error?: string }>
    createSession: (data: Partial<Session>) => Promise<{ success: boolean; session?: Session; error?: string }>
    updateSession: (id: string, data: Partial<Session>) => Promise<{ success: boolean; session?: Session; error?: string }>

    // Inventory
    getInventoryLogs: () => Promise<{ success: boolean; logs?: InventoryLog[]; error?: string }>
    addInventoryLog: (data: {
        productId?: string
        userId?: string
        change: number
        cost?: number
        type: InventoryMovementType
        note?: string
    }) => Promise<{ success: boolean; log?: InventoryLog; error?: string }>

    // Debt
    getDebtPayments: (userId?: string) => Promise<{ success: boolean; payments?: DebtPayment[]; error?: string }>
    addDebtPayment: (data: { userId: string; amount: number }) => Promise<{ success: boolean; payment?: DebtPayment; error?: string }>

    // Expenses
    getExpenses: (options?: { from?: Date; to?: Date }) => Promise<{ success: boolean; expenses?: Expense[]; error?: string }>
    createExpense: (data: { amount: number; category: string; description?: string; date?: Date; userId?: string }) => Promise<{ success: boolean; expense?: Expense; error?: string }>
    deleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;

    // Shifts
    startShift: (data: { userId: string; startCash: number; notes?: string }) => Promise<{ success: boolean; shift?: Shift; error?: string }>;
    endShift: (data: { id: string; endCash: number; notes?: string }) => Promise<{ success: boolean; shift?: Shift; error?: string }>;
    getCurrentShift: (userId: string) => Promise<{ success: boolean; shift?: Shift | null; error?: string }>;
    getAllShifts: () => Promise<{ success: boolean; shifts?: Shift[]; error?: string }>;

    // Analytics
    getFinancialStats: (options: { from: string; to: string }) => Promise<{
        success: boolean;
        stats?: {
            revenue: number;
            revenueFromOrders: number;
            revenueFromSessions: number;
            revenueFromDebt: number;
            expenses: number;
            profit: number;
            ordersCount: number;
            sessionsCount: number;
            revenueByDay: { date: string; amount: number }[];
            expensesByDay: { date: string; amount: number }[];
            revenueByHour: { hour: string; amount: number }[];
            expensesByHour: { hour: string; amount: number }[];
            expensesByCategory: { category: string; amount: number }[];
            deltas: {
                revenue: number;
                expenses: number;
                profit: number;
                orders: number;
                sessions: number;
            };
        };
        error?: string;
    }>;
    getStaffPerformance: (options: { from: string; to: string }) => Promise<{
        success: boolean;
        staff?: {
            id: string;
            name: string;
            role: string;
            ordersCount: number;
            ordersRevenue: number;
            cashRevenue: number;
            shiftsCount: number;
            shiftMinutes: number;
        }[];
        error?: string;
    }>;
    getDailyReportDetails: (options: { date: string }) => Promise<{
        success: boolean
        details?: DailyReportDetails
        error?: string
    }>

    // Reports
    getAnalytics: (options?: { days?: number }) => Promise<{
        success: boolean
        data: {
            trend: { date: string, revenue: number, cash: number, debt: number }[]
            categoryData: { name: string, value: number }[]
            topProducts: { name: string, value: number }[]
        }
        error?: string
    }>
    getActivityLogs: (options: {
        page?: number
        limit?: number
        userId?: string
        search?: string
        type?: string
        from?: Date
        to?: Date
    }) => Promise<{
        success: boolean
        logs: any[]
        totalCount: number
        totalPages: number
        error?: string
    }>
    getStats: (options: { from: string | Date; to: string | Date; userId?: string }) => Promise<{ success: boolean; stats?: DailyStats; error?: string }>

    // Dashboard
    getDashboardStats: () => Promise<{ success: boolean; stats?: { userCount: number; activeSessions: number; productCount: number; totalDebt: number; lowStock?: any[] }; error?: string }>
    getDashboardTrend: () => Promise<{ success: boolean; trend: { hour: string; cash: number; debt: number; sessions: number }[] }>

    // Backups
    listBackups: () => Promise<Array<{ name: string; path: string; createdAt: Date; size: number }>>
    createBackup: () => Promise<{ success: boolean; path?: string; name?: string; error?: string }>
    exportBackup: () => Promise<{ success: boolean; path?: string; error?: string }>

    // Printing
    getPrinters: () => Promise<any[]>
    printReceipt: (data: {
        shopName?: string
        address?: string
        phone?: string
        order?: Order
        session?: Session
        footer?: string
        printerName?: string
    }) => Promise<{ success: boolean; error?: string }>
}


declare global {
    interface Window {
        api: ElectronAPI
    }
}
