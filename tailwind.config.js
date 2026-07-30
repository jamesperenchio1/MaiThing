/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        border: 'var(--border)',
        muted: 'var(--muted)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--info)',
        success: 'var(--success)',
      },
      fontFamily: {
        sans: ['Inter', 'NotoSansThai', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
