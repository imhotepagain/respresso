import { PrismaClient } from '@prisma/client'

// Use the local development database by default if not specified
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:../prisma/dev.db"
}

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany()
    console.log(`Found ${users.length} users:`)
    for (const user of users) {
        console.log(`- Username: ${user.name} | Role: ${user.role}`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
