/**
 * Crédits des photos issues de Wikimedia Commons.
 *
 * Les licences CC BY et CC BY-SA exigent de nommer l'auteur et la licence :
 * ces mentions sont affichées dans les réglages. À tenir à jour avec
 * `RECIPE_PHOTOS` dans `defaultRecipes.ts`.
 */

export interface CreditPhoto {
  /** Recette illustrée. */
  recette: string
  /** Nom du fichier sur Commons, qui donne l'adresse de sa page. */
  fichier: string
  auteur: string
  licence: string
}

export const CREDITS_PHOTOS: CreditPhoto[] = [
  { recette: 'Bar au four et purée', fichier: 'Sea bass as served (1526986100).jpg',
    auteur: 'Andy / Andrew Fogg from near Cambridge, UK', licence: 'CC BY 2.0' },
  { recette: 'Blanquette de veau', fichier: 'Blanquette de Veau (3).JPG',
    auteur: 'Dr. Bernd Gross', licence: 'CC BY-SA 3.0 de' },
  { recette: 'Brioche perdue', fichier: 'French toast 001.jpg',
    auteur: 'Ocdp', licence: 'CC0' },
  { recette: 'Cannelloni ricotta épinards', fichier: 'Spinach and ricotta cannelloni.jpg',
    auteur: 'Alpha from Melbourne, Australia', licence: 'CC BY-SA 2.0' },
  { recette: 'Carbonade flamande', fichier: 'Jielbeaumadier carbonade flamande 2010.jpg',
    auteur: 'Jiel Beaumadier', licence: 'CC BY-SA 4.0' },
  { recette: 'Chili con carne', fichier: 'Chili con carne cuisson.jpg',
    auteur: 'Aerith', licence: 'CC0' },
  { recette: 'Cordon bleu', fichier: 'Cordon-bleu-2.jpg',
    auteur: 'Rainer Zenz', licence: 'GPL' },
  { recette: 'Couscous poulet', fichier: 'Couscous Tfaya 3.jpg',
    auteur: 'Arastalya', licence: 'CC BY-SA 4.0' },
  { recette: 'Fish & chips', fichier: 'Fish and chips blackpool.jpg',
    auteur: 'Matthias Meckel', licence: 'CC BY-SA 4.0' },
  { recette: 'Galettes sarrasin', fichier: 'Galette de sarrasin complète bretonne.jpg',
    auteur: 'Arnaud 25', licence: 'CC BY-SA 4.0' },
  { recette: 'Gnocchi sauce tomate', fichier: 'Gnocchi al pomodoro.JPG',
    auteur: 'Ivan Vighetto', licence: 'CC BY-SA 3.0' },
  { recette: 'Gratin dauphinois', fichier: 'Potatoes-kmf (3118473571).jpg',
    auteur: 'Karen and Brad Emerson', licence: 'CC BY 2.0' },
  { recette: 'Hachis Parmentier', fichier: 'Hachis parmentier 01.jpg',
    auteur: 'Bycro', licence: 'CC BY-SA 4.0' },
  { recette: 'Moussaka', fichier: 'Mousakas.jpg',
    auteur: 'Fotograf: Dieter Mueller (dino1948) Kamera: de:Nikon 885', licence: 'CC BY-SA 3.0' },
  { recette: 'Naans fromage', fichier: 'Naan Bread.JPG',
    auteur: 'Siddhantsahni28', licence: 'CC BY-SA 4.0' },
  { recette: 'Osso buco', fichier: 'Ossobuco.jpg',
    auteur: 'Mogens Engelund', licence: 'CC BY-SA 3.0' },
  { recette: 'Parmigiana d\'aubergines', fichier: 'Parmigiana di melanzane.jpg',
    auteur: 'Schellenberg', licence: 'CC BY-SA 4.0' },
  { recette: 'Pot-au-feu', fichier: 'Pot-au-feu2.jpg',
    auteur: 'Andre', licence: 'CC BY-SA 3.0' },
  { recette: 'Poulet rôti', fichier: 'Max\'s Roasted Chicken - Evan Swigart.jpg',
    auteur: 'Evan Swigart from Chicago, USA', licence: 'CC BY 2.0' },
  { recette: 'Quiche lorraine', fichier: 'Quiche lorraine 04.jpg',
    auteur: 'Arnaud 25', licence: 'CC0' },
  { recette: 'Rôti de porc', fichier: 'Roast Pork with gravy, May 2024.jpg',
    auteur: 'Ralff Nestor Nacor', licence: 'CC BY-SA 4.0' },
  { recette: 'Rösti', fichier: 'Rösti auf blauem Teller.jpg',
    auteur: 'Poupou l\'quourouce', licence: 'CC BY 4.0' },
  { recette: 'Salade niçoise', fichier: 'Salade nicoise.jpg',
    auteur: 'Canterel', licence: 'CC BY-SA 4.0' },
  { recette: 'Saucisse purée', fichier: 'Charlecote Park Sausage and Mash Warwickshire England 01 darker.jpg',
    auteur: 'Acabashi', licence: 'CC BY-SA 4.0' },
  { recette: 'Soupe miso', fichier: 'Miso Soup 001.jpg',
    auteur: 'Ocdp', licence: 'CC0' },
  { recette: 'Soupe à l\'oignon', fichier: 'Mmm...onion soup (5344349906).jpg',
    auteur: 'jeffreyw', licence: 'CC BY 2.0' },
  { recette: 'Taboulé', fichier: 'Flickr - cyclonebill - Tabbouleh.jpg',
    auteur: 'cyclonebill', licence: 'CC BY-SA 2.0' },
  { recette: 'Tajine de poulet', fichier: 'Tajine de poulet et olives.jpg',
    auteur: 'Solima arizo', licence: 'CC BY-SA 4.0' },
  { recette: 'Tarte flambée', fichier: 'Tarte flambée alsacienne 514471722.jpg',
    auteur: 'Lulu Durand', licence: 'CC BY 2.0' },
  { recette: 'Tartiflette', fichier: 'Tartiflette 2.jpg',
    auteur: 'Arnaud 25', licence: 'Public domain' },
]

/** Adresse de la page du fichier sur Commons, où figure la licence complète. */
export function urlCommons(fichier: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fichier.replace(/ /g, '_'))}`
}
