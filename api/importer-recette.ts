/**
 * Lecture d'une recette photographiée.
 *
 * Cette fonction existe pour une seule raison : la clé d'API ne doit jamais
 * atteindre le navigateur. Une PWA est du code public, une clé qui y passe est
 * une clé donnée. Elle vit donc en variable d'environnement Vercel, et le
 * téléphone parle à cette fonction, qui parle à Gemini.
 *
 * Le modèle ne fait qu'une chose : lire la page et rendre ce qu'il y voit. Le
 * rayon des ingrédients, le moment du repas et le régime sont déduits côté
 * app, par du code déja testé : autant ne pas demander deux fois la même
 * chose, ni faire confiance à un modèle pour ce qu'une expression régulière
 * fait de façon reproductible.
 */

/** Ce que le modèle doit rendre. Rien de plus, rien d'optionnel. */
const SCHEMA = {
  type: 'object',
  properties: {
    lisible: {
      type: 'boolean',
      description: "false si l'image ne montre pas une recette de cuisine lisible",
    },
    nom: { type: 'string', description: 'Nom du plat, sans le sous-titre ni la collection' },
    minutes: {
      type: 'integer',
      description:
        'Durée totale en minutes (préparation + cuisson, sans le repos). 0 si la page ne la donne pas.',
    },
    portions: {
      type: 'integer',
      description: 'Nombre de convives annoncé. 0 si la page ne le donne pas.',
    },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nom: { type: 'string', description: "Nom seul, sans la quantité" },
          quantite: { type: 'string', description: 'Quantité avec son unité, ou chaîne vide' },
        },
        required: ['nom', 'quantite'],
      },
    },
    etapes: {
      type: 'array',
      items: { type: 'string' },
      description: 'Une entrée par étape, sans le numéro',
    },
    photo: {
      type: 'object',
      description: "Emplacement de la photographie du plat terminé, s'il y en a une",
      properties: {
        presente: {
          type: 'boolean',
          description:
            "true seulement s'il y a une vraie photographie du plat terminé. false pour un dessin, une illustration d'ingrédient, un logo ou une photo d'ustensile.",
        },
        boite: {
          type: 'array',
          items: { type: 'integer' },
          description:
            'Cadre de cette photographie, [ymin, xmin, ymax, xmax] rapporté à 0-1000. Tableau vide si presente vaut false.',
        },
      },
      required: ['presente', 'boite'],
    },
  },
  required: ['lisible', 'nom', 'minutes', 'portions', 'ingredients', 'etapes', 'photo'],
} as const

const CONSIGNE = `Tu lis la photo d'une recette de cuisine : page de livre, fiche, carnet manuscrit ou capture d'écran.

Rends ce que la page dit, et rien d'autre :
- ne complète pas une recette incomplète, ne devine pas un ingrédient absent ;
- garde les quantités telles qu'écrites, avec leur unité ;
- sépare la quantité du nom : « 200 g de farine » donne nom « Farine », quantité « 200 g » ;
- une étape par instruction, sans son numéro ;
- si la page annonce préparation et cuisson séparément, additionne-les, mais laisse le repos de côté ;
- si l'image ne montre pas une recette lisible, mets lisible à false et laisse le reste vide ;
- si la page porte une photographie du plat terminé, donne son cadre dans le champ photo. Une illustration, un dessin d'ingrédient, une icône ou une photo d'ustensile ne compte pas : dans ce cas presente vaut false.

Réponds en français, dans la langue de la page si elle est française.`

/**
 * Modèles essayés dans l'ordre.
 *
 * Les quotas gratuits ne se devinent pas, et j'ai commencé par les lire de
 * travers. Le tableau de bord d'AI Studio donne les vrais chiffres, par jour :
 *
 *   Flash      (3.5, 3.6, 3.7, 3.8)   20 requêtes
 *   Flash-Lite (3.1, 3.5)            500 requêtes
 *
 * Soit vingt-cinq fois plus pour les Lite. Ma première liste commençait par
 * les Flash, donc par les deux modèles les plus avares : quarante lectures et
 * la chaîne était à sec.
 *
 * Les deux Lite ont été essayés sur une vraie carte de recette à deux colonnes,
 * dont le bloc des étapes porte un intertitre faux : ils la lisent aussi bien
 * que les Flash, et en quatre secondes au lieu de onze. Ils passent donc
 * devant, et les Flash restent en réserve pour les images difficiles, là où
 * leur avance peut compter.
 *
 * Total : environ 1 040 lectures par jour, ce qui dépasse largement ce qu'un
 * foyer numérise.
 *
 * `GEMINI_MODEL` impose un modèle unique, pour un essai ou un dépannage.
 */
const MODELES = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
]

/** Un corps trop gros vient d'une photo non redimensionnée : on le dit. */
const TAILLE_MAX = 4 * 1024 * 1024

interface Requete {
  method?: string
  body?: unknown
}

