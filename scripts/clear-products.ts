import { PrismaClient } from '@prisma/client'

// Use the local development database by default if not specified
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:../prisma/dev.db"
}

const prisma = new PrismaClient()

async function main() {
    console.log('Deleting all remaining products from the database...')
    const products = await prisma.product.deleteMany()
    console.log(`✓ Successfully deleted ${products.count} products.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
