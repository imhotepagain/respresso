// Force-create a truly empty respresso.db at userData with the current schema applied.
import { execSync } from 'node:child_process'
import { existsSync, unlinkSync, mkdirSync, copyFileSync } from 'node:fs'
import path from 'node:path'

const userDataDir = path.join(process.env.APPDATA, 'GLISSA')
const userDataDb  = path.join(userDataDir, 'respresso.db')
const sourceDb    = path.resolve('prisma/dev.db')
const winUnpackedDb = path.resolve('release/0.1.0/win-unpacked/resources/prisma/dev.db')

if (!existsSync(userDataDir)) mkdirSync(userDataDir, { recursive: true })

for (const f of [userDataDb, sourceDb, winUnpackedDb]) {
  if (existsSync(f)) { unlinkSync(f); console.log('deleted', f) }
}

// Push schema to source dev.db (creates empty DB with all tables)
process.env.DATABASE_URL = `file:${sourceDb.replace(/\\/g, '/')}`
console.log('DATABASE_URL =', process.env.DATABASE_URL)
execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit', env: process.env })

if (!existsSync(sourceDb)) {
  console.error('Source dev.db still missing after prisma db push — aborting')
  process.exit(1)
}

console.log('source DB size:', (await import('node:fs')).statSync(sourceDb).size, 'bytes')

// Copy to both userData and win-unpacked template
copyFileSync(sourceDb, userDataDb)
console.log('copied to', userDataDb)
mkdirSync(path.dirname(winUnpackedDb), { recursive: true })
copyFileSync(sourceDb, winUnpackedDb)
console.log('copied to', winUnpackedDb)

console.log('\n=== DONE — empty DB ready ===')
