import { PrismaClient } from '@prisma/client'

// Use the local development database by default if not specified
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:../prisma/dev.db"
}

const prisma = new PrismaClient()

const products = [
    // HOT DRINKS
    { name: 'Premium Espresso (100% Arabica)', price: 14, type: 'DRINK', category: 'Hot Drinks', stock: 999999 },
    { name: 'Espresso', price: 9, type: 'DRINK', category: 'Hot Drinks', stock: 999999 },
    { name: 'Double Espresso', price: 14, type: 'DRINK', category: 'Hot Drinks', stock: 999999 },
    { name: 'Americano', price: 10, type: 'DRINK', category: 'Hot Drinks', stock: 999999 },
    { name: 'Cappuccino', price: 12, type: 'DRINK', category: 'Hot Drinks', stock: 999999 },
    { name: 'Latte', price: 10, type: 'DRINK', category: 'Hot Drinks', stock: 999999 },
    { name: 'Mocha', price: 14, type: 'DRINK', category: 'Hot Drinks', stock: 999999 },
    { name: 'Hot Chocolate', price: 10, type: 'DRINK', category: 'Hot Drinks', stock: 999999 },
    { name: 'Special Hot Chocolate', price: 18, type: 'DRINK', category: 'Hot Drinks', stock: 999999 },
    { name: 'Matcha Latte', price: 20, type: 'DRINK', category: 'Hot Drinks', stock: 999999 },

    // COLD DRINKS
    { name: 'Iced Coffee', price: 12, type: 'DRINK', category: 'Cold Drinks', stock: 999999 },
    { name: 'Iced Latte', price: 14, type: 'DRINK', category: 'Cold Drinks', stock: 999999 },
    { name: 'Iced Caramel Macchiato', price: 14, type: 'DRINK', category: 'Cold Drinks', stock: 999999 },
    { name: 'Matcha Iced Latte', price: 20, type: 'DRINK', category: 'Cold Drinks', stock: 999999 },

    // TEA & INFUSIONS
    { name: 'Moroccan Tea', price: 10, type: 'DRINK', category: 'Tea & Infusions', stock: 999999 },
    { name: 'Tisanes & Verveines', price: 10, type: 'DRINK', category: 'Tea & Infusions', stock: 999999 },

    // WATERS & SOFT DRINKS
    { name: 'Water 33cl', price: 2, type: 'DRINK', category: 'Waters & Soft Drinks', stock: 999999 },
    { name: 'Water 50cl', price: 3, type: 'DRINK', category: 'Waters & Soft Drinks', stock: 999999 },
    { name: 'Sodas (Coca-Cola / Zero / Sprite / Fanta)', price: 8, type: 'DRINK', category: 'Waters & Soft Drinks', stock: 999999 },
    { name: 'Ginger Shot', price: 8, type: 'DRINK', category: 'Waters & Soft Drinks', stock: 999999 },
    { name: 'Orange Juice', price: 12, type: 'DRINK', category: 'Waters & Soft Drinks', stock: 999999 },

    // VIRGIN COCKTAILS
    { name: 'Virgin Mojito', price: 15, type: 'DRINK', category: 'Virgin Cocktails', stock: 999999 },
    { name: 'Pina Colada', price: 18, type: 'DRINK', category: 'Virgin Cocktails', stock: 999999 },
    { name: 'Red Mojito', price: 18, type: 'DRINK', category: 'Virgin Cocktails', stock: 999999 },
    { name: 'Bleu Mojito', price: 18, type: 'DRINK', category: 'Virgin Cocktails', stock: 999999 },

    // SERVICES (GAMING MENU)
    { name: 'PS5 - Match (12 Min) - Day', price: 5, type: 'SERVICE', category: 'Day Session', stock: 999999 },
    { name: 'PS5 - 30 Minutes - Day', price: 10, type: 'SERVICE', category: 'Day Session', stock: 999999 },
    { name: 'PS5 - 1 Hour - Day', price: 20, type: 'SERVICE', category: 'Day Session', stock: 999999 },
    { name: 'PS5 - 2 Hours - Day', price: 25, type: 'SERVICE', category: 'Day Session', stock: 999999 },
    
    { name: 'PS5 - Match (12 Min) - Evening', price: 5, type: 'SERVICE', category: 'Evening Session', stock: 999999 },
    { name: 'PS5 - 30 Minutes - Evening', price: 15, type: 'SERVICE', category: 'Evening Session', stock: 999999 },
    { name: 'PS5 - 1 Hour - Evening', price: 25, type: 'SERVICE', category: 'Evening Session', stock: 999999 },
    { name: 'PS5 - 2 Hours - Evening', price: 35, type: 'SERVICE', category: 'Evening Session', stock: 999999 },

    { name: 'PC Gamer - 1 Hour', price: 20, type: 'SERVICE', category: 'PC Gamer', stock: 999999 }
]

async function main() {
    console.log('Clearing existing products...')
    // Note: this might fail if there are existing OrderItems linked to these products.
    // If so, we might need to soft-delete or handle constraints. 
    // Since it's a completely new brand setup, let's try to delete them.
    try {
        await prisma.product.deleteMany()
        console.log('Existing products cleared.')
    } catch (e) {
        console.warn('Could not delete all products (possibly due to constraints). We will just add the new ones.')
    }

    console.log('Seeding GLISSA products...')
    let count = 0
    for (const product of products) {
        await prisma.product.create({
            data: product
        })
        count++
    }

    console.log(`Successfully seeded ${count} GLISSA products!`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
