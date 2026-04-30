import { PrismaClient } from '@prisma/client'

// Use the local development database by default if not specified
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:../prisma/dev.db"
}

const prisma = new PrismaClient()

async function main() {
    console.log('--- PREPARING SYSTEM FOR FINAL DELIVERY ---')
    console.log('Using Option A: Clearing users, sessions, and orders, but KEEPING GLISSA products.\n')

    // 1. Delete Sessions
    console.log('Deleting all Session history...')
    const sessions = await prisma.session.deleteMany()
    console.log(`✓ Deleted ${sessions.count} sessions.\n`)

    // 2. Delete Order Items (must delete before Orders due to foreign keys)
    console.log('Deleting all OrderItems...')
    const orderItems = await prisma.orderItem.deleteMany()
    console.log(`✓ Deleted ${orderItems.count} order items.\n`)

    // 3. Delete Orders
    console.log('Deleting all Orders...')
    const orders = await prisma.order.deleteMany()
    console.log(`✓ Deleted ${orders.count} orders.\n`)

    // 4. Delete Debt Payments
    console.log('Deleting all DebtPayments...')
    const debts = await prisma.debtPayment.deleteMany()
    console.log(`✓ Deleted ${debts.count} debt payments.\n`)

    // 5. Delete Inventory Logs
    console.log('Deleting all InventoryLogs...')
    const logs = await prisma.inventoryLog.deleteMany()
    console.log(`✓ Deleted ${logs.count} inventory logs.\n`)

    // 6. Delete CLIENT users (keep OWNER)
    console.log('Deleting all CLIENT users...')
    const clients = await prisma.user.deleteMany({
        where: { role: 'CLIENT' }
    })
    console.log(`✓ Deleted ${clients.count} client accounts.\n`)

    console.log('--- DONE ---')
    console.log('The database is now completely clean except for the OWNER accounts and the GLISSA Products Menu.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
