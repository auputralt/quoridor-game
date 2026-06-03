/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'pawn-pulse': 'pawnPulse 2s ease-in-out infinite',
      },
      keyframes: {
        pawnPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.6))' },
          '50%': { filter: 'drop-shadow(0 0 2px rgba(245,158,11,0.2))' },
        },
      },
    },
  },
  plugins: [],
};
