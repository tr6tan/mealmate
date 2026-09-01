import { DEFAULT_RECIPES } from '@/data/defaultRecipes'

/**
 * Distingue les recettes du foyer de celles livrées avec l'app.
 *
 * Le sélecteur de la semaine triait par favori puis par « rapide ». Une
 * recette qu'on venait de créer n'étant ni l'un ni l'autre, elle arrivait au
 * rang 41 sur 101, derrière les quarante recettes rapides livrées, et jamais
 * dans les cinq suggestions : il fallait la chercher par son nom pour la
 * planifier. Ses propres recettes passent désormais devant.
 *
 * L'identifiant fait foi : les recettes livrées ont un id fixe, tout le reste
 * vient d'un `nanoid()`, création comme duplication. Dupliquer une recette
 * livrée donne donc bien une recette maison, ce qui est le comportement voulu.
 */
const IDS_LIVRES = new Set(DEFAULT_RECIPES.map((r) => r.id))

export function estMaison(recipe: { id: string }): boolean {
  return !IDS_LIVRES.has(recipe.id)
}
