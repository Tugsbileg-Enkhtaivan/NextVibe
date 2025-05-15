/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './app/**/*.{js,ts,jsx,tsx}',      // App directory (Next.js App Router)
      './pages/**/*.{js,ts,jsx,tsx}',    // (optional, if you're mixing in Pages Router)
      './components/**/*.{js,ts,jsx,tsx}',
      './_components/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class', // Important for theme toggling
    theme: {
      extend: {
        animation: {
          scale: 'scale 1s forwards',
        },
        keyframes: {
          scale: {
            to: {
              maskSize: '200vmax',
            },
          },
        },
        colors: {
          // Optional: custom colors for light/dark mode
          'primary': '#2563eb',
          'secondary': '#64748b',
          'background': '#f9fafb',
          'background-dark': '#111827',
        },
      },
    },
    plugins: [],
  };
  