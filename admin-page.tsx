import { prisma } from '@/lib/prisma';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const hotel = await prisma.hotel.findFirst({
    orderBy: { createdAt: 'asc' },
    include: {
      categories: {
        orderBy: { displayOrder: 'asc' },
        include: { items: { orderBy: { displayOrder: 'asc' } } },
      },
      feedbacks: { orderBy: { createdAt: 'desc' }, take: 100 },
    },
  });

  if (!hotel) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0f12] p-6 text-center text-stone-300">
        <p>
          No restaurant was found in the database. Run <code>npx prisma db seed</code> in the
          terminal, then refresh this page.
        </p>
      </main>
    );
  }

  const data = {
    id: hotel.id,
    name: hotel.name,
    slug: hotel.slug,
    logoUrl: hotel.logoUrl,
    themeColor: hotel.themeColor,
    categories: hotel.categories.map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items.map((i) => ({
        id: i.id,
        categoryId: i.categoryId,
        name: i.name,
        description: i.description,
        price: Number(i.price),
        imageUrl: i.imageUrl,
        isAvailable: i.isAvailable,
        dietaryTags: i.dietaryTags,
      })),
    })),
    feedbacks: hotel.feedbacks.map((f) => ({
      id: f.id,
      name: f.name,
      message: f.message,
      createdAt: f.createdAt.toISOString(),
    })),
  };

  return <AdminDashboardClient hotel={data} />;
}
