# MealMate

Planificateur de repas de la semaine, liste de courses et carnet de recettes.
PWA installable, pensée mobile, synchronisée en temps réel entre les appareils
d'un même foyer.

React 18 + TypeScript + Vite + Tailwind, état local Zustand, persistance
Firestore.

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis remplir avec ta config Firebase
npm run dev
```

L'app tourne sur http://localhost:5173.

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | typecheck puis build de production dans `dist/` |
| `npm run preview` | sert le build de production |
| `npm run lint` | ESLint, zéro tolérance aux avertissements |
| `npm test` | tests unitaires (Vitest) |
| `npm run deploy` | incrémente la version et pousse le tag |

## Configuration Firebase

Les variables vivent dans `.env.local` (jamais commité, cf. `.env.example`).
`VITE_APP_ENV` choisit la collection : `dev` écrit dans `foyers_dev`, toute
autre valeur dans `foyers`.

Deux réglages sont à faire une fois dans la console Firebase :

1. **Authentication → Sign-in method → activer « Anonyme ».** L'app ouvre une
   session anonyme au démarrage ; c'est ce qui permet aux règles d'exiger une
   session sans demander de compte à l'utilisateur.
2. **Déployer les règles** de `firestore.rules` :

   ```bash
   firebase deploy --only firestore:rules
   ```

   Sans ce déploiement, les photos de recettes et l'indicateur de présence
   restent inaccessibles (l'app fonctionne, en le signalant une fois en console).

## Modèle de données

Un foyer est un document Firestore, plus deux sous-collections :

```
foyers/{foyerId}
  weekPlans         semaine (clé = lundi 'YYYY-MM-DD') → 7 jours → créneaux
  recipesCustom     recettes créées par le foyer
  recipesOverrides  id d'une recette livrée → champs personnalisés
  deletedDefaults   recettes livrées que le foyer a supprimées
  shoppingItems     liste de courses, map indexée par id
  settings          régime, nom du foyer, thème
  photos/{recipeId}    { data: dataURL }   une photo par document
  presence/{deviceId}  { lastSeen }        membres connectés
```

**Le carnet n'est pas stocké en entier.** Les recettes livrées avec l'app sont
déjà dans le bundle : Firestore ne garde que le delta (`recipesCustom` +
`recipesOverrides`). Sur un foyer réel, le carnet est passé de 72 Ko à moins
de 1 Ko. Le champ `recipes` de l'ancien format est migré puis supprimé au
premier chargement.

**Les écritures ciblent des chemins de champs** (`weekPlans.2026-08-24.1.midi`,
`shoppingItems.{id}`) plutôt que des champs entiers, pour que Firestore fusionne
côté serveur : deux membres du foyer qui planifient ou cochent au même moment ne
s'écrasent plus. La liste de courses est stockée en map indexée par id pour la
même raison ; son ordre d'affichage vient du champ `addedAt`, une map n'ayant
pas d'ordre garanti.

Un document Firestore plafonne à 1 Mio : les photos vivent **hors** du document
foyer, une par document (`src/lib/photos.ts`). Une photo base64 qui se
glisserait dans une recette est extraite automatiquement à l'écriture.

Les semaines de plus de 4 semaines sont purgées à l'hydratation, et la purge
est propagée à Firestore (elle restait locale, le document accumulait toutes
les semaines jamais vues).

## Foyers

Un foyer est identifié par un id secret de 21 caractères. Il se transmet par le
lien d'invitation (`?foyer=<id>`, QR code dans Réglages), puis est mémorisé dans
`localStorage`.

Sans indication, l'app retombe sur un foyer historique **partagé par toute
personne qui ouvre l'URL** — c'était le seul mode avant l'introduction des
foyers multiples. Réglages → Foyer → « Créer un foyer privé » en sort.

## Structure

```
src/
  components/   pages et sheets, par domaine (planning, recipes, shopping…)
  hooks/        useFoyerSync (temps réel), useFoyerPresence
  lib/          firebase, foyer, photos, stickers, syncDiff, mealdb, utils, toast
  store/        useAppStore (Zustand) — état et actions
  data/         recettes livrées avec l'app, catalogue de courses
  __tests__/    tests unitaires
```

Les stickers alimentaires viennent d'[Icons8](https://icons8.com) et sont servis
depuis `public/icons/stickers/`. Ils ne sont pas précachés par le service
worker : ils entrent en cache au premier affichage.
