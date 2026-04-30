import fs from 'node:fs'
import path from 'node:path'
import { app, dialog } from 'electron'

export class BackupService {
    private static backupDir = path.join(app.getPath('userData'), 'backups')
    private static maxBackups = 10

    static init() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true })
        }
    }

    static async createBackup() {
        const isDev = process.env.NODE_ENV === 'development'
        const dbPath = isDev
            ? path.join(process.cwd(), 'prisma', 'dev.db')
            : path.join(app.getPath('userData'), 'respresso.db')

        if (!fs.existsSync(dbPath)) {
            return { success: false, error: 'Database file not found' }
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupName = `respresso_backup_${timestamp}.db`
        const backupPath = path.join(this.backupDir, backupName)

        try {
            fs.copyFileSync(dbPath, backupPath)
            this.rotateBackups()
            return { success: true, path: backupPath, name: backupName }
        } catch (error) {
            console.error('Backup error:', error)
            return { success: false, error: 'Failed to copy database file' }
        }
    }

    static listBackups() {
        try {
            if (!fs.existsSync(this.backupDir)) return []
            
            const files = fs.readdirSync(this.backupDir)
            return files
                .filter(f => f.endsWith('.db'))
                .map(f => {
                    const stats = fs.statSync(path.join(this.backupDir, f))
                    return {
                        name: f,
                        path: path.join(this.backupDir, f),
                        createdAt: stats.birthtime,
                        size: stats.size
                    }
                })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        } catch (error) {
            console.error('List backups error:', error)
            return []
        }
    }

    private static rotateBackups() {
        const backups = this.listBackups()
        if (backups.length > this.maxBackups) {
            const toDelete = backups.slice(this.maxBackups)
            toDelete.forEach(b => {
                try {
                    fs.unlinkSync(b.path)
                } catch (e) {
                    console.error('Failed to delete old backup:', e)
                }
            })
        }
    }

    static async exportBackup() {
        const isDev = process.env.NODE_ENV === 'development'
        const dbPath = isDev
            ? path.join(process.cwd(), 'prisma', 'dev.db')
            : path.join(app.getPath('userData'), 'respresso.db')

        const { filePath } = await dialog.showSaveDialog({
            title: 'Export Database Backup',
            defaultPath: path.join(app.getPath('downloads'), `respresso_export_${new Date().toISOString().split('T')[0]}.db`),
            filters: [{ name: 'SQLite Database', extensions: ['db'] }]
        })

        if (filePath) {
            try {
                fs.copyFileSync(dbPath, filePath)
                return { success: true, path: filePath }
            } catch (error) {
                console.error('Export error:', error)
                return { success: false, error: 'Failed to export database' }
            }
        }
        return { success: false, error: 'Export cancelled' }
    }
}
