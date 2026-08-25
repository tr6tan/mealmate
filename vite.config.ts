/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Fuseau explicite : les serveurs de build tournent en UTC, le badge
    // affichait donc une heure en décalage de deux heures avec celle du
    // téléphone, ce qui laisse croire que la mise à jour n'est pas passée.
    __BUILD_TIME__: JSON.stringify(
      new Date().toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    ),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'MealMate',
        short_name: 'MealMate',
        description: 'Planificateur de repas de la semaine',
        theme_color: '#0018A8',
        background_color: '#F4F1EA',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        enabled: false, // SW désactivé en dev pour éviter le cache stale
      },
      workbox: {
        // Les 245 stickers Icons8 (~2,8 Mo) sont exclus du precache : ils sont
        // mis en cache à la première utilisation (cf. runtimeCaching), sinon le
        // service worker télécharge 5,4 Mo à chaque mise à jour de l'app.
        globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
        globIgnores: ['**/icons/stickers/**'],
        // Les icônes d'app (manifeste, favicon) restent précachées.
        additionalManifestEntries: [
          { url: '/icons/manifest-icon-192.maskable.png', revision: null },
          { url: '/icons/manifest-icon-512.maskable.png', revision: null },
          { url: '/icons/apple-icon-180.png', revision: null },
          { url: '/icons/favicon-196.png', revision: null },
        ],
        runtimeCaching: [
          {
            // Stickers : mis en cache au premier affichage, gardés un an.
            urlPattern: /\/icons\/stickers\/.*\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'food-stickers',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fonts Google — CacheFirst : téléchargées une fois, servies depuis le cache
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Firebase pèse l'essentiel du bundle et bouge rarement : dans son
        // propre chunk, il reste en cache navigateur d'une version à l'autre.
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          react: ['react', 'react-dom'],
          // Les recettes livrées pèsent 73 Ko minifiés, soit plus d'un tiers
          // du bundle applicatif, et ne changent presque jamais. Dans leur
          // propre chunk, elles restent en cache navigateur d'un déploiement
          // à l'autre au lieu d'être retéléchargées à chaque version.
          recettes: ['./src/data/defaultRecipes.ts'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
})
