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
        trace: {
          bg: '#0B0F17',
          surface: '#0F172A',
          card: '#1E293B',
          cardHover: '#24334A',
          border: '#334155',
          borderLight: '#475569',
          accent: '#06B6D4',
          accentGlow: 'rgba(6, 182, 212, 0.25)',
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#38BDF8',
          ai: '#10B981',
          aiPurple: '#8B5CF6'
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"SF Pro"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'SFMono-Regular',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
        serif: [
          'Merriweather',
          'Georgia',
          '"Playfair Display"',
          'Cambria',
          '"Times New Roman"',
          'Times',
          'serif',
        ],
      },
      boxShadow: {
        'glow-red': '0 0 20px -2px rgba(239, 68, 68, 0.45)',
        'glow-cyan': '0 0 20px -2px rgba(6, 182, 212, 0.45)',
        'glow-emerald': '0 0 20px -2px rgba(16, 185, 129, 0.45)',
        'glow-purple': '0 0 20px -2px rgba(139, 92, 246, 0.45)',
        'card-glow': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'ripple': 'ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
