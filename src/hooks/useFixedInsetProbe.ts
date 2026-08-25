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
      // Sonde 1 : hauteur de la zone de sécurité haute, que le viewport
      // n'inclut jamais en mode autonome.
      const sondeHaut = document.createElement('div')
      sondeHaut.style.cssText =
        'position:fixed;top:0;left:0;width:1px;height:env(safe-area-inset-top);pointer-events:none;opacity:0;'
      document.body.appendChild(sondeHaut)
      const insetHaut = sondeHaut.getBoundingClientRect().height
      sondeHaut.remove()

      // Sonde 2 : un `fixed` en bas atteint-il le bas du viewport ?
      const sondeBas = document.createElement('div')
      sondeBas.style.cssText =
        'position:fixed;bottom:0;left:0;width:1px;height:1px;pointer-events:none;opacity:0;'
      document.body.appendChild(sondeBas)
      const ecartViewport = Math.max(
        0,
        Math.round(window.innerHeight - sondeBas.getBoundingClientRect().bottom),
      )
      sondeBas.remove()

      /*
       * Ce que le viewport laisse sous lui, en points d'écran.
       *
       * Comparer au seul `innerHeight` ne suffit pas : sur certains appareils
       * le viewport s'arrête lui-même au-dessus du bord physique, et l'écart
       * mesuré vaut alors 0 alors qu'il reste une bande sous l'app. On part
       * donc de la hauteur de l'écran, dont on retire le viewport et la zone
       * de sécurité haute qu'il n'a jamais couverte.
       */
      // Uniquement en mode autonome : dans un navigateur, `screen.height` est
      // la hauteur de l'écran, sans rapport avec celle de la fenêtre, et la
      // soustraction n'aurait aucun sens.
      const autonome =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone === true
      const hauteurEcran = window.screen?.height ?? window.innerHeight
      const resteEcran = autonome
        ? Math.round(hauteurEcran - window.innerHeight - insetHaut)
        : 0

      // Une valeur aberrante (écran en rotation, fenêtre redimensionnée sur
      // ordinateur) ne doit pas décaler l'interface : on borne à 64pt.
      const ecart = Math.min(64, Math.max(0, ecartViewport, resteEcran))
      document.documentElement.style.setProperty('--fixed-bottom-gap', `${ecart}px`)

      // Diagnostic temporaire : les valeurs sont affichées à côté du numéro
      // de version, le temps de comprendre le décalage constaté sur un
      // appareil que le simulateur ne reproduit pas.
      document.documentElement.dataset.probe = [
        `g${ecart}`,
        `ih${window.innerHeight}`,
        `sh${hauteurEcran}`,
        `it${Math.round(insetHaut)}`,
        `ev${ecartViewport}`,
        autonome ? 'pwa' : 'web',
      ].join(' ')
      window.dispatchEvent(new Event('probe-updated'))
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
