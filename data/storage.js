/**
 * ============================================================
 * DATA / STORAGE
 * Famille TANAZEU - V2.0
 * 
 * Gestion de la persistance des données :
 * - Chargement / Sauvegarde dans localStorage
 * - Export / Import en JSON (pour le passage de relais)
 * - Archivage des réunions
 * - Gestion de l'historique
 * 
 * VERSION AVEC AUTOMATISATION TRÉSORERIE
 * ============================================================
 */

import { STORAGE_KEY } from '../core/constants.js';
import {
    createDefaultState,
    createArchiveEntry,
    mergeWithDefault,
    isValidState,
    computeTreasuryFlows
} from '../core/models.js';

export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (isValidState(parsed)) {
                return mergeWithDefault(parsed);
            } else {
                console.warn("État stocké invalide, réinitialisation.");
                return createDefaultState();
            }
        }
    } catch (e) {
        console.warn("Erreur lors du chargement de l'état:", e);
    }
    return createDefaultState();
}

export function saveState(state) {
    try {
        const json = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, json);
    } catch (e) {
        console.error("Erreur lors de la sauvegarde:", e);
        try {
            const { archive, ...stateWithoutArchive } = state;
            const json = JSON.stringify(stateWithoutArchive);
            localStorage.setItem(STORAGE_KEY, json);
            console.warn("Sauvegarde effectuée sans l'archive (trop volumineuse)");
        } catch (e2) {
            console.error("Échec critique de la sauvegarde:", e2);
        }
    }
}

/**
 * Archive la session en cours ET met à jour les soldes de trésorerie.
 * Cette fonction est utilisée pour les nouvelles archives (bouton "Archiver").
 * 
 * @param {Object} state - L'état complet de l'application
 * @param {string} date - La date de la séance (optionnel)
 * @returns {Object} Le nouvel état avec l'archive et les soldes mis à jour
 */
export function archiveCurrentSessionWithFlows(state, date) {
    const archiveDate = date || state.currentDate || new Date().toISOString().slice(0, 10);

    // 1. Calculer les flux
    const flows = computeTreasuryFlows(state);

    // 2. Mettre à jour les soldes des caisses
    if (!state.balances) state.balances = {};
    state.balances.assiette = (state.balances.assiette || 0) + flows.assiette;
    state.balances.scolaire = (state.balances.scolaire || 0) + flows.scolaire;
    state.balances.congres = (state.balances.congres || 0) + flows.congres;
    state.balances.fonds = flows.fonds; // le fonds actuel est stocké (pas additionné, c'est un solde)

    // 3. Ajouter des transferts automatiques dans l'historique des transferts
    if (!state.transferHistory) state.transferHistory = [];
    const transferEntries = [];

    if (flows.assiette > 0) {
        transferEntries.push({
            date: archiveDate,
            from: 'Tontine assiette (séance)',
            to: 'Caisse Assiette',
            amount: flows.assiette,
            rubrique: 'Assiette'
        });
    }
    if (flows.scolaire > 0) {
        transferEntries.push({
            date: archiveDate,
            from: 'Cotisations scolaires (séance)',
            to: 'Caisse Scolaire',
            amount: flows.scolaire,
            rubrique: 'Scolaire'
        });
    }
    if (flows.congres > 0) {
        transferEntries.push({
            date: archiveDate,
            from: 'Cotisations congrès (séance)',
            to: 'Caisse Congrès',
            amount: flows.congres,
            rubrique: 'Congrès'
        });
    }
    // On n'ajoute pas de transfert pour le fonds car c'est un solde, pas un flux.

    state.transferHistory.push(...transferEntries);

    // 4. Créer l'entrée d'archive
    const entry = createArchiveEntry(state, archiveDate);
    state.archive.push(entry);

    // 5. Sauvegarder
    saveState(state);

    return state;
}

/**
 * Archive la session sans mettre à jour les soldes (pour l'import d'historique).
 * Cette fonction est utilisée lors de l'import d'un fichier JSON d'historique.
 * 
 * @param {Object} state - L'état complet de l'application
 * @param {string} date - La date de la séance (optionnel)
 * @returns {Object} Le nouvel état avec l'archive ajoutée
 */
export function archiveCurrentSession(state, date) {
    const archiveDate = date || state.currentDate || new Date().toISOString().slice(0, 10);
    const entry = createArchiveEntry(state, archiveDate);
    state.archive.push(entry);
    saveState(state);
    return state;
}

export function exportStateToJSON(state, includeArchive = true) {
    if (includeArchive) {
        return JSON.stringify(state, null, 2);
    } else {
        const { archive, ...stateWithoutArchive } = state;
        return JSON.stringify(stateWithoutArchive, null, 2);
    }
}

export function exportHistoryToJSON(state) {
    const historyData = {
        familyName: "TANAZEU",
        exportDate: new Date().toISOString().slice(0, 10),
        archive: state.archive || [],
        members: state.members || []
    };
    return JSON.stringify(historyData, null, 2);
}

export function importStateFromJSON(jsonStr, currentState) {
    try {
        const imported = JSON.parse(jsonStr);
        if (!isValidState(imported)) {
            throw new Error("Structure JSON invalide");
        }
        const merged = mergeWithDefault(imported);
        if (currentState && currentState.archive) {
            const existingDates = new Set(currentState.archive.map(e => e.date));
            const newEntries = imported.archive.filter(e => !existingDates.has(e.date));
            merged.archive = [...currentState.archive, ...newEntries];
        }
        return merged;
    } catch (e) {
        throw new Error("Erreur d'import: " + e.message);
    }
}

export function importHistoryFromJSON(jsonStr, currentState) {
    try {
        const imported = JSON.parse(jsonStr);
        if (!imported.archive || !Array.isArray(imported.archive)) {
            throw new Error("Structure d'historique invalide");
        }
        const existingDates = new Set((currentState.archive || []).map(e => e.date));
        const newEntries = imported.archive.filter(e => !existingDates.has(e.date));
        const mergedState = { ...currentState };
        mergedState.archive = [...(currentState.archive || []), ...newEntries];
        return mergedState;
    } catch (e) {
        throw new Error("Erreur d'import d'historique: " + e.message);
    }
}

export function resetAllData() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log("🗑️ Données réinitialisées");
    } catch (e) {
        console.error("Erreur lors de la réinitialisation:", e);
    }
    return createDefaultState();
}

export function hasSavedData() {
    return localStorage.getItem(STORAGE_KEY) !== null;
}

export function backupState(state) {
    try {
        const backupKey = STORAGE_KEY + "_backup";
        localStorage.setItem(backupKey, JSON.stringify(state));
    } catch (e) {
        console.warn("Erreur lors de la sauvegarde de secours:", e);
    }
}

export function restoreBackup() {
    try {
        const backupKey = STORAGE_KEY + "_backup";
        const raw = localStorage.getItem(backupKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (isValidState(parsed)) {
                return mergeWithDefault(parsed);
            }
        }
    } catch (e) {
        console.warn("Erreur lors de la restauration de la sauvegarde:", e);
    }
    return null;
}