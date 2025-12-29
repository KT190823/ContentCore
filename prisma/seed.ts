
import { PrismaClient, BillingCycle, PricingHistoryStatus } from '../generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // 1. Upsert Pricing Plans
    const plans = [
        {
            name: 'free',
            billingCycle: BillingCycle.MONTHLY,
            price: 0,
            credit: 200,
            capacity: 20, // 20 MB
            features: ['Basic Features', '200 Credits', '20MB Storage'],
            description: 'Free starter plan',
        },
        {
            name: 'pro',
            billingCycle: BillingCycle.MONTHLY,
            price: 200000,
            credit: 2000,
            capacity: 1000, // 1 GB
            features: ['Pro Features', '2000 Credits', '1GB Storage'],
            description: 'Professional plan',
        },
        {
            name: 'ultra',
            billingCycle: BillingCycle.MONTHLY,
            price: 500000,
            credit: 10000,
            capacity: 5000, // 5 GB
            features: ['Ultra Features', '10000 Credits', '5GB Storage'],
            description: 'Ultra plan',
        },
        {
            name: 'pro_year',
            billingCycle: BillingCycle.YEARLY,
            price: 1920000, // 200,000 * 12 * 0.8
            credit: 2000,
            capacity: 1000,
            features: ['Pro Features (Yearly)', '2000 Credits', '1GB Storage', '20% Discount'],
            description: 'Professional yearly plan',
        },
        {
            name: 'ultra_year',
            billingCycle: BillingCycle.YEARLY,
            price: 4800000, // 500,000 * 12 * 0.8
            credit: 10000,
            capacity: 5000,
            features: ['Ultra Features (Yearly)', '10000 Credits', '5GB Storage', '20% Discount'],
            description: 'Ultra yearly plan',
        },
    ];

    for (const plan of plans) {
        await prisma.pricingPlan.upsert({
            where: {
                name_billingCycle: {
                    name: plan.name,
                    billingCycle: plan.billingCycle,
                },
            },
            update: plan,
            create: plan,
        });
        console.log(`Upserted plan: ${plan.name} (${plan.billingCycle})`);
    }

    // 2. Find Specific User
    const targetEmail = 'trankhai091@gmail.com';
    const user = await prisma.user.findUnique({
        where: { email: targetEmail }
    });

    if (user) {
        console.log(`Found user: ${user.email} (${user.id})`);

        // Find Ultra plan (monthly)
        const ultraPlan = await prisma.pricingPlan.findFirst({
            where: { name: 'ultra', billingCycle: BillingCycle.MONTHLY }
        });

        if (ultraPlan) {
            // Create Pricing History for the user
            await prisma.pricingPlanHistory.create({
                data: {
                    userId: user.id,
                    planId: ultraPlan.id,
                    price: ultraPlan.price,
                    currency: ultraPlan.currency,
                    status: PricingHistoryStatus.SUCCESS,
                    startDate: new Date(),
                    paymentMethod: 'SYSTEM_SEED',
                }
            });
            console.log(`Created ULTRA pricing history for user ${user.email}`);

            // Update user to be on ultra plan
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    pricingPlanId: ultraPlan.id,
                    credit: ultraPlan.credit,
                    capacity: ultraPlan.capacity,
                }
            });
            console.log(`Updated user ${user.email} to ULTRA plan`);
        } else {
            console.log('Ultra plan not found!');
        }

    } else {
        console.log(`User ${targetEmail} not found. Please log in first to create the user account.`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
