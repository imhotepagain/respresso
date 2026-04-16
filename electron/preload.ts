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

  // Reports
  getAnalytics: (options) => ipcRenderer.invoke('reports:getAnalytics', options),
  getActivityLogs: (options) => ipcRenderer.invoke('inventory:getActivityLogs', options),
  getStats: (options) => ipcRenderer.invoke('reports:getStats', options),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:getStats'),
}


contextBridge.exposeInMainWorld('api', api)

