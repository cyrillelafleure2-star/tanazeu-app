/**
 * ============================================================
 * CORE / MODELS
 * Famille TANAZEU - V2.0
 * 
 * Définition de la structure de données (état) de l'application.
 * Contient la fonction qui génère l'état par défaut.
 * ============================================================
 */

import { MEMBERS, FONDS_CAISSE_DEFAULT } from './constants.js';

/**
 * Crée un état initial complet pour l'application.
 * Cette fonction est utilisée :
 * - Au premier démarrage
 * - Après une réinitialisation complète
 * - Comme base de fusion lors de l'import de données
 * 
 * @returns {Object} L'état initial par défaut
 */
export function createDefaultState() {
    // Initialisation des objets vides
    const presences = {};
    const parts = {};
    const scolaires = {};
    const congres = {};

    // Remplissage pour chaque membre
    MEMBERS.forEach(m => {
        presences[m] = true;          // Par défaut, tous sont présents
        parts[m] = 1;                 // Par défaut, 1 part de tontine cotisation
        scolaires[m] = 0;             // Par défaut, 0 F pour la caisse scolaire
        congres[m] = 0;               // Par défaut, 0 F pour le congrès
    });

    return {
        // --- DONNÉES FIXES ---
        members: [...MEMBERS],        // Copie de la liste des membres

        // --- PRÉSENCES ---
        presences: presences,         // { "Cyrille": true, ... }

        // --- TONTINE COTISATION (parts) ---
        parts: parts,                 // { "Cyrille": 1, "Hermann": 3, ... }

        // --- COTISATIONS LIBRES ---
        scolaires: scolaires,         // { "Cyrille": 0, "Hermann": 500, ... }
        congres: congres,             // { "Cyrille": 0, "Hermann": 1000, ... }

        // --- TONTINES FIXES (Rations & Assiettes) ---
        rationsCount: 10,             // Nombre de participants à la tontine rations
        assiettesCount: 10,           // Nombre de participants à la tontine assiette

        // --- FONDS DE CAISSE (assurance) ---
        fondsCaisse: FONDS_CAISSE_DEFAULT,  // 20 000 F par défaut

        // --- RECOUVREMENTS (historique des sorties) ---
        recouvrements: [],            // [ { montant: 20000, parMembre: 2223, date: "2026-06-20" }, ... ]

        // --- TONTINE GLOBALE (le "membre qui bouffe") ---
        tontineBeneficiaire: "",      // Nom du bénéficiaire, ou "" si non attribué

        // --- HÔTE DU MOIS ---
        hote: "Cyrille",              // Le membre qui héberge la réunion en cours

        // --- DATE DE LA SÉANCE EN COURS ---
        currentDate: new Date().toISOString().slice(0, 10), // Format YYYY-MM-DD

        // --- ARCHIVE (Historique des réunions passées) ---
        archive: []                   // [ { date: "2026-06-20", snapshot: { ... } }, ... ]
    };
}

/**
 * Crée une entrée d'archive à partir d'un état donné.
 * On exclut l'archive elle-même pour éviter une récursion infinie.
 * 
 * @param {Object} state - L'état complet de l'application
 * @param {string} date - La date de la réunion (format YYYY-MM-DD)
 * @returns {Object} Une entrée d'archive { date, snapshot }
 */
export function createArchiveEntry(state, date) {
    // On fait une copie profonde de l'état sans le champ "archive"
    const { archive, ...snapshot } = JSON.parse(JSON.stringify(state));
    return {
        date: date || state.currentDate || new Date().toISOString().slice(0, 10),
        snapshot: snapshot
    };
}

/**
 * Vérifie si un état est valide (structure minimale).
 * Utile pour les imports de données.
 * 
 * @param {Object} state - L'état à vérifier
 * @returns {boolean} True si l'état est valide
 */
export function isValidState(state) {
    if (!state || typeof state !== 'object') return false;
    if (!state.members || !Array.isArray(state.members)) return false;
    if (!state.presences || typeof state.presences !== 'object') return false;
    if (!state.parts || typeof state.parts !== 'object') return false;
    if (typeof state.fondsCaisse !== 'number') return false;
    if (!Array.isArray(state.archive)) return false;
    return true;
}

/**
 * Fusionne un état importé avec l'état par défaut.
 * Permet de combler les champs manquants lors d'un import.
 * 
 * @param {Object} importedState - L'état importé (JSON)
 * @returns {Object} L'état fusionné et valide
 */
export function mergeWithDefault(importedState) {
    const defaults = createDefaultState();
    const merged = { ...defaults, ...importedState };
    
    // S'assurer que tous les membres existent
    merged.members = [...defaults.members];
    
    // S'assurer que chaque membre a toutes ses propriétés
    defaults.members.forEach(m => {
        if (!(m in merged.presences)) merged.presences[m] = defaults.presences[m];
        if (!(m in merged.parts)) merged.parts[m] = defaults.parts[m];
        if (!(m in merged.scolaires)) merged.scolaires[m] = defaults.scolaires[m];
        if (!(m in merged.congres)) merged.congres[m] = defaults.congres[m];
    });
    
    // S'assurer que l'archive est un tableau
    if (!Array.isArray(merged.archive)) merged.archive = [];
    
    return merged;
}