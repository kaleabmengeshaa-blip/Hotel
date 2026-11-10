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
  return isAvailable;
}

export type Result = { ok: boolean; message: string };

// Guests send a comment to the restaurant (no login needed)
export async function submitFeedback(
  hotelId: string,
  name: string,
  message: string,
  rating: number
): Promise<Result> {
  try {
    const text = message.trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return { ok: false, message: 'Please choose a star rating from 1 to 5.' };
    if (text.length < 3) return { ok: false, message: 'Please write your comment first.' };
    if (text.length > 1000)
      return { ok: false, message: 'Your comment is too long (maximum 1000 characters).' };

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) return { ok: false, message: 'Restaurant not found.' };

    await prisma.feedback.create({
      data: { hotelId, name: name.trim().slice(0, 60) || null, message: text, rating },
    });
    revalidatePath('/admin');
    return { ok: true, message: 'Thank you! Your feedback was sent to the restaurant.' };
  } catch {
    return { ok: false, message: 'Could not send your comment. Please try again.' };
  }
}

export async function deleteFeedback(feedbackId: string): Promise<Result> {
  if (!(await isAdminAuthenticated())) {
    return { ok: false, message: 'Please sign in as an administrator.' };
  }

  try {
    await prisma.feedback.delete({ where: { id: feedbackId } });
    revalidatePath('/admin');
    return { ok: true, message: 'The comment was deleted.' };
  } catch {
    return { ok: false, message: 'Could not delete the comment. Please try again.' };
  }
}
