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
  },
  required: ['lisible', 'nom', 'minutes', 'portions', 'ingredients', 'etapes'],
} as const

const CONSIGNE = `Tu lis la photo d'une recette de cuisine : page de livre, fiche, carnet manuscrit ou capture d'écran.

Rends ce que la page dit, et rien d'autre :
- ne complète pas une recette incomplète, ne devine pas un ingrédient absent ;
- garde les quantités telles qu'écrites, avec leur unité ;
- sépare la quantité du nom : « 200 g de farine » donne nom « Farine », quantité « 200 g » ;
- une étape par instruction, sans son numéro ;
- si la page annonce préparation et cuisson séparément, additionne-les, mais laisse le repos de côté ;
- si l'image ne montre pas une recette lisible, mets lisible à false et laisse le reste vide.

Réponds en français, dans la langue de la page si elle est française.`

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

  try {
    const reponse = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'x-goog-api-key': cle, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3.8-flash',
        input: [
          { type: 'text', text: CONSIGNE },
          { type: 'image', data: image, mime_type: corps?.mimeType ?? 'image/jpeg' },
        ],
        response_format: { type: 'text', mime_type: 'application/json', schema: SCHEMA },
      }),
    })

    if (!reponse.ok) {
      const detail = await reponse.text()
      // 429 remonte tel quel : le client sait dire « réessaie dans un moment »
      // plutôt que « erreur inconnue ».
      res.status(reponse.status === 429 ? 429 : 502).json({
        erreur: reponse.status === 429 ? 'trop-de-demandes' : 'fournisseur',
        message: detail.slice(0, 300),
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

    res.status(200).json(JSON.parse(texte))
  } catch (e) {
    res.status(502).json({
      erreur: 'fournisseur',
      message: e instanceof Error ? e.message : 'Appel impossible',
    })
  }
}
