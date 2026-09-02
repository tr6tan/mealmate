import { useState } from 'react'
import { CREDITS_PHOTOS, urlCommons } from '@/data/creditsPhotos'

/**
 * Crédits des photos de recettes.
 *
 * Les licences CC BY et CC BY-SA exigent de nommer l'auteur et la licence ;
 * les afficher n'est donc pas une politesse mais une condition d'usage. Replié
 * par défaut : trente lignes de crédits n'ont rien à faire au milieu des
 * réglages qu'on vient changer.
 */
export default function CreditsPhotosCard() {
  const [ouvert, setOuvert] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        className="w-full flex items-center justify-center gap-1.5 min-h-[44px] text-[10px] text-muted"
      >
        <span>
          Photos&nbsp;: Unsplash et{' '}
          <span className="underline">Wikimedia Commons</span>
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${ouvert ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {ouvert && (
        <ul className="mt-1 mb-2 px-1 flex flex-col gap-1.5">
          {CREDITS_PHOTOS.map((c) => (
            <li key={c.recette} className="text-[10px] text-muted leading-snug">
              <span className="text-text2 font-semibold">{c.recette}</span>
              {', '}
              <a
                href={urlCommons(c.fichier)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {c.fichier}
              </a>
              {', '}
              {c.auteur}
              {', '}
              {c.licence}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
