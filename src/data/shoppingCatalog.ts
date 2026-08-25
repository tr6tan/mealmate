/**
 * Catalogue d'articles proposés à l'ajout dans la liste de courses.
 *
 * Ce sont des données, pas de l'interface : elles vivaient dans
 * AddItemSheet.tsx, qui en tirait 397 lignes.
 */
import type { ShoppingCategory } from '@/types'

export type CatalogItem = { name: string; category: ShoppingCategory }
export type CatalogSection = { id: string; label: string; items: CatalogItem[] }

const mk =
  (cat: ShoppingCategory) =>
  (items: string[]): CatalogItem[] =>
    items.map((name) => ({ name, category: cat }))

const l = mk('legumes')
const v = mk('viandes')
const c = mk('cremerie')
const e = mk('epicerie')
const s = mk('surgeles')
const m = mk('maison')

export const CATALOG: CatalogSection[] = [
  {
    id: 'legumes', label: 'Légumes', items: l([
      'Tomate', 'Tomate cerise', 'Carotte', 'Concombre',
      'Salade', 'Épinards', 'Brocoli', 'Chou-fleur',
      'Poivron rouge', 'Poivron vert', 'Oignon', 'Échalote',
      'Poireau', 'Ail', 'Champignon', 'Maïs',
      'Pomme de terre', 'Patate douce', 'Aubergine', 'Courgette',
      'Avocat', 'Haricots verts', 'Petits pois', 'Potiron',
      'Radis', 'Asperge',
    ]),
  },
  {
    id: 'fruits', label: 'Fruits', items: l([
      'Pomme', 'Poire', 'Banane', 'Citron',
      'Orange', 'Fraise', 'Framboise', 'Mangue',
      'Ananas', 'Raisin', 'Pêche', 'Cerise',
      'Kiwi', 'Melon',
    ]),
  },
  {
    id: 'viandes', label: 'Viandes & Poissons', items: v([
      'Poulet', 'Boeuf haché', 'Saumon', 'Jambon',
      'Lardons', 'Crevettes', 'Thon', 'Escalope',
      'Steak', 'Dinde', 'Saucisses', 'Cabillaud',
    ]),
  },
  {
    id: 'cremerie', label: 'Crèmerie', items: c([
      'Lait', 'Yaourt', 'Fromage', 'Beurre',
      'Creme fraiche', 'Oeufs', 'Mozzarella', 'Parmesan',
      'Gruyere', 'Feta',
    ]),
  },
  {
    id: 'epicerie', label: 'Épicerie', items: e([
      'Pates', 'Riz', 'Farine', 'Sucre',
      'Sel', "Huile d'olive", 'Sauce tomate', 'Bouillon',
      'Pain', 'Cafe', 'Chocolat', 'Confiture',
      'Miel', 'Chips',
    ]),
  },
  {
    id: 'surgeles', label: 'Surgelés', items: s([
      'Epinards surgelés', 'Petits pois surgelés', 'Pizza surgelée',
      'Frites surgelées', 'Glace', 'Nuggets', 'Poisson pané',
    ]),
  },
  {
    id: 'maison', label: 'Maison', items: m([
      'Savon', 'Lessive', 'Liquide vaisselle',
      'Papier toilette', 'Sac poubelle', 'Eponge',
      'Sopalin', 'Dentifrice',
    ]),
  },
]
