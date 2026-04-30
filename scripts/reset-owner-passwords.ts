import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Use the local development database by default if not specified
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:../prisma/dev.db"
}

const prisma = new PrismaClient()

async function main() {
    const DEFAULT_PASSWORD = 'admin'
    console.log(`Resetting all OWNER passwords to: ${DEFAULT_PASSWORD}`)

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    const result = await prisma.user.updateMany({
        where: {
            role: 'OWNER'
        },
        data: {
            password: hashedPassword
        }
    })

    console.log(`Successfully reset passwords for ${result.count} owner accounts.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
