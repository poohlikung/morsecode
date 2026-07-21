"use client";

import React, { useEffect, useState } from 'react';
import { Space_Mono } from 'next/font/google';

const spmono = Space_Mono({
  subsets: ['latin'],
  weight: ["400", "700"],
});

const STORAGE_KEY = 'cookieConsent';

function CookieConsent() {
  // `null` = undecided/not yet checked, false = hidden, true = visible
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Only show if the user hasn't made a choice yet.
    try {
      const choice = localStorage.getItem(STORAGE_KEY);
      if (!choice) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (e.g. privacy mode) — show anyway.
      setVisible(true);
    }
  }, []);

  const dismiss = (choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore storage errors */
    }
    // Play the exit animation before unmounting.
    setLeaving(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className={`fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] sm:w-[340px] ${leaving ? 'animate-cookieOut' : 'animate-cookieIn'}`}
    >
      <div
        className="rounded-xl p-4 backdrop-blur-sm transition-colors duration-300"
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--card-foreground)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <p
          className={`${spmono.className} text-[12.5px] leading-relaxed`}
          style={{ opacity: 0.75 }}
        >
          We use cookies to keep you signed in and remember your preferences.
        </p>

        <div className="flex items-center justify-end gap-4 mt-3">
          <button
            type="button"
            onClick={() => dismiss('declined')}
            className={`${spmono.className} text-[12.5px] transition-opacity duration-200 hover:opacity-100 active:opacity-70 cursor-pointer`}
            style={{ color: 'var(--card-foreground)', opacity: 0.55 }}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => dismiss('accepted')}
            className={`${spmono.className} font-bold text-[12.5px] px-4 h-9 rounded-lg transition-all duration-200 hover:opacity-90 active:scale-[0.98] cursor-pointer`}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
