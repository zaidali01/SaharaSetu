/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tomorro neo-botanical palette
        'forest-depths': '#122314',
        'moss-shadow': '#273f2b',
        'lichen-sage': '#7e8371',
        'pale-fern': '#b7bda5',
        'electric-sprout': '#68ef3f',
        'deep-verdant': '#26a200',
        'sprout-wash': '#e7f9dd',
        'mist-green': '#d9deca',
        'onyx-olive': '#30322a',
        'bone-white': '#f2f5eb',
        'soft-mist': '#dcdfe3',
        'cool-stone': '#d6d6d6',
        'carbon': '#222222',
        // Keep old slate palette for legacy modal components
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'nav': '28px',
        'pill': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0,0,0,0.05)',
        'card': '0 4px 6px -1px rgba(0,0,0,0.05)',
        'float': '0 8px 32px rgba(0,0,0,0.25)',
        'mockup': '0 24px 60px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.2)',
        'sprout': '0 0 20px rgba(104,239,63,0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
