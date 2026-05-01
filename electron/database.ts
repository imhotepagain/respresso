import path from 'node:path'
import { app } from 'electron'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Initialize Prisma Client
let prisma: any

export function initDatabase() {
    // Set database path to user data directory for production
    const isDev = process.env.NODE_ENV === 'development'
    const dbPath = isDev
        ? path.join(process.cwd(), 'prisma', 'dev.db')
        : path.join(app.getPath('userData'), 'respresso.db')

    // In production, if the database doesn't exist in userData, copy the template from the app bundle
    if (!isDev) {
        const fs = require('node:fs')
        try {
            if (!fs.existsSync(dbPath)) {
                // Try looking for the template in extraResources first, then asar
                const templatePath = path.join(process.resourcesPath, 'prisma', 'dev.db')
                const asarTemplatePath = path.join(app.getAppPath(), 'prisma', 'dev.db')
                
                if (fs.existsSync(templatePath)) {
                    fs.copyFileSync(templatePath, dbPath)
                } else if (fs.existsSync(asarTemplatePath)) {
                    fs.copyFileSync(asarTemplatePath, dbPath)
                }
            }
        } catch (e) {
            console.error('Failed to copy database template:', e)
        }
    }

    process.env.DATABASE_URL = `file:${dbPath}`

    // Use require to load Prisma Client (fixes ESM issues in Electron)
    const { PrismaClient } = require('@prisma/client')

    const prismaConfig: any = {
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    }

    // In production, tell Prisma where to find the query engine
    if (!isDev) {
        const engineExtension = process.platform === 'win32' ? '.dll.node' : '.dylib.node'
        
        // For Apple Silicon vs Intel
        let engineName = `libquery_engine-${process.platform}`
        if (process.platform === 'win32') {
            engineName = `query_engine-windows`
        } else if (process.arch === 'arm64') {
            engineName = `libquery_engine-darwin-arm64`
        }

        const enginePath = path.join(
            process.resourcesPath,
            'client',
            `${engineName}${engineExtension}`
        )
        
        prismaConfig.__internal = {
            engine: {
                binaryPath: enginePath
            }
        }
    }

    try {
        prisma = new PrismaClient(prismaConfig)
    } catch (e) {
        console.error('Prisma initialization failed:', e)
        // Log to file for debugging in production
        if (!isDev) {
            const fs = require('node:fs')
            const logPath = path.join(app.getPath('userData'), 'error-log.txt')
            fs.appendFileSync(logPath, `${new Date().toISOString()} - Prisma Init Error: ${e}\n`)
        }
    }

    return prisma
}

export function getDatabase() {
    if (!prisma) {
        throw new Error('Database not initialized. Call initDatabase() first.')
    }
    return prisma
}

export async function closeDatabase() {
    if (prisma) {
        await prisma.$disconnect()
    }
}
