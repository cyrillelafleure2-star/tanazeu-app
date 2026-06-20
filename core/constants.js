/**
 * ============================================================
 * CORE / CONSTANTS
 * Famille TANAZEU - V2.0
 * 
 * Toutes les valeurs fixes de l'application.
 * Ces valeurs ne changent jamais et définissent les règles
 * métier fondamentales.
 * 
 * VERSION DÉFINITIVE - Liste officielle des membres
 * Mise à jour : 19 Juin 2026
 * ============================================================
 */

// --- MEMBRES DE LA FAMILLE (LISTE OFFICIELLE) ---
// 15 membres actifs
export const MEMBERS = [
    "ASSONFACK Gladice",
    "ASSONNA Rachelle",
    "AZEUFACK FLORENCE",
    "AZEUFACK NGUEFACK HERMAN",
    "ETIEUDEM GWLADYS",
    "ETIEUDEM NGUEFACK CYRILLE",
    "KENFACK ALBERTINE",
    "KENFACK CATHY NINA",
    "KENFACK Marie",
    "KENFACK Michel",
    "LEKEUZEU Hervé",
    "LEKEUZEU GUILAINE",
    "MANEFOUET SÉVERINE NADEGE",
    "NGUELEFACK Simon",
    "TEMPACK Anne"
];

// --- MONTANTS DES TONTINES ---
// Montant de la tontine rations (repas + boisson)
export const TONTINE_RATIONS = 1500;      // 800 repas + 700 boisson

// Montant de la tontine assiette (achat d'assiettes en fin d'année)
export const TONTINE_ASSIETTE = 1000;

// Prix d'une part de la tontine cotisation (valeur par défaut)
// Ce prix peut être modifié dynamiquement dans l'application
export const COTISATION_PART_PRICE = 10000;

// Montant par défaut du fonds de caisse (assurance)
export const FONDS_CAISSE_DEFAULT = 20000;

// --- STOCKAGE ---
// Clé utilisée dans localStorage pour sauvegarder l'état complet
export const STORAGE_KEY = "tanazuAppState";

// Clé pour l'export/import de l'historique (non utilisée directement)
export const HISTORY_EXPORT_KEY = "tanazuHistoryExport";

// --- OPTIONS POUR LE SELECTEUR DE PARTS (0 à 6) ---
// 0 = ne cotise pas
export const PART_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

// --- ANNÉE DE DÉBUT DE L'HISTORIQUE ---
export const HISTORY_START_YEAR = 2020;

// --- NOM DE LA FAMILLE (pour l'affichage) ---
export const FAMILY_NAME = "TANAZEU";