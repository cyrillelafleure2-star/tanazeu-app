/**
 * ============================================================
 * CORE / CONSTANTS
 * Famille TANAZEU - V2.0
 * 
 * Toutes les valeurs fixes de l'application.
 * Ces valeurs ne changent jamais et définissent les règles
 * métier fondamentales.
 * ============================================================
 */

// --- MEMBRES DE LA FAMILLE ---
// Liste complète des membres réguliers.
// Si un membre change, modifie cette liste.
export const MEMBERS = [
    "Cyrille",
    "Hermann",
    "Herve",
    "Nina",
    "Nadege",
    "Albertine",
    "Florence",
    "Gwladys",
    "Jean",
    "Marie"
];

// --- MONTANTS DES TONTINES ---
// Montant de la tontine rations (repas + boisson)
export const TONTINE_RATIONS = 1500;      // 800 repas + 700 boisson

// Montant de la tontine assiette (achat d'assiettes en fin d'année)
export const TONTINE_ASSIETTE = 1000;

// Prix d'une part de la tontine cotisation
export const COTISATION_PART_PRICE = 10000;

// Montant par défaut du fonds de caisse (assurance)
export const FONDS_CAISSE_DEFAULT = 20000;

// --- STOCKAGE ---
// Clé utilisée dans localStorage pour sauvegarder l'état complet
export const STORAGE_KEY = "tanazuAppState";

// Clé pour l'export/import de l'historique
export const HISTORY_EXPORT_KEY = "tanazuHistoryExport";

// --- OPTIONS POUR LE SELECTEUR DE PARTS (1 à 6) ---
export const PART_OPTIONS = [1, 2, 3, 4, 5, 6];

// --- ANNÉE DE DÉBUT DE L'HISTORIQUE ---
export const HISTORY_START_YEAR = 2020;

// --- NOM DE LA FAMILLE (pour l'affichage) ---
export const FAMILY_NAME = "TANAZEU";