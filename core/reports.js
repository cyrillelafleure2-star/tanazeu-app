/**
 * ============================================================
 * CORE / REPORTS
 * Famille TANAZEU - V2.0
 * 
 * Génération des rapports et synthèses annuelles.
 * Ces fonctions calculent les tableaux de bord à partir
 * des données archivées.
 * ============================================================
 */

import { MEMBERS } from './constants.js';
import { getPresentMembers, getPresentCount, computeTotals } from './calculators.js';

/**
 * Filtre les archives par période.
 * 
 * @param {Array} archive - Le tableau des réunions archivées
 * @param {string} startDate - Date de début (format YYYY-MM-DD)
 * @param {string} endDate - Date de fin (format YYYY-MM-DD)
 * @returns {Array} Les entrées d'archive filtrées
 */
export function filterArchiveByDate(archive, startDate, endDate) {
    if (!archive || archive.length === 0) return [];
    return archive.filter(entry => {
        return entry.date >= startDate && entry.date <= endDate;
    });
}

/**
 * Génère la synthèse complète pour une période donnée.
 * 
 * @param {Object} state - L'état complet de l'application
 * @param {string} startDate - Date de début (format YYYY-MM-DD)
 * @param {string} endDate - Date de fin (format YYYY-MM-DD)
 * @returns {Object} Un objet contenant toutes les synthèses
 */
export function generateSynthesis(state, startDate, endDate) {
    // Filtrer les archives par période
    const filteredArchive = filterArchiveByDate(state.archive, startDate, endDate);
    
    if (filteredArchive.length === 0) {
        return {
            empty: true,
            message: 'Aucune réunion trouvée pour cette période.'
        };
    }

    // Trier chronologiquement
    const sortedArchive = [...filteredArchive].sort((a, b) => a.date.localeCompare(b.date));

    // Générer les différents rapports
    const tontinePrincipale = generateTontinePrincipale(sortedArchive, startDate, endDate);
    const caisseRation = generateCaisseRation(sortedArchive);
    const caisseAssiettes = generateCaisseAssiettes(sortedArchive);
    const caisseScolaire = generateCaisseScolaire(sortedArchive);
    const congresFamilial = generateCongresFamilial(sortedArchive);
    const grandTableau = generateGrandTableau(
        caisseRation,
        caisseAssiettes,
        caisseScolaire,
        congresFamilial
    );

    return {
        empty: false,
        period: { startDate, endDate },
        tontinePrincipale,
        caisseRation,
        caisseAssiettes,
        caisseScolaire,
        congresFamilial,
        grandTableau
    };
}

// ============================================================
// 1. TONTINE PRINCIPALE
// ============================================================
function generateTontinePrincipale(archive, startDate, endDate) {
    // Extraire tous les mois de la période
    const months = getMonthsInPeriod(startDate, endDate);
    const members = MEMBERS;
    
    // Initialiser les données
    const data = {};
    members.forEach(m => {
        data[m] = {};
        months.forEach(month => {
            data[m][month] = 0;
        });
    });
    
    const monthlyTotals = {};
    const beneficiaries = {};
    months.forEach(month => {
        monthlyTotals[month] = 0;
        beneficiaries[month] = '';
    });

    // Remplir avec les données
    archive.forEach(entry => {
        const snap = entry.snapshot;
        const month = entry.date.slice(0, 7); // YYYY-MM
        if (!months.includes(month)) return;
        
        const present = getPresentMembers(snap);
        present.forEach(m => {
            const parts = snap.parts?.[m] || 0;
            const price = snap.cotisationPrice || 10000;
            const amount = parts * price;
            if (data[m]) {
                data[m][month] = (data[m][month] || 0) + amount;
            }
            monthlyTotals[month] = (monthlyTotals[month] || 0) + amount;
        });
        
        // Bénéficiaire
        if (snap.tontineBeneficiaire) {
            // Trouver le numéro du bénéficiaire
            const index = members.indexOf(snap.tontineBeneficiaire);
            if (index !== -1) {
                beneficiaries[month] = 'N°' + (index + 1);
            } else {
                beneficiaries[month] = snap.tontineBeneficiaire;
            }
        }
    });

    return {
        months,
        members,
        data,
        monthlyTotals,
        beneficiaries,
        totalGeneral: Object.values(monthlyTotals).reduce((a, b) => a + b, 0)
    };
}

