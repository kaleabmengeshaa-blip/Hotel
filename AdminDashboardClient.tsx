'use client';

import { useState, useTransition } from 'react';
import { useBrowserOrigin } from './src/lib/use-browser-origin';
import {
  addItem,
  updateItem,
  toggleAvailability,
  deleteItem,
  addCategory,
  renameCategory,
  updateHotel,
  deleteFeedback,
  type Result,
} from './actions';

type AdminItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  dietaryTags: string[];
};

type AdminCategory = { id: string; name: string; items: AdminItem[] };

type AdminFeedback = { id: string; name: string | null; message: string; createdAt: string };

type AdminHotel = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  themeColor: string;
  categories: AdminCategory[];
  feedbacks: AdminFeedback[];
};

type ItemFormValues = {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  tags: string;
};

const inputCls =
  'w-full rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white placeholder-stone-500 focus:border-amber-500 focus:outline-none';
const btnPrimary =
  'rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 hover:bg-amber-400 disabled:opacity-50';
const btnGhost =
  'rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-stone-200 hover:bg-white/10 disabled:opacity-50';

function ItemForm({
  categories,
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  categories: { id: string; name: string }[];
  initial: ItemFormValues;
  submitLabel: string;
  busy: boolean;
  onSubmit: (v: ItemFormValues) => void;
  onCancel?: () => void;
}) {
  const [v, setV] = useState<ItemFormValues>(initial);
  const set = (k: keyof ItemFormValues, val: string) => setV((p) => ({ ...p, [k]: val }));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold text-stone-300">
        Dish name
        <input
          className={`${inputCls} mt-1`}
          value={v.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Example: Macchiato"
        />
      </label>

      <label className="text-xs font-semibold text-stone-300">
        Price (ETB)
        <input
          className={`${inputCls} mt-1`}
          value={v.price}
          inputMode="decimal"
          onChange={(e) => set('price', e.target.value)}
          placeholder="Example: 55"
        />
      </label>

      <label className="text-xs font-semibold text-stone-300">
        Category
        <select
          className={`${inputCls} mt-1`}
          value={v.categoryId}
          onChange={(e) => set('categoryId', e.target.value)}
        >
          <option value="">Choose a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs font-semibold text-stone-300">
        Tags (separate with commas)
        <input
          className={`${inputCls} mt-1`}
          value={v.tags}
          onChange={(e) => set('tags', e.target.value)}
          placeholder="vegan, spicy"
        />
      </label>

      <label className="text-xs font-semibold text-stone-300 sm:col-span-2">
        Description
        <textarea
          className={`${inputCls} mt-1 min-h-[72px]`}
          value={v.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="A short description of the dish"
        />
      </label>

      <label className="text-xs font-semibold text-stone-300 sm:col-span-2">
        Photo link (photo upload comes in the next step)
        <input
          className={`${inputCls} mt-1`}
          value={v.imageUrl}
          onChange={(e) => set('imageUrl', e.target.value)}
          placeholder="https://... or /images/macchiato.jpg"
        />
      </label>

      <div className="flex gap-2 sm:col-span-2">
        <button className={btnPrimary} disabled={busy} onClick={() => onSubmit(v)}>
          {busy ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button className={btnGhost} disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardClient({ hotel }: { hotel: AdminHotel }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const origin = useBrowserOrigin();
  const [showQr, setShowQr] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addKey, setAddKey] = useState(0);
  const [newCategory, setNewCategory] = useState('');
  const [settings, setSettings] = useState({
    name: hotel.name,
    slug: hotel.slug,
    logoUrl: hotel.logoUrl ?? '',
    themeColor: /^#[0-9a-f]{6}$/i.test(hotel.themeColor) ? hotel.themeColor : '#d97706',
  });

  // Run a server action, show its message, and run onOk if it worked
  function run(fn: () => Promise<Result>, onOk?: () => void) {
    startTransition(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok && onOk) onOk();
    });
  }

  const categoryList = hotel.categories.map((c) => ({ id: c.id, name: c.name }));
  const totalItems = hotel.categories.reduce((n, c) => n + c.items.length, 0);
  const menuPath = `/m/${hotel.slug}`;
  const menuUrl = `${origin}${menuPath}`;

  return (
    <main className="min-h-screen bg-[#0d0f12] pb-20 text-stone-100">
      <header className="border-b border-white/10 bg-stone-950 px-4 py-5">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Admin panel
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-white">
              {hotel.name}
            </h1>
            <p className="text-xs text-stone-400">
              {totalItems} dishes in {hotel.categories.length} categories, {hotel.feedbacks.length} comments
            </p>
          </div>
          <div className="flex gap-2">
            <a className={btnGhost} href={menuPath} target="_blank" rel="noreferrer">
              View customer menu
            </a>
            <button className={btnGhost} onClick={() => setShowQr((s) => !s)}>
              QR code
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-8 px-4 pt-6">
        {msg && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm ${
              msg.ok
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/40 bg-red-500/10 text-red-300'
            }`}
          >
            {msg.text}
          </div>
        )}

        {showQr && (
          <section className="rounded-2xl border border-white/10 bg-stone-950 p-5">
            <h2 className="text-lg font-bold text-white">Menu QR code</h2>
            <p className="mt-1 break-all text-sm text-stone-400">{menuUrl}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="mt-4 h-48 w-48 rounded-xl bg-white p-2"
              alt="QR code for the menu"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                menuUrl
              )}`}
            />
            <p className="mt-3 text-xs text-stone-500">
              A QR code made from a localhost address only works on your own computer. After the
              website is online, open this page there to get the real QR code.
            </p>
          </section>
        )}

        {/* Add a dish */}
        <section className="rounded-2xl border border-white/10 bg-stone-950 p-5">
          <h2 className="mb-4 text-lg font-bold text-white">Add a new dish</h2>
          {categoryList.length === 0 ? (
            <p className="text-sm text-stone-400">Add a category first (see below).</p>
          ) : (
            <ItemForm
              key={addKey}
              categories={categoryList}
              initial={{
                categoryId: categoryList[0].id,
                name: '',
                description: '',
                price: '',
                imageUrl: '',
                tags: '',
              }}
              submitLabel="Add dish"
              busy={pending}
              onSubmit={(v) =>
                run(
                  () => addItem(v),
                  () => setAddKey((k) => k + 1)
                )
              }
            />
          )}
        </section>

        {/* Dish list */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-white">Your menu</h2>
          {hotel.categories.map((cat) => (
            <div key={cat.id} className="rounded-2xl border border-white/10 bg-stone-950">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                <h3 className="font-semibold text-amber-300">{cat.name}</h3>
                <button
                  className="text-xs font-semibold text-stone-400 hover:text-white"
                  onClick={() => {
                    const name = window.prompt('New category name', cat.name);
                    if (name !== null) run(() => renameCategory(cat.id, name));
                  }}
                >
                  Rename
                </button>
              </div>

              {cat.items.length === 0 && (
                <p className="px-5 py-4 text-sm text-stone-500">No dishes in this category yet.</p>
              )}

              {cat.items.map((item) => (
                <div key={item.id} className="border-b border-white/5 px-5 py-4 last:border-0">
                  {editingId === item.id ? (
                    <ItemForm
                      categories={categoryList}
                      initial={{
                        categoryId: item.categoryId,
                        name: item.name,
                        description: item.description,
                        price: String(item.price),
                        imageUrl: item.imageUrl ?? '',
                        tags: item.dietaryTags.join(', '),
                      }}
                      submitLabel="Save changes"
                      busy={pending}
                      onSubmit={(v) => run(() => updateItem(item.id, v), () => setEditingId(null))}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className={item.isAvailable ? '' : 'opacity-60'}>
                        <p className="font-semibold text-white">{item.name}</p>
                        <p className="text-sm text-amber-300">ETB {item.price}</p>
                        {!item.isAvailable && (
                          <p className="text-xs font-bold uppercase text-red-400">
                            Hidden from guests
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={btnGhost}
                          disabled={pending}
                          onClick={() => run(() => toggleAvailability(item.id))}
                        >
                          {item.isAvailable ? 'Pull out of menu' : 'Put back on menu'}
                        </button>
                        <button className={btnGhost} onClick={() => setEditingId(item.id)}>
                          Edit
                        </button>
                        <button
                          className="rounded-xl border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          disabled={pending}
                          onClick={() => {
                            if (window.confirm(`Delete "${item.name}"? This cannot be undone.`))
                              run(() => deleteItem(item.id));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </section>

        {/* Add a category */}
        <section className="rounded-2xl border border-white/10 bg-stone-950 p-5">
          <h2 className="mb-3 text-lg font-bold text-white">Add a category</h2>
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Example: Hot Drinks"
            />
            <button
              className={btnPrimary}
              disabled={pending}
              onClick={() => run(() => addCategory(hotel.id, newCategory), () => setNewCategory(''))}
            >
              Add
            </button>
          </div>
        </section>

        {/* Guest comments */}
        <section className="rounded-2xl border border-white/10 bg-stone-950 p-5">
          <h2 className="mb-4 text-lg font-bold text-white">
            Guest comments ({hotel.feedbacks.length})
          </h2>
          {hotel.feedbacks.length === 0 ? (
            <p className="text-sm text-stone-500">No comments yet.</p>
          ) : (
            <div className="space-y-3">
              {hotel.feedbacks.map((f) => (
                <div
                  key={f.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-stone-900 p-4"
                >
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap break-words text-sm text-stone-100">
                      {f.message}
                    </p>
                    <p className="mt-2 text-xs text-stone-500">
                      {f.name ? f.name : 'Guest'} • {new Date(f.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    className="shrink-0 text-xs font-semibold text-red-300 hover:text-red-200 disabled:opacity-50"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm('Delete this comment?')) run(() => deleteFeedback(f.id));
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Restaurant settings */}
        <section className="rounded-2xl border border-white/10 bg-stone-950 p-5">
          <h2 className="mb-4 text-lg font-bold text-white">Restaurant settings</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-stone-300">
              Restaurant name
              <input
                className={`${inputCls} mt-1`}
                value={settings.name}
                onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold text-stone-300">
              Web address name (used in /m/...)
              <input
                className={`${inputCls} mt-1`}
                value={settings.slug}
                onChange={(e) => setSettings((s) => ({ ...s, slug: e.target.value }))}
              />
              {settings.slug.trim() !== hotel.slug && (
                <span className="mt-1 block text-xs font-normal text-amber-300">
                  Warning: if you change this, the QR codes you already printed will stop working.
                </span>
              )}
            </label>
            <label className="text-xs font-semibold text-stone-300">
              Logo link (optional)
              <input
                className={`${inputCls} mt-1`}
                value={settings.logoUrl}
                onChange={(e) => setSettings((s) => ({ ...s, logoUrl: e.target.value }))}
                placeholder="https://..."
              />
            </label>
            <label className="text-xs font-semibold text-stone-300">
              Menu color
              <input
                type="color"
                className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-white/15 bg-stone-900"
                value={settings.themeColor}
                onChange={(e) => setSettings((s) => ({ ...s, themeColor: e.target.value }))}
              />
            </label>
            <div className="sm:col-span-2">
              <button
                className={btnPrimary}
                disabled={pending}
                onClick={() => {
                  if (
                    settings.slug.trim() !== hotel.slug &&
                    !window.confirm(
                      'Changing the web address name will break printed QR codes. Save anyway?'
                    )
                  )
                    return;
                  run(() => updateHotel(hotel.id, settings));
                }}
              >
                {pending ? 'Saving...' : 'Save settings'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
