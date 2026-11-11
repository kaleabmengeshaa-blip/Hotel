'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { MessageSquare, Search, Star, X } from 'lucide-react';
import { submitFeedback } from '../app/actions';
import {
  getMenuCopy,
  translateMenuCategory,
  translateMenuItem,
  type MenuLanguage,
} from '../lib/menu-i18n';

type FeedbackCategory = {
  id: string;
  name: string;
  items: { id: string; name: string }[];
};

export default function GuestFeedbackPopover({
  hotelId,
  categories,
  language,
}: {
  hotelId: string;
  categories: FeedbackCategory[];
  language: MenuLanguage;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const text = (key: Parameters<typeof getMenuCopy>[1]) => getMenuCopy(language, key);
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        item.name.toLowerCase().includes(itemSearch.trim().toLowerCase()) ||
        translateMenuItem(item.name, language).toLowerCase().includes(itemSearch.trim().toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    startTransition(async () => {
      try {
        const result = await submitFeedback(hotelId, name, message, rating, selectedItemIds);
        setStatus({
          ...result,
          message: result.ok ? text('feedbackSuccess') : result.message,
        });
        if (result.ok) {
          setName('');
          setMessage('');
          setRating(0);
          setSelectedItemIds([]);
        }
      } catch {
        setStatus({ ok: false, message: text('feedbackError') });
      }
    });
  }

  function handleRatingSubmit() {
    setStatus(null);

    startTransition(async () => {
      try {
        const result = await submitFeedback(hotelId, name, '', rating, selectedItemIds);
        setStatus({
          ...result,
          message: result.ok ? text('ratingSuccess') : result.message,
        });
        if (result.ok) {
          setName('');
          setRating(0);
          setSelectedItemIds([]);
        }
      } catch {
        setStatus({ ok: false, message: text('ratingError') });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStatus(null);
          setIsOpen(true);
        }}
        className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
      >
        <MessageSquare className="h-4 w-4" />
        {text('feedback')}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-feedback-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-stone-950 p-5 text-stone-100 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="guest-feedback-title" className="text-lg font-bold text-white">
                  {text('feedbackTitle')}
                </h2>
                <p className="mt-1 text-sm text-stone-400">
                  {text('feedbackDescription')}
                </p>
              </div>
              <button
                type="button"
                aria-label={text('close')}
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset>
                <legend className="text-sm font-medium text-stone-300">
                  {text('foodsHad')}
                </legend>
                <p className="mt-1 text-xs text-stone-500">
                  {text('feedbackInstructions')}
                </p>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                  <input
                    type="search"
                    value={itemSearch}
                    onChange={(event) => setItemSearch(event.target.value)}
                    placeholder={text('findFood')}
                    aria-label={text('searchFoods')}
                    className="w-full rounded-lg border border-white/10 bg-stone-900 px-9 py-2 text-sm text-white outline-none placeholder:text-stone-500 focus:border-amber-500"
                  />
                </div>
                <p className="mt-2 text-xs text-stone-400" aria-live="polite">
                  {selectedItemIds.length === 0
                    ? text('noItemsSelected')
                    : text('selectedItemCount')
                        .replace('{count}', String(selectedItemIds.length))
                        .replace('{plural}', selectedItemIds.length === 1 ? '' : 's')}
                  {selectedItemIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedItemIds([])}
                      className="ml-2 font-semibold text-amber-300 hover:text-amber-200"
                    >
                      {text('clear')}
                    </button>
                  )}
                </p>
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-stone-900/60">
                  {filteredCategories.length === 0 ? (
                    <p className="p-3 text-sm text-stone-500">{text('noMatchingFoods')}</p>
                  ) : (
                    filteredCategories.map((category) => {
                      const selectedInCategory = category.items.filter((item) =>
                        selectedItemIds.includes(item.id)
                      ).length;
                      return (
                        <details
                          key={category.id}
                          open={Boolean(itemSearch.trim()) || undefined}
                          className="group border-b border-white/5 last:border-0"
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-semibold text-amber-300 marker:hidden">
                            <span>{translateMenuCategory(category.name, language)}</span>
                            <span className="text-xs text-stone-500">
                              {selectedInCategory > 0
                                ? text('selectedCount').replace('{count}', String(selectedInCategory))
                                : text('itemCount').replace('{count}', String(category.items.length))}
                            </span>
                          </summary>
                          <div className="space-y-1 px-2 pb-2">
                        {category.items.map((item) => (
                          <label
                            key={item.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-stone-300 hover:bg-white/5"
                          >
                            <input
                              type="checkbox"
                              checked={selectedItemIds.includes(item.id)}
                              onChange={(event) =>
                                setSelectedItemIds((current) =>
                                  event.target.checked
                                    ? [...current, item.id]
                                    : current.filter((id) => id !== item.id)
                                )
                              }
                              className="h-4 w-4 accent-amber-500"
                            />
                            {translateMenuItem(item.name, language)}
                          </label>
                        ))}
                      </div>
                        </details>
                      );
                    })
                  )}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium text-stone-300">{text('yourRating')}</legend>
                <div className="mt-2 flex gap-1" role="group" aria-label={text('ratingStars')}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value} ★`}
                      aria-pressed={rating === value}
                      onClick={() => setRating(value)}
                      className="rounded-md p-1 text-amber-400 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                    >
                      <Star
                        className="h-7 w-7"
                        fill={value <= rating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRatingSubmit}
                    disabled={pending || rating === 0 || selectedItemIds.length === 0}
                    className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pending ? text('sending') : text('sendRating')}
                  </button>
                  {status && (
                    <p role="status" className={`text-sm ${status.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {status.message}
                    </p>
                  )}
                </div>
              </fieldset>
              <label className="block text-sm font-medium text-stone-300">
                {text('yourName')} <span className="font-normal text-stone-500">{text('optional')}</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={60}
                  autoComplete="name"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-sm font-medium text-stone-300">
                {text('yourFeedback')}
                <textarea
                  required
                  minLength={3}
                  maxLength={1000}
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="mt-1 w-full resize-y rounded-lg border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                />
                <span className="mt-1 block text-right text-xs text-stone-500">
                  {message.length}/1000
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={
                    pending ||
                    rating === 0 ||
                    selectedItemIds.length === 0 ||
                    message.trim().length < 3
                  }
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? text('sending') : text('sendFeedback')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