// ============================================================
// 2. CAISSE RATION
// ============================================================
function generateCaisseRation(archive) {
    const members = [
        "LEKEUZEU Hervé",
        "ETIEUDEM NGUEFACK CYRILLE",
        "KENFACK ALBERTINE",
        "KENFACK CATHY NINA",
        "AZEUFACK NGUEFACK HERMAN",
        "AZEUFACK FLORENCE",
        "MANEFOUET SÉVERINE NADEGE"
    ];
    
    const months = [];
    const data = {};
    members.forEach(m => { data[m] = {}; });

    archive.forEach(entry => {
        const snap = entry.snapshot;
        const month = entry.date.slice(0, 7);
        if (!months.includes(month)) months.push(month);
        
        members.forEach(m => {
            const amount = 0;
            if (snap.rationParticipants && snap.rationParticipants[m]) {
                data[m][month] = 1500;
            } else {
                data[m][month] = 0;
            }
        });
    });

    months.sort();

    // Calculer les totaux mensuels et par membre
    const monthlyTotals = {};
    const memberTotals = {};
    members.forEach(m => { memberTotals[m] = 0; });
    months.forEach(month => { monthlyTotals[month] = 0; });

    members.forEach(m => {
        months.forEach(month => {
            const val = data[m][month] || 0;
            memberTotals[m] += val;
            monthlyTotals[month] = (monthlyTotals[month] || 0) + val;
        });
    });

    return {
        months,
        members,
        data,
        monthlyTotals,
        memberTotals,
        totalGeneral: Object.values(memberTotals).reduce((a, b) => a + b, 0)
    };
}

// ============================================================
// 3. CAISSE ASSIETTES
// ============================================================
function generateCaisseAssiettes(archive) {
    const members = [
        "LEKEUZEU Hervé",
        "ETIEUDEM NGUEFACK CYRILLE",
        "KENFACK ALBERTINE",
        "KENFACK CATHY NINA",
        "AZEUFACK NGUEFACK HERMAN",
        "ETIEUDEM GWLADYS",
        "AZEUFACK FLORENCE",
        "LEKEUZEU GUILAINE"
    ];
    
    const months = [];
    const data = {};
    members.forEach(m => { data[m] = {}; });

    archive.forEach(entry => {
        const snap = entry.snapshot;
        const month = entry.date.slice(0, 7);
        if (!months.includes(month)) months.push(month);
        
        members.forEach(m => {
            if (snap.assietteParticipants && snap.assietteParticipants[m]) {
                data[m][month] = 1000;
            } else {
                data[m][month] = 0;
            }
        });
    });

    months.sort();

    const monthlyTotals = {};
    const memberTotals = {};
    members.forEach(m => { memberTotals[m] = 0; });
    months.forEach(month => { monthlyTotals[month] = 0; });

    members.forEach(m => {
        months.forEach(month => {
            const val = data[m][month] || 0;
            memberTotals[m] += val;
            monthlyTotals[month] = (monthlyTotals[month] || 0) + val;
        });
    });

    return {
        months,
        members,
        data,
        monthlyTotals,
        memberTotals,
        totalGeneral: Object.values(memberTotals).reduce((a, b) => a + b, 0)
    };
}

