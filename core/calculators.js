/**
 * ============================================================
 * CORE / CALCULATORS
 * Famille TANAZEU - V2.0
 * 
 * Fonctions pures de calcul métier.
 * Ces fonctions ne modifient pas l'état, elles retournent
 * simplement des valeurs calculées à partir de l'état.
 * 
 * VERSION FINALE - Prise en compte des parts 0 et des participations individuelles
 * ============================================================
 */

import {
    TONTINE_RATIONS,
    TONTINE_ASSIETTE,
    COTISATION_PART_PRICE
} from './constants.js';

/**
 * Retourne la liste des membres présents.
 * 
 * @param {Object} state - L'état complet de l'application
 * @returns {string[]} Tableau des noms des membres présents
 */
export function getPresentMembers(state) {
    return state.members.filter(m => state.presences[m] === true);
}

/**
 * Retourne le nombre de membres présents.
 * 
 * @param {Object} state - L'état complet de l'application
 * @returns {number} Nombre de membres présents
 */
export function getPresentCount(state) {
    return getPresentMembers(state).length;
}

/**
 * Calcule tous les totaux de la réunion.
 * Utilise le prix de la part stocké dans l'état (ou la constante par défaut).
 * 
 * @param {Object} state - L'état complet de l'application
 * @returns {Object} Un objet contenant tous les totaux calculés
 */
export function computeTotals(state) {
    const present = getPresentMembers(state);

    // --- Sommes par membre ---
    let totalScolaire = 0;
    let totalCongres = 0;
    let totalParts = 0;
    let rationCount = 0;
    let assietteCount = 0;

    present.forEach(m => {
        totalScolaire += (state.scolaires[m] || 0);
        totalCongres += (state.congres[m] || 0);
        totalParts += (state.parts[m] || 0);   // 0 si l'utilisateur a choisi 0 part

        if (state.rationParticipants && state.rationParticipants[m]) {
            rationCount++;
        }
        if (state.assietteParticipants && state.assietteParticipants[m]) {
            assietteCount++;
        }
    });

    // --- Tontines fixes ---
    const totalRations = rationCount * TONTINE_RATIONS;
    const totalAssiettes = assietteCount * TONTINE_ASSIETTE;

    // --- Tontine cotisation avec prix dynamique ---
    const pricePerPart = state.cotisationPrice || COTISATION_PART_PRICE;
    const totalCotisation = totalParts * pricePerPart;

    // --- Grand total (somme de toutes les tontines) ---
    const grandTotal = totalRations + totalAssiettes + totalCotisation + totalScolaire + totalCongres;

    return {
        presentCount: present.length,
        totalScolaire: totalScolaire,
        totalCongres: totalCongres,
        totalParts: totalParts,
        totalRations: totalRations,
        totalAssiettes: totalAssiettes,
        totalCotisation: totalCotisation,
        grandTotal: grandTotal,
        fondsCaisse: state.fondsCaisse || 0,
        tontineBeneficiaire: state.tontineBeneficiaire || "Non attribué",
        cotisationPrice: pricePerPart,
        rationCount: rationCount,
        assietteCount: assietteCount
    };
}

/**
 * Calcule le montant à recouvrer par membre présent.
 * La division est arrondie au supérieur (pour ne pas perdre d'argent).
 * 
 * @param {number} totalAmount - Le montant total à répartir (ex: 20000 F)
 * @param {number} presentCount - Le nombre de membres présents
 * @returns {number} Le montant arrondi au supérieur par membre
 */
export function calculateRecoveryPerMember(totalAmount, presentCount) {
    if (presentCount === 0) return 0;
    if (totalAmount <= 0) return 0;
    return Math.ceil(totalAmount / presentCount);
}

/**
 * Calcule le solde du fonds de caisse après un recouvrement.
 * 
 * @param {number} currentFonds - Le solde actuel du fonds
 * @param {number} amountToRecover - Le montant à répartir (sorti du fonds)
 * @returns {number} Le nouveau solde du fonds
 */
export function calculateNewFondsBalance(currentFonds, amountToRecover) {
    return (currentFonds || 0) - amountToRecover;
}

/**
 * Calcule le total des parts pour un membre donné.
 * Utilisé pour l'affichage détaillé.
 * 
 * @param {Object} state - L'état complet de l'application
 * @param {string} memberName - Le nom du membre
 * @returns {number} Le nombre de parts de ce membre
 */
export function getMemberParts(state, memberName) {
    return state.parts[memberName] || 0;
}

/**
 * Calcule le montant total de la tontine cotisation pour un membre.
 * Utilise le prix de la part stocké dans l'état.
 * 
 * @param {Object} state - L'état complet de l'application
 * @param {string} memberName - Le nom du membre
 * @returns {number} Le montant total pour ce membre (parts * prix)
 */
export function getMemberCotisationTotal(state, memberName) {
    const parts = getMemberParts(state, memberName);
    const pricePerPart = state.cotisationPrice || COTISATION_PART_PRICE;
    return parts * pricePerPart;
}

/**
 * Vérifie si tous les membres sont présents.
 * 
 * @param {Object} state - L'état complet de l'application
 * @returns {boolean} True si tous les membres sont présents
 */
export function areAllMembersPresent(state) {
    return state.members.every(m => state.presences[m] === true);
}

/**
 * Retourne le nombre de membres absents.
 * 
 * @param {Object} state - L'état complet de l'application
 * @returns {number} Le nombre de membres absents
 */
export function getAbsentCount(state) {
    return state.members.length - getPresentCount(state);
}

/**
 * Retourne la liste des membres absents.
 * 
 * @param {Object} state - L'état complet de l'application
 * @returns {string[]} Tableau des noms des membres absents
 */
export function getAbsentMembers(state) {
    return state.members.filter(m => state.presences[m] !== true);
}

/**
 * Calcule le nombre total de réunions archivées.
 * 
 * @param {Object} state - L'état complet de l'application
 * @returns {number} Le nombre d'entrées dans l'archive
 */
export function getArchiveCount(state) {
    return (state.archive || []).length;
}

/**
 * Trie les archives par date (ordre chronologique).
 * 
 * @param {Object} state - L'état complet de l'application
 * @param {boolean} ascending - True pour ordre croissant, False pour décroissant
 * @returns {Array} Tableau trié des entrées d'archive
 */
export function getSortedArchive(state, ascending = true) {
    const archive = state.archive || [];
    const sorted = [...archive].sort((a, b) => {
        return a.date.localeCompare(b.date);
    });
    return ascending ? sorted : sorted.reverse();
}