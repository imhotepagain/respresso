import { contextBridge, ipcRenderer } from 'electron'
import { ElectronAPI } from '../src/types/electron'

// Expose a typed API to the renderer process
const api: ElectronAPI = {
  // Auth
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  createUser: (data) => ipcRenderer.invoke('auth:createUser', data),
  checkHasUsers: () => ipcRenderer.invoke('auth:checkHasUsers'),

  // Users
  getAllUsers: () => ipcRenderer.invoke('users:getAll'),
  getUserById: (id) => ipcRenderer.invoke('users:getById', id),
  updateUser: (id, data) => ipcRenderer.invoke('users:update', { id, data }),
  deleteUser: (id) => ipcRenderer.invoke('users:delete', id),
  resetUserPassword: (userId, newPassword) => ipcRenderer.invoke('users:resetPassword', { userId, newPassword }),

  // Products
  getAllProducts: () => ipcRenderer.invoke('products:getAll'),
  getProductById: (id) => ipcRenderer.invoke('products:getById', id),
  createProduct: (data) => ipcRenderer.invoke('products:create', data),
  updateProduct: (id, data) => ipcRenderer.invoke('products:update', { id, data }),
  deleteProduct: (id) => ipcRenderer.invoke('products:delete', id),

  // Orders
  getAllOrders: () => ipcRenderer.invoke('orders:getAll'),
  createOrder: (data) => ipcRenderer.invoke('orders:create', data),

  // Sessions
  getAllSessions: () => ipcRenderer.invoke('sessions:getAll'),
  getActiveSessions: () => ipcRenderer.invoke('sessions:getActive'),
  createSession: (data) => ipcRenderer.invoke('sessions:create', data),
  updateSession: (id, data) => ipcRenderer.invoke('sessions:update', { id, data }),

  // Inventory
  getInventoryLogs: () => ipcRenderer.invoke('inventory:getLogs'),
  addInventoryLog: (data) => ipcRenderer.invoke('inventory:addLog', data),

  // Debt
  getDebtPayments: (userId) => ipcRenderer.invoke('debt:getPayments', userId),
  addDebtPayment: (data) => ipcRenderer.invoke('debt:addPayment', data),

  // Expenses
  getExpenses: (options) => ipcRenderer.invoke('expenses:getAll', options),
  createExpense: (data) => ipcRenderer.invoke('expenses:create', data),
  deleteExpense: (id) => ipcRenderer.invoke('expenses:delete', id),

  // Shifts
  startShift: (data) => ipcRenderer.invoke('shifts:start', data),
  endShift: (data) => ipcRenderer.invoke('shifts:end', data),
  getCurrentShift: (userId) => ipcRenderer.invoke('shifts:getCurrent', userId),
  getAllShifts: () => ipcRenderer.invoke('shifts:getAll'),

  // Analytics
  getFinancialStats: (options) => ipcRenderer.invoke('reports:getFinancialStats', options),
  getStaffPerformance: (options) => ipcRenderer.invoke('reports:getStaffPerformance', options),
  getDailyReportDetails: (options) => ipcRenderer.invoke('reports:getDailyDetails', options),

  // Reports
  getAnalytics: (options) => ipcRenderer.invoke('reports:getAnalytics', options),
  getActivityLogs: (options) => ipcRenderer.invoke('inventory:getActivityLogs', options),
  getStats: (options) => ipcRenderer.invoke('reports:getStats', options),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),
  getDashboardTrend: () => ipcRenderer.invoke('dashboard:getTodayTrend'),

  // Backups
  listBackups: () => ipcRenderer.invoke('backups:list'),
  createBackup: () => ipcRenderer.invoke('backups:create'),
  exportBackup: () => ipcRenderer.invoke('backups:export'),

  // Printing
  getPrinters: () => ipcRenderer.invoke('printers:get-list'),
  printReceipt: (data) => ipcRenderer.invoke('printer:print-receipt', data),
}



contextBridge.exposeInMainWorld('api', api)

