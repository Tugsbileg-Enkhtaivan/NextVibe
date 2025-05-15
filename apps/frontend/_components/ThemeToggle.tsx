'use client';

import { useEffect, useState } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      root.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const dark = !root.classList.contains('dark');

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        root.classList.toggle('dark');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        setIsDark(dark);
      });
    } else {
      root.classList.toggle('dark');
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      setIsDark(dark);
    }
  };

  return (
    <>
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white font-semibold py-2 px-5 rounded-lg transition"
      >
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </button>
      {children}
    </>
  );
}
