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
        sans: [
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        bg:     'rgb(var(--c-bg)     / <alpha-value>)',
        card:   'rgb(var(--c-card)   / <alpha-value>)',
        sep:    'rgb(var(--c-sep)    / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        text1:  'rgb(var(--c-text1)  / <alpha-value>)',
        text2:  'rgb(var(--c-text2)  / <alpha-value>)',
        muted:  'rgb(var(--c-muted)  / <alpha-value>)',
        // Texte accentué : suit le thème pour rester lisible sur fond sombre,
        // là où `terra` (fond de bouton) tomberait à 1.37:1.
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        // Surface de contrôle posée sur une carte (segments, steppers).
        fill:   'rgb(var(--c-fill)   / <alpha-value>)',
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
        danger: {
          DEFAULT: 'rgb(var(--c-danger)       / <alpha-value>)',
          light:   'rgb(var(--c-danger-light) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--c-success)       / <alpha-value>)',
          light:   'rgb(var(--c-success-light) / <alpha-value>)',
        },
      },
      borderRadius: {
        xl: '18px',
        lg: '12px',
        DEFAULT: '8px',
      },
      boxShadow: {
        card: '0 2px 16px rgba(0,0,0,0.07)',
        terra: '0 8px 24px rgba(0,24,168,0.35)',
        'terra-sm': '0 4px 12px rgba(0,24,168,0.28)',
      },
    },
  },
  plugins: [],
}

export default config
