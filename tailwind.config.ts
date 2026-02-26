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
        bg:     'rgb(var(--c-bg)     / <alpha-value>)',
        card:   'rgb(var(--c-card)   / <alpha-value>)',
        sep:    'rgb(var(--c-sep)    / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        text1:  'rgb(var(--c-text1)  / <alpha-value>)',
        text2:  'rgb(var(--c-text2)  / <alpha-value>)',
        muted:  'rgb(var(--c-muted)  / <alpha-value>)',
        terra: {
          DEFAULT: 'rgb(var(--c-terra)       / <alpha-value>)',
          light:   'rgb(var(--c-terra-light) / <alpha-value>)',
          dark:    'rgb(var(--c-terra-dark)  / <alpha-value>)',
        },
        sage: {
          DEFAULT: 'rgb(var(--c-sage)       / <alpha-value>)',
          light:   'rgb(var(--c-sage-light) / <alpha-value>)',
        },
        morning: 'rgb(var(--c-morning) / <alpha-value>)',
        evening: 'rgb(var(--c-evening) / <alpha-value>)',
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
