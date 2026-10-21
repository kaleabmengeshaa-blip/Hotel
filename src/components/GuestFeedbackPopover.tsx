'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { submitFeedback } from '../../actions';

export default function GuestFeedbackPopover({ hotelId }: { hotelId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    startTransition(async () => {
      try {
        const result = await submitFeedback(hotelId, name, message);
        setStatus(result);
        if (result.ok) {
          setName('');
          setMessage('');
        }
      } catch {
        setStatus({ ok: false, message: 'Could not send your comment. Please try again.' });
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
        Comment
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
            className="w-full max-w-md rounded-2xl border border-white/10 bg-stone-950 p-5 text-stone-100 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="guest-feedback-title" className="text-lg font-bold text-white">
                  Send a comment
                </h2>
                <p className="mt-1 text-sm text-stone-400">Your message goes to the restaurant.</p>
              </div>
              <button
                type="button"
                aria-label="Close comments"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-stone-300">
                Name <span className="font-normal text-stone-500">(optional)</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={60}
                  autoComplete="name"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-stone-900 px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-sm font-medium text-stone-300">
                Comment
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
                  disabled={pending || message.trim().length < 3}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pending ? 'Sending...' : 'Send comment'}
                </button>
                {status && (
                  <p role="status" className={`text-sm ${status.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {status.message}
                  </p>
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
