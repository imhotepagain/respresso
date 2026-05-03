// Postbuild: copy node_modules/.prisma into the packaged app's asar.unpacked folder.
// electron-builder excludes dot-folders from asar by default, so we have to do it ourselves.
// Electron's asar transparent routing automatically uses files in app.asar.unpacked/
// when the same path is requested from app.asar/.
import fs from 'node:fs'
import path from 'node:path'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const version = pkg.version

const src = path.resolve('node_modules/.prisma')
const dst = path.resolve(`release/${version}/win-unpacked/resources/app.asar.unpacked/node_modules/.prisma`)

if (!fs.existsSync(src)) {
  console.error(`[copy-prisma] Source not found: ${src}`)
  process.exit(1)
}
if (!fs.existsSync(path.dirname(dst))) {
  fs.mkdirSync(path.dirname(dst), { recursive: true })
}
fs.cpSync(src, dst, { recursive: true })
console.log(`[copy-prisma] Copied .prisma -> ${dst}`)
