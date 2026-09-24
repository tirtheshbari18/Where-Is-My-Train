/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rail: {
          navy: '#0B192C',
          deep: '#07101E',
          card: '#1E3E62',
          surface: '#152C46',
          amber: '#F59E0B',
          gold: '#EAB308',
          track: '#334155',
          green: '#10B981',
          red: '#EF4444',
          accent: '#2563EB',
          border: '#1E293B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'train-run': 'trainRun 2s ease-in-out infinite',
      },
      keyframes: {
        trainRun: {
          '0%, 100%': { transform: 'translateX(0px)' },
          '50%': { transform: 'translateX(6px)' },
        }
      }
    },
  },
  plugins: [],
};
