'use client';

import Link from 'next/link';

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <img
        src="/devi-logo.png"
        alt="Eternal Soul Logo"
        className="w-40 h-40 mb-6"
      />
      <h1 className="text-3xl font-bold tracking-wide mb-4">🌕 Welcome to Eternal Soul</h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        Discover your soul’s blueprint, receive daily symbolic insights, and reconnect with your inner compass.
      </p>

      <Link href="/login">
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded shadow-lg">
          Begin Your Journey
        </button>
      </Link>
    </main>
  );
}
