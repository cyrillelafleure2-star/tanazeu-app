/**
 * ============================================================
 * CORE / MODELS
 * Famille TANAZEU - V2.0
 * ============================================================
 */

import { MEMBERS, FONDS_CAISSE_DEFAULT, COTISATION_PART_PRICE } from './constants.js';

export function createDefaultState() {
    const presences = {};
    const parts = {};
    const scolaires = {};
    const congres = {};
    const rationParticipants = {};
    const assietteParticipants = {};

    MEMBERS.forEach(m => {
        presences[m] = true;
        parts[m] = 1;
        scolaires[m] = 0;
        congres[m] = 0;
        rationParticipants[m] = true;
        assietteParticipants[m] = true;
    });

    return {
        members: [...MEMBERS],
        presences: presences,
        parts: parts,
        cotisationPrice: COTISATION_PART_PRICE,
        scolaires: scolaires,
        congres: congres,
        rationParticipants: rationParticipants,
        assietteParticipants: assietteParticipants,
        fondsCaisse: FONDS_CAISSE_DEFAULT,
        recouvrements: [],
        tontineBeneficiaire: "",
        hote: "ETIEUDEM NGUEFACK CYRILLE",
        currentDate: new Date().toISOString().slice(0, 10),
        archive: [],
        treasurer: "ETIEUDEM NGUEFACK CYRILLE",
        nextHost: "ASSONFACK Gladice",
        familyHead: "LEKEUZEU Hervé",
        balances: {
            assiette: 0,
            scolaire: 0,
            congres: 0,
            fonds: 20000,
            general: 0,
            ration: 0
        },
        boissonExpense: 0,
        transferHistory: [],
        decisions: ""  // NOUVEAU
    };
}

export function createArchiveEntry(state, date) {
    const { archive, ...snapshot } = JSON.parse(JSON.stringify(state));
    return {
        date: date || state.currentDate || new Date().toISOString().slice(0, 10),
        snapshot: snapshot
    };
}

import { getPresentMembers } from './calculators.js';

export function computeTreasuryFlows(state) {
    const present = getPresentMembers(state);
    let totalScolaire = 0, totalCongres = 0, totalParts = 0;
    let assietteCount = 0;

    present.forEach(m => {
        totalScolaire += (state.scolaires[m] || 0);
        totalCongres += (state.congres[m] || 0);
        totalParts += (state.parts[m] || 0);
        if (state.assietteParticipants?.[m]) assietteCount++;
    });

    const totalAssiettes = assietteCount * 1000;

    return {
        assiette: totalAssiettes,
        scolaire: totalScolaire,
        congres: totalCongres,
        fonds: state.fondsCaisse || 0
    };
}

export function isValidState(state) {
    if (!state || typeof state !== 'object') return false;
    if (!state.members || !Array.isArray(state.members)) return false;
    if (!state.presences || typeof state.presences !== 'object') return false;
    if (!state.parts || typeof state.parts !== 'object') return false;
    if (typeof state.fondsCaisse !== 'number') return false;
    if (!Array.isArray(state.archive)) return false;
    return true;
}

export function mergeWithDefault(importedState) {
    const defaults = createDefaultState();
    const merged = { ...defaults, ...importedState };
    
    merged.members = [...defaults.members];
    defaults.members.forEach(m => {
        if (!(m in merged.presences)) merged.presences[m] = defaults.presences[m];
        if (!(m in merged.parts)) merged.parts[m] = defaults.parts[m];
        if (!(m in merged.scolaires)) merged.scolaires[m] = defaults.scolaires[m];
        if (!(m in merged.congres)) merged.congres[m] = defaults.congres[m];
        if (!(m in merged.rationParticipants)) merged.rationParticipants[m] = defaults.rationParticipants[m];
        if (!(m in merged.assietteParticipants)) merged.assietteParticipants[m] = defaults.assietteParticipants[m];
    });
    
    if (!merged.cotisationPrice || typeof merged.cotisationPrice !== 'number') {
        merged.cotisationPrice = defaults.cotisationPrice;
    }
    if (!Array.isArray(merged.archive)) merged.archive = [];
    if (!merged.treasurer) merged.treasurer = defaults.treasurer;
    if (!merged.nextHost) merged.nextHost = defaults.nextHost;
    if (!merged.familyHead) merged.familyHead = defaults.familyHead;
    if (!merged.balances || typeof merged.balances !== 'object') {
        merged.balances = { ...defaults.balances };
    }
    if (!merged.transferHistory || !Array.isArray(merged.transferHistory)) {
        merged.transferHistory = [];
    }
    if (typeof merged.boissonExpense !== 'number') {
        merged.boissonExpense = 0;
    }
    if (typeof merged.decisions !== 'string') {   // NOUVEAU
        merged.decisions = '';
    }
    
    return merged;
}