interface Reponse {
  status: (code: number) => Reponse
  json: (corps: unknown) => void
}

export default async function handler(req: Requete, res: Reponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ erreur: 'methode', message: 'POST attendu' })
    return
  }

  const cle = process.env.GEMINI_API_KEY
  if (!cle) {
    // Message explicite : cette panne-la se produit une fois, au déploiement,
    // et « 500 » ne dit pas quoi faire.
    res.status(503).json({
      erreur: 'cle-absente',
      message: "La clé GEMINI_API_KEY n'est pas configurée sur le serveur.",
    })
    return
  }

  const corps = req.body as { image?: string; mimeType?: string } | undefined
  const image = typeof corps?.image === 'string' ? corps.image : ''
  if (!image) {
    res.status(400).json({ erreur: 'image-absente', message: 'Aucune image reçue.' })
    return
  }
  if (image.length > TAILLE_MAX) {
    res.status(413).json({ erreur: 'image-trop-grosse', message: 'Photo trop lourde.' })
    return
  }

  /*
   * Le palier gratuit répond parfois « high demand » : une panne passagère,
   * qui se résout d'elle-même en quelques secondes. Deux essais sur trois
   * échouaient ainsi pendant la mise au point, et demander à la personne de
   * recommencer aurait été lui faire faire le travail de la machine.
   *
   * Un seul réessai, et seulement s'il reste du temps : la fonction est
   * coupée à 60 s, une lecture en prend 25, et un réessai lancé trop tard
   * serait tué en cours de route.
   */
  const debut = Date.now()
  const impose = process.env.GEMINI_MODEL
  const aEssayer = impose ? [impose] : MODELES

  /*
   * Surcharge et quota se ressemblent mais ne se soignent pas pareil.
   *
   * Une surcharge se dissipe en quelques secondes et mérite un réessai sur
   * le même modèle. Un quota dépassé, non : il faut changer de modèle, ou
   * rendre la main. Réessayer sur place ne ferait que consommer une requête
   * de plus sur celles qui restent.
   */
  const EST_QUOTA = (texte: string) => /quota|rate.?limit|too_many_requests/i.test(texte)
  const EST_SURCHARGE = (code: number, texte: string) =>
    code === 503 || /high demand|overload|unavailable/i.test(texte)

  /** Délai d'attente que Google donne dans son message, en secondes. */
  const ATTENTE = (texte: string): number | null => {
    const m = texte.match(/retry in ([\d.]+)s/i)
    const n = m ? Math.ceil(Number(m[1])) : NaN
    return Number.isFinite(n) ? n : null
  }

  const appeler = (modele: string) =>
    fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'x-goog-api-key': cle, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modele,
        input: [
          { type: 'text', text: CONSIGNE },
          { type: 'image', data: image, mime_type: corps?.mimeType ?? 'image/jpeg' },
        ],
        response_format: { type: 'text', mime_type: 'application/json', schema: SCHEMA },
      }),
    })

  try {
    let reponse: Response | null = null
    let modeleRetenu = ''
    let dernierDetail = ''

    for (const modele of aEssayer) {
      // La fonction est coupée à 60 s : ne pas lancer un appel qui serait tué
      // en cours de route, mieux vaut rendre l'erreur du précédent.
      if (Date.now() - debut > 35_000) break

      let r = await appeler(modele)

      if (!r.ok) {
        const detail = await r.text()
        dernierDetail = detail

        // Une surcharge se dissipe : un réessai sur le même modèle.
        if (EST_SURCHARGE(r.status, detail) && Date.now() - debut < 25_000) {
          await new Promise((res2) => setTimeout(res2, 2500))
          r = await appeler(modele)
          if (!r.ok) {
            dernierDetail = await r.text()
            continue
          }
        } else {
          // Quota épuisé ou autre refus : au modèle suivant.
          continue
        }
      }

      reponse = r
      modeleRetenu = modele
      break
    }

    if (!reponse) {
      const quota = EST_QUOTA(dernierDetail)
      res.status(quota ? 429 : 502).json({
        erreur: quota ? 'quota' : 'fournisseur',
        secondes: quota ? ATTENTE(dernierDetail) : undefined,
        modelesEssayes: aEssayer.length,
        message: dernierDetail.slice(0, 300),
      })
      return
    }

    const brut = (await reponse.json()) as {
      steps?: { type?: string; content?: { type?: string; text?: string }[] }[]
    }
    const texte = (brut.steps ?? [])
      .filter((s) => s.type === 'model_output')
      .flatMap((s) => s.content ?? [])
      .find((c) => c.type === 'text')?.text

    if (!texte) {
      res.status(502).json({ erreur: 'reponse-vide', message: 'Le modèle n’a rien rendu.' })
      return
    }

    res.status(200).json({ ...JSON.parse(texte), modele: modeleRetenu })
  } catch (e) {
    res.status(502).json({
      erreur: 'fournisseur',
      message: e instanceof Error ? e.message : 'Appel impossible',
    })
  }
}
