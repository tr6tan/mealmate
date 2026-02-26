import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#FAFAF7',
        card: '#FFFFFF',
        terra: {
          DEFAULT: '#E07B54',
          light: '#FDF0EB',
          dark: '#C4623C',
        },
        sage: {
          DEFAULT: '#6B9E78',
          light: '#EEF5F0',
        },
        muted: '#8E8E93',
        sep: '#F2F2F0',
        border: '#E8E8E5',
        text1: '#1C1C1E',
        morning: '#F5A623',
        evening: '#7C5CBF',
      },
      borderRadius: {
        xl: '18px',
        lg: '12px',
        DEFAULT: '8px',
      },
      boxShadow: {
        card: '0 2px 16px rgba(0,0,0,0.07)',
        terra: '0 8px 24px rgba(224,123,84,0.45)',
        'terra-sm': '0 4px 12px rgba(224,123,84,0.4)',
      },
    },
  },
  plugins: [],
}

export default config
