'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export type Result = { ok: boolean; message: string };

export type ItemInput = {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  tags: string;
};

async function requireAdmin(): Promise<Result | null> {
  return (await isAdminAuthenticated())
    ? null
    : { ok: false, message: 'Please sign in as an administrator.' };
}

function refresh() {
  revalidatePath('/admin');
  revalidatePath('/m/[hotelSlug]', 'page');
}

function parseTags(s: string): string[] {
  return s
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function parsePrice(v: string): number | null {
  const n = Number(String(v).replace(',', '.').trim());
  return Number.isFinite(n) && n >= 0 && n < 100000000 ? n : null;
}

function cleanImage(v: string): string | null | undefined {
  const s = v.trim();
  if (!s) return null;
  // allow web links and files kept in the public folder
  if (/^https?:\/\//i.test(s) || s.startsWith('/')) return s;
  return undefined; // invalid
}

function checkItem(input: ItemInput) {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Please enter the dish name.' } as const;
  const price = parsePrice(input.price);
  if (price === null)
    return { ok: false, error: 'Please enter a valid price (numbers only).' } as const;
  if (!input.categoryId) return { ok: false, error: 'Please choose a category.' } as const;
  const imageUrl = cleanImage(input.imageUrl);
  if (imageUrl === undefined)
    return { ok: false, error: 'The photo link must start with http:// or https://' } as const;
  return {
    ok: true,
    data: {
      name,
      description: input.description.trim(),
      price,
      imageUrl,
      dietaryTags: parseTags(input.tags),
    },
  } as const;
}

export async function addItem(input: ItemInput): Promise<Result> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const checked = checkItem(input);
    if (!checked.ok) return { ok: false, message: checked.error };

    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) return { ok: false, message: 'That category was not found.' };

    const last = await prisma.menuItem.findFirst({
      where: { categoryId: input.categoryId },
      orderBy: { displayOrder: 'desc' },
    });

    await prisma.menuItem.create({
      data: {
        ...checked.data,
        categoryId: input.categoryId,
        displayOrder: (last?.displayOrder ?? 0) + 1,
      },
    });
    refresh();
    return { ok: true, message: `"${checked.data.name}" was added to the menu.` };
  } catch {
    return { ok: false, message: 'Something went wrong while saving. Please try again.' };
  }
}

export async function updateItem(itemId: string, input: ItemInput): Promise<Result> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const checked = checkItem(input);
    if (!checked.ok) return { ok: false, message: checked.error };

    await prisma.menuItem.update({
      where: { id: itemId },
      data: { ...checked.data, categoryId: input.categoryId },
    });
    refresh();
    return { ok: true, message: `"${checked.data.name}" was updated.` };
  } catch {
    return { ok: false, message: 'Something went wrong while saving. Please try again.' };
  }
}

export async function toggleAvailability(itemId: string, currentStatus: boolean): Promise<Result> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: !currentStatus },
    });
    refresh();
    return { ok: true, message: currentStatus ? 'Marked as sold out.' : 'Back on the menu.' };
  } catch {
    return { ok: false, message: 'Could not change this dish. Please try again.' };
  }
}

export async function deleteItem(itemId: string): Promise<Result> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.menuItem.delete({ where: { id: itemId } });
    refresh();
    return { ok: true, message: 'The dish was deleted.' };
  } catch {
    return { ok: false, message: 'Could not delete this dish. Please try again.' };
  }
}

export async function addCategory(hotelId: string, name: string): Promise<Result> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const clean = name.trim();
    if (!clean) return { ok: false, message: 'Please enter the category name.' };

    const last = await prisma.category.findFirst({
      where: { hotelId },
      orderBy: { displayOrder: 'desc' },
    });
    await prisma.category.create({
      data: { hotelId, name: clean, displayOrder: (last?.displayOrder ?? 0) + 1 },
    });
    refresh();
    return { ok: true, message: `Category "${clean}" was added.` };
  } catch {
    return { ok: false, message: 'Could not add the category. Please try again.' };
  }
}

export async function renameCategory(categoryId: string, name: string): Promise<Result> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const clean = name.trim();
    if (!clean) return { ok: false, message: 'Please enter the category name.' };
    await prisma.category.update({ where: { id: categoryId }, data: { name: clean } });
    refresh();
    return { ok: true, message: 'Category renamed.' };
  } catch {
    return { ok: false, message: 'Could not rename the category. Please try again.' };
  }
}

export async function updateHotel(
  hotelId: string,
  input: { name: string; slug: string; logoUrl: string; themeColor: string }
): Promise<Result> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const name = input.name.trim();
    if (!name) return { ok: false, message: 'Please enter the restaurant name.' };

    const slug = input.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) return { ok: false, message: 'Please enter a web address name (letters and numbers).' };

    const taken = await prisma.hotel.findUnique({ where: { slug } });
    if (taken && taken.id !== hotelId)
      return { ok: false, message: 'That web address name is already used. Choose another.' };

    if (!/^#[0-9a-fA-F]{6}$/.test(input.themeColor))
      return { ok: false, message: 'Please choose a valid color.' };

    const logoUrl = cleanImage(input.logoUrl);
    if (logoUrl === undefined)
      return { ok: false, message: 'The logo link must start with http:// or https://' };

    await prisma.hotel.update({
      where: { id: hotelId },
      data: { name, slug, themeColor: input.themeColor, logoUrl },
    });
    refresh();
    return { ok: true, message: `Saved. The menu address is /m/${slug}` };
  } catch {
    return { ok: false, message: 'Something went wrong while saving. Please try again.' };
  }
}

// Guests send a comment to the restaurant (no login needed)
export async function submitFeedback(
  hotelId: string,
  name: string,
  message: string
): Promise<Result> {
  try {
    const text = message.trim();
    if (text.length < 3) return { ok: false, message: 'Please write your comment first.' };
    if (text.length > 1000)
      return { ok: false, message: 'Your comment is too long (maximum 1000 characters).' };

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) return { ok: false, message: 'Restaurant not found.' };

    await prisma.feedback.create({
      data: { hotelId, name: name.trim().slice(0, 60) || null, message: text },
    });
    revalidatePath('/admin');
    revalidatePath('/m/[hotelSlug]', 'page');
    return { ok: true, message: 'Thank you! Your comment was sent to the restaurant.' };
  } catch {
    return { ok: false, message: 'Could not send your comment. Please try again.' };
  }
}

export async function deleteFeedback(feedbackId: string): Promise<Result> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await prisma.feedback.delete({ where: { id: feedbackId } });
    revalidatePath('/admin');
    return { ok: true, message: 'The comment was deleted.' };
  } catch {
    return { ok: false, message: 'Could not delete the comment. Please try again.' };
  }
}