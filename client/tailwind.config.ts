import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030712',
          900: '#050B1A',
          850: '#0A1226',
          800: '#0F1B38',
          700: '#1A294F',
        },
        medical: {
          blue: '#0B5FFF',
          cyan: '#22D3EE',
          soft: '#EEF6FF',
          dark: '#0840B0',
        },
        emergency: {
          red: '#E11D48',
          light: '#FFE4E6',
        },
        success: {
          green: '#10B981',
          light: '#D1FAE5',
        },
        warning: {
          amber: '#F59E0B',
          light: '#FEF3C7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(11, 95, 255, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(11, 95, 255, 0.16)',
        'glow-blue': '0 0 25px -4px rgba(11, 95, 255, 0.45)',
        'glow-cyan': '0 0 25px -4px rgba(34, 211, 238, 0.45)',
        'glow-red': '0 0 25px -4px rgba(225, 29, 72, 0.45)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
