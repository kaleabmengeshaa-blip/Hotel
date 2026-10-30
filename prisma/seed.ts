import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { DEFAULT_HOTEL_NAME, DEFAULT_HOTEL_SLUG } from '../src/lib/hotel-config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create a Hotel
  const hotel = await prisma.hotel.upsert({
    where: { slug: DEFAULT_HOTEL_SLUG },
    update: {},
    create: {
      name: DEFAULT_HOTEL_NAME,
      slug: DEFAULT_HOTEL_SLUG,
      logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80',
      themeColor: '#d97706', // Amber color
    },
  });

  console.log(`✅ Created Hotel: ${hotel.name}`);

  const categories = [
    {
      name: 'Starters',
      displayOrder: 1,
      items: [
        {
          name: 'Truffle Arancini',
          description: 'Crispy risotto balls infused with black truffle oil, served with a garlic aioli dipping sauce. Recipe includes Arborio rice, parmesan, and fresh truffle.',
          price: 12.50,
          prepTimeMins: 15,
          imageUrl: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=500&q=80',
          isAvailable: true,
          dietaryTags: ['Vegetarian'],
          displayOrder: 1,
        },
        {
          name: 'Spicy Tuna Tartare',
          description: 'Fresh yellowfin tuna diced and mixed with spicy mayo, sesame oil, and served on crispy wonton chips.',
          price: 16.00,
          prepTimeMins: 10,
          imageUrl: 'https://images.unsplash.com/photo-1546241072-48010ad2862c?w=500&q=80',
          isAvailable: true,
          dietaryTags: ['Spicy', 'Gluten-Free'],
          displayOrder: 2,
        },
      ],
    },
    {
      name: 'Main Courses',
      displayOrder: 2,
      items: [
        {
          name: 'Pan-Seared Salmon',
          description: 'Atlantic salmon fillet with a crispy skin, served over quinoa and roasted asparagus with a lemon butter dill sauce.',
          price: 28.00,
          prepTimeMins: 25,
          imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500&q=80',
          isAvailable: true,
          dietaryTags: ['Gluten-Free', 'High Protein'],
          displayOrder: 1,
        },
        {
          name: 'Wild Mushroom Risotto',
          description: 'Creamy Arborio rice cooked with a blend of wild mushrooms, white wine, and finished with aged parmesan and truffle oil.',
          price: 24.00,
          prepTimeMins: 30,
          imageUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=500&q=80',
          isAvailable: false,
          dietaryTags: ['Vegetarian', 'Gluten-Free'],
          displayOrder: 2,
        },
      ],
    },
    {
      name: 'Desserts',
      displayOrder: 3,
      items: [
        {
          name: 'Classic Tiramisu',
          description: 'Layers of espresso-soaked ladyfingers and rich mascarpone cream, dusted with premium cocoa powder.',
          price: 9.50,
          prepTimeMins: 5,
          imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500&q=80',
          isAvailable: true,
          dietaryTags: ['Vegetarian'],
          displayOrder: 1,
        },
      ],
    },
  ];

  for (const categorySeed of categories) {
    const category = await prisma.category.findFirst({
      where: { hotelId: hotel.id, name: categorySeed.name },
      select: { id: true },
    }) ?? await prisma.category.create({
      data: {
        hotelId: hotel.id,
        name: categorySeed.name,
        displayOrder: categorySeed.displayOrder,
      },
      select: { id: true },
    });

    for (const item of categorySeed.items) {
      const existingItem = await prisma.menuItem.findFirst({
        where: { categoryId: category.id, name: item.name },
        select: { id: true },
      });

      if (!existingItem) {
        await prisma.menuItem.create({
          data: { ...item, categoryId: category.id },
        });
      }
    }
  }

  console.log('✅ Sample categories and menu items are present.');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });