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
        navy: {
          950: '#070d1e',
          900: '#0b142a',
          850: '#0f172a',
          800: '#172554',
          750: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        brand: {
          blue: '#2563eb',
          blueHover: '#1d4ed8',
          cyan: '#06b6d4',
          purple: '#c084fc',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(37, 99, 235, 0.45)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.45)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-in-out',
        'pulse-dot': 'pulseGlowDot 1.8s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.15)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlowDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1', boxShadow: '0 0 10px #f97316' },
          '50%': { transform: 'scale(1.35)', opacity: '0.8', boxShadow: '0 0 18px #ea580c' },
        },
      }
    },
  },
  plugins: [],
};
