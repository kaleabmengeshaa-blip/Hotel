'use client';

import { useMemo, useState, useTransition } from 'react';
import { Coffee, Search } from 'lucide-react';
import { submitFeedback } from './actions';

type GuestItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  dietaryTags: string[];
};

type GuestCategory = {
  id: string;
  name: string;
  items: GuestItem[];
};

type GuestHotel = {
  id: string;
  name: string;
  logoUrl: string | null;
  themeColor: string;
  categories: GuestCategory[];
};

// Pick black or white text so it is readable on the restaurant's color
function readableOn(hex: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#0d0f12';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0d0f12' : '#ffffff';
}

function formatPrice(p: number) {
  return Number.isInteger(p) ? String(p) : p.toFixed(2);
}

export default function MenuClient({ hotel }: { hotel: GuestHotel }) {
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');
  const [cName, setCName] = useState('');
  const [cText, setCText] = useState('');
  const [cMsg, setCMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, startSend] = useTransition();

  function sendComment() {
    startSend(async () => {
      const r = await submitFeedback(hotel.id, cName, cText);
      setCMsg({ ok: r.ok, text: r.message });
      if (r.ok) {
        setCText('');
        setCName('');
      }
    });
  }

  // The restaurant's own color (set in the database), with a safe fallback
  const accent = /^#[0-9a-f]{6}$/i.test(hotel.themeColor) ? hotel.themeColor : '#d97706';
  const onAccent = readableOn(accent);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hotel.categories
      .filter((c) => activeCat === 'all' || c.id === activeCat)
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) =>
            !q ||
            i.name.toLowerCase().includes(q) ||
            i.description.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [hotel.categories, activeCat, query]);

  return (
    <main className="min-h-screen bg-[#0d0f12] pb-16 text-stone-100">
      {/* Centered header: name + MENU */}
      <header className="border-b border-white/10 bg-gradient-to-b from-stone-950 to-[#0d0f12] px-4 py-8 text-center sm:py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3">
          {hotel.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hotel.logoUrl}
              alt={`${hotel.name} logo`}
              className="h-14 w-14 rounded-2xl object-cover"
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border"
              style={{ borderColor: accent, color: accent }}
            >
              <Coffee className="h-6 w-6" />
            </div>
          )}
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold tracking-tight text-white sm:text-5xl">
            {hotel.name}
          </h1>
          <div className="flex items-center gap-3">
            <span className="h-px w-10" style={{ background: accent }} />
            <span
              className="text-sm font-bold uppercase tracking-[0.3em]"
              style={{ color: accent }}
            >
              Menu
            </span>
            <span className="h-px w-10" style={{ background: accent }} />
          </div>
        </div>
      </header>

      {/* Search + category buttons stay at the top while scrolling */}
      <section className="sticky top-0 z-20 border-b border-white/10 bg-[#0d0f12]/95 py-4 backdrop-blur-md">
        <div className="mx-auto max-w-2xl space-y-3 px-4">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the menu..."
              aria-label="Search the menu"
              className="w-full rounded-2xl border border-white/15 bg-stone-900/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-stone-400 focus:outline-none"
              style={{ caretColor: accent }}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {[{ id: 'all', name: 'All Items' }, ...hotel.categories].map((c) => {
              const active = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className="shrink-0 rounded-2xl border px-4 py-2 text-xs font-bold transition"
                  style={
                    active
                      ? { background: accent, borderColor: accent, color: onAccent }
                      : { borderColor: 'rgba(255,255,255,0.1)', color: '#d6d3d1' }
                  }
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Menu list */}
      <div className="mx-auto max-w-2xl px-4">
        {visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-stone-400">
            No dishes match your search. Try a different word or choose All Items.
          </p>
        ) : (
          visible.map((category) => (
            <section key={category.id} className="pt-8">
              <h2
                className="font-[family-name:var(--font-playfair)] text-2xl font-bold"
                style={{ color: accent }}
              >
                {category.name}
              </h2>

              {category.items.map((item) => {
                const soldOut = !item.isAvailable;
                return (
                  <article
                    key={item.id}
                    className={`flex gap-4 border-b border-white/10 py-5 ${
                      soldOut ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-stone-900">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-600">
                          <Coffee className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-base font-semibold text-white">{item.name}</h3>
                        {soldOut ? (
                          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-red-400">
                            Sold out
                          </span>
                        ) : (
                          <span
                            className="whitespace-nowrap font-semibold"
                            style={{ color: accent }}
                          >
                            ETB {formatPrice(item.price)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-stone-400">
                        {item.description}
                      </p>
                      {item.dietaryTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.dietaryTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md border border-white/10 bg-stone-900 px-2 py-0.5 text-[10px] uppercase tracking-wider text-stone-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          ))
        )}

        {/* Comment for the restaurant */}
        <section className="mt-12 rounded-2xl border border-white/10 bg-stone-950 p-5">
          <h2
            className="font-[family-name:var(--font-playfair)] text-xl font-bold"
            style={{ color: accent }}
          >
            Leave a comment
          </h2>
          <p className="mt-1 text-sm text-stone-400">
            Tell the restaurant what you think. Your comment goes to the owner.
          </p>
          <input
            value={cName}
            onChange={(e) => setCName(e.target.value)}
            maxLength={60}
            placeholder="Your name (optional)"
            aria-label="Your name (optional)"
            className="mt-4 w-full rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none"
          />
          <textarea
            value={cText}
            onChange={(e) => setCText(e.target.value)}
            maxLength={1000}
            placeholder="Write your comment here..."
            aria-label="Your comment"
            className="mt-3 min-h-[96px] w-full rounded-xl border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none"
          />
          <button
            onClick={sendComment}
            disabled={sending}
            className="mt-3 rounded-xl px-5 py-2 text-sm font-bold disabled:opacity-50"
            style={{ background: accent, color: onAccent }}
          >
            {sending ? 'Sending...' : 'Send comment'}
          </button>
          {cMsg && (
            <p
              role="status"
              className={`mt-3 text-sm ${cMsg.ok ? 'text-emerald-300' : 'text-red-300'}`}
            >
              {cMsg.text}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
