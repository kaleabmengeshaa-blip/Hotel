import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import MenuClient from './MenuClient';

export const dynamic = 'force-dynamic';

export default async function GuestMenu({
  params,
}: {
  params: Promise<{ hotelSlug: string }>;
}) {
  const { hotelSlug } = await params;

  const hotel = await prisma.hotel.findUnique({
    where: { slug: hotelSlug },
    include: {
      categories: {
        orderBy: { displayOrder: 'asc' },
        include: { items: { orderBy: { displayOrder: 'asc' } } },
      },
    },
  });

  if (!hotel) return notFound();

  // Convert database values into plain data the browser part can use
  const data = {
    id: hotel.id,
    name: hotel.name,
    logoUrl: hotel.logoUrl,
    themeColor: hotel.themeColor,
    // Dishes the owner pulled out are NOT sent to guests at all
    categories: hotel.categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        items: c.items
          .filter((i) => i.isAvailable)
          .map((i) => ({
            id: i.id,
            name: i.name,
            description: i.description,
            price: Number(i.price),
            priceUsd: i.priceUsd === null ? null : Number(i.priceUsd),
            imageUrl: i.imageUrl,
            isAvailable: i.isAvailable,
            dietaryTags: i.dietaryTags,
          })),
      }))
      .filter((c) => c.items.length > 0),
  };

  return <MenuClient hotel={data} />;
}
