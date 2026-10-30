'use server';

import { DEFAULT_HOTEL_SLUG, prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';

// This function runs securely on the server
export async function toggleAvailability(itemId: string): Promise<boolean> {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Please sign in as an administrator.');
  }

  const item = await prisma.menuItem.findFirst({
    where: {
      id: itemId,
      category: { hotel: { slug: DEFAULT_HOTEL_SLUG } },
    },
    select: { isAvailable: true },
  });
  if (!item) {
    throw new Error('Menu item not found.');
  }

  const isAvailable = !item.isAvailable;

  await prisma.menuItem.update({
    where: { id: itemId },
    data: { isAvailable },
  });

  revalidatePath('/admin');
  revalidatePath('/m/[hotelSlug]', 'page');
  return isAvailable;
}