// ============================================================
// 4. CAISSE SCOLAIRE
// ============================================================
function generateCaisseScolaire(archive) {
    const members = [
        "LEKEUZEU Hervé",
        "ETIEUDEM NGUEFACK CYRILLE",
        "KENFACK ALBERTINE",
        "KENFACK CATHY NINA",
        "AZEUFACK NGUEFACK HERMAN",
        "AZEUFACK FLORENCE",
        "ETIEUDEM GWLADYS"
    ];
    
    const months = [];
    const data = {};
    members.forEach(m => { data[m] = {}; });

    archive.forEach(entry => {
        const snap = entry.snapshot;
        const month = entry.date.slice(0, 7);
        if (!months.includes(month)) months.push(month);
        
        members.forEach(m => {
            const val = snap.scolaires?.[m] || 0;
            data[m][month] = val;
        });
    });

    months.sort();

    const monthlyTotals = {};
    const memberTotals = {};
    members.forEach(m => { memberTotals[m] = 0; });
    months.forEach(month => { monthlyTotals[month] = 0; });

    members.forEach(m => {
        months.forEach(month => {
            const val = data[m][month] || 0;
            memberTotals[m] += val;
            monthlyTotals[month] = (monthlyTotals[month] || 0) + val;
        });
    });

    return {
        months,
        members,
        data,
        monthlyTotals,
        memberTotals,
        totalGeneral: Object.values(memberTotals).reduce((a, b) => a + b, 0)
    };
}

// ============================================================
// 5. CONGRÈS FAMILIAL
// ============================================================
function generateCongresFamilial(archive) {
    const members = [
        "LEKEUZEU Hervé",
        "ETIEUDEM NGUEFACK CYRILLE",
        "KENFACK ALBERTINE",
        "KENFACK CATHY NINA",
        "AZEUFACK NGUEFACK HERMAN",
        "AZEUFACK FLORENCE"
    ];
    
    const months = [];
    const data = {};
    members.forEach(m => { data[m] = {}; });

    archive.forEach(entry => {
        const snap = entry.snapshot;
        const month = entry.date.slice(0, 7);
        if (!months.includes(month)) months.push(month);
        
        members.forEach(m => {
            const val = snap.congres?.[m] || 0;
            data[m][month] = val;
        });
    });

    months.sort();

    const monthlyTotals = {};
    const memberTotals = {};
    members.forEach(m => { memberTotals[m] = 0; });
    months.forEach(month => { monthlyTotals[month] = 0; });

    members.forEach(m => {
        months.forEach(month => {
            const val = data[m][month] || 0;
            memberTotals[m] += val;
            monthlyTotals[month] = (monthlyTotals[month] || 0) + val;
        });
    });

    return {
        months,
        members,
        data,
        monthlyTotals,
        memberTotals,
        totalGeneral: Object.values(memberTotals).reduce((a, b) => a + b, 0)
    };
}

// ============================================================
// 6. GRAND TABLEAU RÉCAPITULATIF
// ============================================================
function generateGrandTableau(ration, assiettes, scolaire, congres) {
    const allMembers = new Set();
    
    // Collecter tous les membres uniques
    ration.members.forEach(m => allMembers.add(m));
    assiettes.members.forEach(m => allMembers.add(m));
    scolaire.members.forEach(m => allMembers.add(m));
    congres.members.forEach(m => allMembers.add(m));
    
    const members = Array.from(allMembers);
    const result = {};
    
    members.forEach(m => {
        result[m] = {
            ration: ration.memberTotals?.[m] || 0,
            assiettes: assiettes.memberTotals?.[m] || 0,
            scolaire: scolaire.memberTotals?.[m] || 0,
            congres: congres.memberTotals?.[m] || 0,
            total: 0
        };
        result[m].total = result[m].ration + result[m].assiettes + result[m].scolaire + result[m].congres;
    });
    
    const totalGeneral = Object.values(result).reduce((sum, m) => sum + m.total, 0);
    
    return {
        members,
        data: result,
        totalGeneral
    };
}

// ============================================================
// 7. UTILITAIRES
// ============================================================
function getMonthsInPeriod(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        months.push(`${year}-${month}`);
        current.setMonth(current.getMonth() + 1);
    }
    return months;
}