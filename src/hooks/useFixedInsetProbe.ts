import { useEffect } from 'react'

/**
 * Mesure si le navigateur contraint les éléments `position: fixed` à la zone
 * sûre, au lieu de les laisser atteindre le bord physique de l'écran.
 *
 * Les deux comportements existent selon la version d'iOS, et rien ne permet
 * de les distinguer par détection de fonctionnalité. Une barre placée à
 * `bottom: 12px` se retrouve donc soit à 12pt du bord, soit à 12pt au-dessus
 * de la barre de gestes, avec 34pt de vide en dessous.
 *
 * On sonde une fois au démarrage : un témoin invisible en `bottom: 0`, et on
 * compare sa position au bas du viewport. L'écart est publié dans la variable
 * CSS `--fixed-bottom-gap`, que les éléments flottants soustraient de leur
 * position pour retrouver le bord physique.
 */
export function useFixedInsetProbe() {
  useEffect(() => {
    const mesurer = () => {
      const temoin = document.createElement('div')
      temoin.style.cssText =
        'position:fixed;bottom:0;left:0;width:1px;height:1px;pointer-events:none;opacity:0;'
      document.body.appendChild(temoin)
      const bas = temoin.getBoundingClientRect().bottom
      temoin.remove()

      // Écart entre le bas du témoin et le bas du viewport : 0 quand les
      // `fixed` atteignent le bord, la hauteur de la zone de gestes sinon.
      const ecart = Math.max(0, Math.round(window.innerHeight - bas))
      document.documentElement.style.setProperty('--fixed-bottom-gap', `${ecart}px`)
    }

    mesurer()
    window.addEventListener('resize', mesurer)
    window.addEventListener('orientationchange', mesurer)
    return () => {
      window.removeEventListener('resize', mesurer)
      window.removeEventListener('orientationchange', mesurer)
    }
  }, [])
}
