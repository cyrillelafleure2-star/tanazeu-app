/**
 * ============================================================
 * UI / RENDER
 * Famille TANAZEU - V2.0
 * 
 * Toutes les fonctions d'affichage (rendu DOM).
 * Ces fonctions ne font QUE de l'affichage :
 * - Elles lisent l'état
 * - Elles génèrent du HTML
 * - Elles mettent à jour le DOM
 * 
 * VERSION AVEC SYNTHÈSE ANNUELLE
 * ============================================================
 */

import {
    getPresentMembers,
    getPresentCount,
    computeTotals,
    calculateRecoveryPerMember,
    getMemberParts,
    getSortedArchive
} from '../core/calculators.js';

import {
    TONTINE_RATIONS,
    TONTINE_ASSIETTE,
    COTISATION_PART_PRICE,
    PART_OPTIONS,
    MEMBERS
} from '../core/constants.js';

// ============================================================
// ÉTAT LOCAL POUR LA NAVIGATION DANS L'HISTORIQUE
// ============================================================
let currentDetailIndex = -1;

export function setDetailIndex(index) {
    currentDetailIndex = index;
}

export function getDetailIndex() {
    return currentDetailIndex;
}

// ============================================================
// RENDU PRINCIPAL
// ============================================================
export function renderAll(state) {
    renderHote(state);
    renderDate(state);
    renderChecklist(state);
    renderLibreCotisations(state);
    renderParticipationToggles(state);
    renderPartsSelect(state);
    renderFondsCaisse(state);
    renderRecouvrementListe(state);
    renderBeneficiaireSelect(state);
    renderRecap(state);
    renderArchive(state);
    renderTreasury(state);
    renderStats(state);
    renderSynthesis(state);          // NOUVEAU
    updateTotalsDisplay(state);
    renderCotisationPrice(state);
    renderDecisions(state);
}

// ============================================================
// RENDU SPÉCIFIQUE
// ============================================================
export function renderCotisationPrice(state) {
    const priceInput = document.getElementById('cotisationPriceInput');
    const priceDisplay = document.getElementById('currentPriceDisplay');
    const price = state.cotisationPrice || COTISATION_PART_PRICE;
    if (priceInput) priceInput.value = price;
    if (priceDisplay) priceDisplay.innerText = price.toLocaleString();
}

export function renderHote(state) {
    const el = document.getElementById('hoteDisplay');
    if (el) el.innerText = 'Hôte : ' + (state.hote || 'à définir');
}

export function renderDate(state) {
    const el = document.getElementById('sessionDateInput');
    if (el) el.value = state.currentDate || new Date().toISOString().slice(0, 10);
}

export function renderChecklist(state) {
    const container = document.getElementById('checklistContainer');
    if (!container) return;
    container.innerHTML = '';
    state.members.forEach(m => {
        const checked = state.presences[m] ? 'checked' : '';
        container.innerHTML += `
            <div class="member-row">
                <div class="member-check">
                    <input type="checkbox" id="presence_${m}" ${checked}>
                    <label for="presence_${m}">${m}</label>
                </div>
            </div>
        `;
    });
}

export function renderLibreCotisations(state) {
    const container = document.getElementById('libreCotisationContainer');
    const resumeBox = document.getElementById('resumeLibreBox');
    if (!container || !resumeBox) return;
    const present = getPresentMembers(state);
    container.innerHTML = '';
    if (present.length === 0) {
        container.innerHTML = "<p style='color:#888;'>Aucun membre présent.</p>";
        resumeBox.innerHTML = '📚 Scolaire total : <strong>0</strong> F<br>🏛️ Congrès total : <strong>0</strong> F';
        return;
    }
    present.forEach(m => {
        container.innerHTML += `
            <div class="totaux-box" style="margin-bottom:10px;">
                <strong>${m}</strong>
                <div class="member-row">
                    <span style="flex:1;">Scolaire (F)</span>
                    <input type="number" id="scol_${m}" value="${state.scolaires[m] || 0}" step="500" style="flex:2;">
                </div>
                <div class="member-row">
                    <span style="flex:1;">Congrès (F)</span>
                    <input type="number" id="cong_${m}" value="${state.congres[m] || 0}" step="500" style="flex:2;">
                </div>
            </div>
        `;
    });
    const totals = computeTotals(state);
    resumeBox.innerHTML = `
        📚 Scolaire total : <strong>${totals.totalScolaire}</strong> F<br>
        🏛️ Congrès total : <strong>${totals.totalCongres}</strong> F
    `;
}

export function renderParticipationToggles(state) {
    const container = document.getElementById('participationContainer');
    if (!container) return;
    const present = getPresentMembers(state);
    container.innerHTML = '';
    if (present.length === 0) {
        container.innerHTML = "<p style='color:#888;'>Aucun membre présent.</p>";
        return;
    }
    present.forEach(m => {
        const rationChecked = state.rationParticipants?.[m] ? 'checked' : '';
        const assietteChecked = state.assietteParticipants?.[m] ? 'checked' : '';
        container.innerHTML += `
            <div class="member-row">
                <span class="member-name">${m}</span>
                <label style="flex:1; display:flex; align-items:center; gap:6px;">
                    <input type="checkbox" id="ration_${m}" ${rationChecked}> Ration (1500 F)
                </label>
                <label style="flex:1; display:flex; align-items:center; gap:6px;">
                    <input type="checkbox" id="assiette_${m}" ${assietteChecked}> Assiette (1000 F)
                </label>
            </div>
        `;
    });
}

export function renderPartsSelect(state) {
    const container = document.getElementById('partsSelectContainer');
    if (!container) return;
    const currentPrice = state.cotisationPrice || COTISATION_PART_PRICE;
    const present = getPresentMembers(state);
    container.innerHTML = '';
    const priceInfo = document.createElement('div');
    priceInfo.style.cssText = 'background: #e3f2fd; padding: 8px 14px; border-radius: 20px; margin-bottom: 12px; font-size:0.9rem;';
    priceInfo.innerHTML = `💵 Prix de la part : <strong>${currentPrice.toLocaleString()}</strong> F (0 = ne cotise pas)`;
    container.appendChild(priceInfo);
    if (present.length === 0) {
        container.innerHTML += "<p style='color:#888;'>Aucun membre présent.</p>";
        return;
    }
    present.forEach(m => {
        const currentVal = state.parts[m] || 0;
        let options = '';
        PART_OPTIONS.forEach(p => {
            const selected = (p === currentVal) ? 'selected' : '';
            const label = p === 0 ? '0 (ne cotise pas)' : `${p} part${p>1?'s':''} (${(p * currentPrice).toLocaleString()} F)`;
            options += `<option value="${p}" ${selected}>${label}</option>`;
        });
        container.innerHTML += `
            <div class="member-row">
                <span class="member-name">${m}</span>
                <select id="parts_${m}" class="member-input">${options}</select>
            </div>
        `;
    });
}

export function renderFondsCaisse(state) {
    const display = document.getElementById('fondsCaisseDisplay');
    if (display) display.innerText = state.fondsCaisse || 0;
    const montantInput = document.getElementById('recouvrementMontantInput');
    const montant = parseInt(montantInput?.value) || 0;
    const presentCount = getPresentCount(state);
    const perMember = calculateRecoveryPerMember(montant, presentCount);
    const perMemberDisplay = document.getElementById('recouvrementParMembreDisplay');
    if (perMemberDisplay) perMemberDisplay.innerText = perMember;
}

export function renderRecouvrementListe(state) {
    const container = document.getElementById('recouvrementListeContainer');
    if (!container) return;
    if (!state.recouvrements || state.recouvrements.length === 0) {
        container.innerHTML = "<span style='color:#888;'>Aucun recouvrement planifié.</span>";
        return;
    }
    let html = '';
    state.recouvrements.forEach(op => {
        html += `
            <div style="background:#f0f2ea; padding:8px 14px; border-radius:30px; margin-bottom:6px;">
                📌 ${op.montant} F à répartir → <strong>${op.parMembre} F</strong> / membre
                ${op.date ? ` (${op.date})` : ''}
            </div>
        `;
    });
    container.innerHTML = html;
}

export function renderBeneficiaireSelect(state) {
    const select = document.getElementById('beneficiaireSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Sélectionner --</option>';
    const present = getPresentMembers(state);
    present.forEach(m => {
        const selected = (state.tontineBeneficiaire === m) ? 'selected' : '';
        select.innerHTML += `<option value="${m}" ${selected}>${m}</option>`;
    });
}

export function renderDecisions(state) {
    const textarea = document.getElementById('decisionsTextarea');
    if (textarea) {
        textarea.value = state.decisions || '';
    }
}

export function renderRecap(state) {
    const container = document.getElementById('recapContainer');
    if (!container) return;
    const totals = computeTotals(state);
    const present = getPresentMembers(state);
    const absents = state.members.filter(m => !state.presences[m]);
    let partsDetails = '';
    present.forEach(m => {
        const parts = getMemberParts(state, m);
        const ration = state.rationParticipants?.[m] ? '✅' : '❌';
        const assiette = state.assietteParticipants?.[m] ? '✅' : '❌';
        const partLabel = parts === 0 ? '❌ ne cotise pas' : `${parts} part${parts>1?'s':''}`;
        partsDetails += `${m} (${partLabel}) R:${ration} A:${assiette} `;
    });
    let absentDetails = 'Aucun';
    if (absents.length > 0) absentDetails = absents.join(', ');
    
    const decisionsHtml = state.decisions ? `
        <div style="margin-top:12px;padding:12px;background:#fff8e1;border-radius:12px;border-left:4px solid #f57c00;">
            <strong>📝 Décisions importantes :</strong><br>${state.decisions.replace(/\n/g, '<br>')}
        </div>
    ` : '';

    container.innerHTML = `
        <div class="recap-line"><span>📅 Date</span> <strong>${state.currentDate || 'Non définie'}</strong></div>
        <div class="recap-line"><span>👥 Présents</span> <strong>${present.length} / ${state.members.length}</strong></div>
        <div class="recap-line"><span>👤 Absents</span> <strong>${absentDetails}</strong></div>
        <div class="recap-line"><span>🍽️ Rations</span> <strong>${totals.totalRations} F</strong></div>
        <div class="recap-line"><span>🍽️ Assiettes</span> <strong>${totals.totalAssiettes} F</strong></div>
        <div class="recap-line"><span>📚 Scolaire</span> <strong>${totals.totalScolaire} F</strong></div>
        <div class="recap-line"><span>🏛️ Congrès</span> <strong>${totals.totalCongres} F</strong></div>
        <div class="recap-line"><span>🔄 Tontine cotisation</span> <strong>${totals.totalCotisation} F</strong> (${totals.cotisationPrice} F/part)</div>
        <div class="recap-line"><span>💰 Grand total</span> <strong style="font-size:1.2rem; color:#1b5e20;">${totals.grandTotal} F</strong></div>
        <div class="recap-line"><span>🛡️ Fonds de caisse</span> <strong>${state.fondsCaisse} F</strong></div>
        <div class="recap-line"><span>🏆 Tontine attribuée à</span> <strong>${state.tontineBeneficiaire || 'Pas encore'}</strong></div>
        <div style="margin-top:12px;font-size:0.85rem;background:#f6f8f3;padding:10px 14px;border-radius:14px;">
            <strong>Détail des participations :</strong><br>${partsDetails}
        </div>
        ${decisionsHtml}
    `;
}

// ============================================================
// HISTORIQUE : LISTE + DÉTAIL
// ============================================================
export function renderArchive(state) {
    const container = document.getElementById('archiveContainer');
    if (!container) return;
    const actions = document.getElementById('archiveActions');

    if (currentDetailIndex >= 0 && currentDetailIndex < state.archive.length) {
        renderArchiveDetail(state, currentDetailIndex);
        if (actions) actions.style.display = 'none';
        return;
    }

    if (actions) actions.style.display = 'block';
    const archive = getSortedArchive(state, true);
    if (archive.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:20px; color:#888;">
                <p style="font-size:2rem; margin-bottom:8px;">📭</p>
                <p>Aucune réunion archivée.</p>
                <p style="font-size:0.85rem;">Archiver une séance depuis l'onglet "Récap & Export".</p>
            </div>
        `;
        return;
    }
    let html = `
        <div style="margin-bottom:12px;">
            <span class="badge">📊 ${archive.length} réunion(s) archivée(s)</span>
        </div>
        <table>
            <thead>
                <tr><th>📅 Date</th><th>👥 Présents</th><th>💰 Cotisation</th><th>🛡️ Fonds</th><th>🏆 Bénéficiaire</th></tr>
            </thead>
            <tbody>
    `;
    archive.forEach(entry => {
        const snap = entry.snapshot;
        const totals = computeTotals(snap);
        const benef = snap.tontineBeneficiaire || '—';
        const realIndex = state.archive.indexOf(entry);
        html += `
            <tr class="clickable-row" data-index="${realIndex}" style="cursor:pointer; transition:background 0.2s;">
                <td><strong>${entry.date}</strong></td>
                <td>${getPresentCount(snap)}</td>
                <td>${totals.totalCotisation} F</td>
                <td>${snap.fondsCaisse} F</td>
                <td>${benef}</td>
            </tr>
        `;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;

    container.querySelectorAll('.clickable-row').forEach(row => {
        row.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            if (!isNaN(idx)) {
                currentDetailIndex = idx;
                renderArchive(state);
            }
        });
    });
}

export function renderArchiveDetail(state, index) {
    const container = document.getElementById('archiveContainer');
    if (!container) return;
    const actions = document.getElementById('archiveActions');
    if (actions) actions.style.display = 'none';

    const entry = state.archive[index];
    if (!entry) {
        currentDetailIndex = -1;
        renderArchive(state);
        return;
    }
    const snap = entry.snapshot;
    const totals = computeTotals(snap);
    const present = getPresentMembers(snap);
    const absents = snap.members.filter(m => !snap.presences[m]);
    
    const decisions = snap.decisions ? `
        <div style="margin-top:12px;padding:12px;background:#fff8e1;border-radius:12px;border-left:4px solid #f57c00;">
            <strong>📝 Décisions importantes :</strong><br>${snap.decisions.replace(/\n/g, '<br>')}
        </div>
    ` : '';

    let html = `
        <div style="margin-bottom:16px;">
            <h2 style="border-left-color:#f57c00;">📅 Détail de la réunion du ${entry.date}</h2>
            <p class="badge">🏠 Hôte : ${snap.hote || 'Non défini'}</p>
        </div>
    `;

    html += `<h3>👥 Membres présents (${present.length})</h3><div class="totaux-box" style="margin-bottom:16px;">`;
    present.forEach(m => {
        const parts = getMemberParts(snap, m);
        const ration = snap.rationParticipants?.[m] ? '✅' : '❌';
        const assiette = snap.assietteParticipants?.[m] ? '✅' : '❌';
        const partLabel = parts === 0 ? '❌ ne cotise pas' : `${parts} part${parts>1?'s':''}`;
        const scolaire = snap.scolaires?.[m] || 0;
        const congres = snap.congres?.[m] || 0;
        html += `
            <div class="recap-line">
                <span><strong>${m}</strong></span>
                <span>${partLabel} | R:${ration} A:${assiette} | S:${scolaire} F | C:${congres} F</span>
            </div>
        `;
    });
    html += `</div>`;

    if (absents.length > 0) {
        html += `
            <div style="font-size:0.85rem;color:#888;margin-bottom:16px;">
                <span>👤 Absents : ${absents.join(', ')}</span>
            </div>
        `;
    }

    if (snap.recouvrements && snap.recouvrements.length > 0) {
        html += `<h3>🔄 Recouvrements</h3><div class="totaux-box" style="margin-bottom:16px;">`;
        snap.recouvrements.forEach(op => {
            html += `
                <div class="recap-line">
                    <span>📌 ${op.montant} F à répartir</span>
                    <span><strong>${op.parMembre} F</strong> / membre ${op.date ? ` (${op.date})` : ''}</span>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `<h3>💰 Totaux</h3><div class="totaux-box" style="margin-bottom:16px;">`;
    html += `<div class="recap-line"><span>🍽️ Rations</span> <strong>${totals.totalRations} F</strong></div>`;
    html += `<div class="recap-line"><span>🍽️ Assiettes</span> <strong>${totals.totalAssiettes} F</strong></div>`;
    html += `<div class="recap-line"><span>📚 Scolaire</span> <strong>${totals.totalScolaire} F</strong></div>`;
    html += `<div class="recap-line"><span>🏛️ Congrès</span> <strong>${totals.totalCongres} F</strong></div>`;
    html += `<div class="recap-line"><span>🔄 Tontine cotisation</span> <strong>${totals.totalCotisation} F</strong> (${totals.cotisationPrice} F/part)</div>`;
    html += `<div class="recap-line" style="border-bottom:2px solid #1b5e20;font-size:1.1rem;"><span>💰 Grand total</span> <strong style="color:#1b5e20;">${totals.grandTotal} F</strong></div>`;
    html += `<div class="recap-line"><span>🛡️ Fonds de caisse</span> <strong>${snap.fondsCaisse} F</strong></div>`;
    html += `<div class="recap-line"><span>🏆 Bénéficiaire</span> <strong>${snap.tontineBeneficiaire || 'Non attribué'}</strong></div>`;
    html += `</div>`;
    
    html += decisions;

    html += `
        <button id="backToArchiveBtn" class="outline-back" style="margin-top:8px; width:100%; padding:14px; border:2px solid #1b5e20; border-radius:40px; background:transparent; color:#1b5e20; font-weight:700; cursor:pointer;">
            ← Retour à l'historique
        </button>
    `;

    container.innerHTML = html;

    document.getElementById('backToArchiveBtn')?.addEventListener('click', function() {
        currentDetailIndex = -1;
        renderArchive(state);
    });
}

// ============================================================
// TRÉSORERIE
// ============================================================
export function renderTreasury(state) {
    renderTreasuryResponsables(state);
    renderBalances(state);
    renderTransferHistory(state);
}

function renderTreasuryResponsables(state) {
    const el = document.getElementById('treasurerDisplay');
    if (el) el.innerText = state.treasurer || 'Non défini';
    const el2 = document.getElementById('familyHeadDisplay');
    if (el2) el2.innerText = state.familyHead || 'LEKEUZEU Hervé';
    const el3 = document.getElementById('nextHostDisplay');
    if (el3) el3.innerText = state.nextHost || 'Non défini';
    const el4 = document.getElementById('beneficiaryDisplay');
    if (el4) el4.innerText = state.tontineBeneficiaire || 'Non attribué';
}

function renderBalances(state) {
    const container = document.getElementById('balancesContainer');
    if (!container) return;
    const balances = state.balances || {};
    const labels = {
        assiette: '🍽️ Assiette',
        scolaire: '📚 Scolaire',
        congres: '🏛️ Congrès',
        fonds: '🛡️ Fonds de caisse',
        general: '🏦 Caisse générale',
        ration: '🍲 Ration (prochain hôte)'
    };
    let html = '';
    for (const [key, label] of Object.entries(labels)) {
        const amount = balances[key] || 0;
        html += `<div class="recap-line"><span>${label}</span> <strong>${amount.toLocaleString()} F</strong></div>`;
    }
    container.innerHTML = html;
}

function renderTransferHistory(state) {
    const container = document.getElementById('transferHistoryContainer');
    if (!container) return;
    const history = state.transferHistory || [];
    if (history.length === 0) {
        container.innerHTML = '<p style="color:#888;">Aucun transfert enregistré.</p>';
        return;
    }
    let html = `<table><thead><tr><th>📅 Date</th><th>De</th><th>Vers</th><th>💰 Montant</th><th>📌 Rubrique</th></tr></thead><tbody>`;
    const displayed = history.slice(-20).reverse();
    displayed.forEach(t => {
        html += `
            <tr>
                <td>${t.date || ''}</td>
                <td>${t.from || ''}</td>
                <td>${t.to || ''}</td>
                <td><strong>${(t.amount || 0).toLocaleString()} F</strong></td>
                <td>${t.rubrique || t.description || ''}</td>
            </tr>
        `;
    });
    if (history.length > 20) {
        html += `
            <tr>
                <td colspan="5" style="text-align:center; color:#888; font-style:italic; padding:12px;">
                    + ${history.length - 20} transfert(s) plus ancien(s)...
                </td>
            </tr>
        `;
    }
    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ============================================================
// STATISTIQUES
// ============================================================
export function renderStats(state) {
    const container = document.getElementById('statsContainer');
    if (!container) return;

    const archive = state.archive || [];
    if (archive.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#888;">
                <p style="font-size:2rem;">📊</p>
                <p>Aucune réunion archivée.</p>
                <p style="font-size:0.85rem;">Archiver des réunions pour voir les statistiques.</p>
            </div>
        `;
        return;
    }

    const stats = {
        totalMeetings: archive.length,
        totalCollected: 0,
        presenceCount: {},
        yearlyData: {},
        mostPresent: { name: '', count: 0 }
    };

    MEMBERS.forEach(m => stats.presenceCount[m] = 0);

    archive.forEach(entry => {
        const snap = entry.snapshot;
        const totals = computeTotals(snap);
        stats.totalCollected += totals.grandTotal;

        MEMBERS.forEach(m => {
            if (snap.presences && snap.presences[m]) {
                stats.presenceCount[m]++;
            }
        });

        const year = entry.date.slice(0, 4);
        if (!stats.yearlyData[year]) stats.yearlyData[year] = { count: 0, total: 0 };
        stats.yearlyData[year].count++;
        stats.yearlyData[year].total += totals.grandTotal;
    });

    for (const [name, count] of Object.entries(stats.presenceCount)) {
        if (count > stats.mostPresent.count) {
            stats.mostPresent = { name, count };
        }
    }

    let html = `
        <div class="stat-grid">
            <div class="stat-card">
                <div style="font-size:0.85rem;color:#555;">Nombre total de réunions</div>
                <div class="stat-number">${stats.totalMeetings}</div>
            </div>
            <div class="stat-card">
                <div style="font-size:0.85rem;color:#555;">Montant total collecté</div>
                <div class="stat-number">${stats.totalCollected.toLocaleString()} F</div>
            </div>
            <div class="stat-card">
                <div style="font-size:0.85rem;color:#555;">Membre le plus présent</div>
                <div class="stat-number" style="font-size:1.2rem;">${stats.mostPresent.name} (${stats.mostPresent.count} réunions)</div>
            </div>
            <div class="stat-card">
                <div style="font-size:0.85rem;color:#555;">Fonds de caisse actuel</div>
                <div class="stat-number">${(state.fondsCaisse || 0).toLocaleString()} F</div>
            </div>
        </div>
    `;

    html += `<h3 style="margin-top:20px;">📋 Présences par membre</h3>
        <div class="totaux-box"><table style="width:100%;border-collapse:collapse;">
            <thead><tr><th style="text-align:left;">Membre</th><th style="text-align:right;">Présences</th><th style="text-align:right;">Taux</th></tr></thead><tbody>`;
    MEMBERS.forEach(m => {
        const count = stats.presenceCount[m] || 0;
        const rate = Math.round((count / stats.totalMeetings) * 100);
        html += `<tr><td style="padding:4px 0;">${m}</td><td style="padding:4px 0;text-align:right;">${count}</td><td style="padding:4px 0;text-align:right;">${rate}%</td></tr>`;
    });
    html += `</tbody></table></div>`;

    html += `<h3 style="margin-top:20px;">📅 Totaux par année</h3>
        <div class="totaux-box"><table style="width:100%;border-collapse:collapse;">
            <thead><tr><th style="text-align:left;">Année</th><th style="text-align:right;">Réunions</th><th style="text-align:right;">Total collecté</th></tr></thead><tbody>`;
    const sortedYears = Object.keys(stats.yearlyData).sort();
    sortedYears.forEach(year => {
        const data = stats.yearlyData[year];
        html += `<tr><td style="padding:4px 0;">${year}</td><td style="padding:4px 0;text-align:right;">${data.count}</td><td style="padding:4px 0;text-align:right;">${data.total.toLocaleString()} F</td></tr>`;
    });
    html += `</tbody></table></div>`;

    container.innerHTML = html;
}

// ============================================================
// NOUVEAU : SYNTHÈSE ANNUELLE
// ============================================================
export function renderSynthesis(state) {
    const container = document.getElementById('synthesisContainer');
    if (!container) return;

    const startDate = document.getElementById('synthesisStart')?.value;
    const endDate = document.getElementById('synthesisEnd')?.value;
    const generateBtn = document.getElementById('generateSynthesisBtn');

    // Si la période n'est pas définie ou que le bouton n'a pas été cliqué
    if (!startDate || !endDate) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#888;">
                <p style="font-size:2rem;">📊</p>
                <p>Sélectionnez une période et cliquez sur "Générer".</p>
                <p style="font-size:0.85rem;">Ex: 2025-08-01 à 2026-06-30</p>
            </div>
        `;
        return;
    }

    // Vérifier si la période est valide
    if (startDate > endDate) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#c62828;">
                <p style="font-size:2rem;">⚠️</p>
                <p>La date de début doit être antérieure à la date de fin.</p>
            </div>
        `;
        return;
    }

    // Générer la synthèse
    import('../core/reports.js').then(module => {
        const { generateSynthesis } = module;
        const synthesis = generateSynthesis(state, startDate, endDate);

        if (synthesis.empty) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:#888;">
                    <p style="font-size:2rem;">📭</p>
                    <p>${synthesis.message}</p>
                    <p style="font-size:0.85rem;">Aucune réunion trouvée pour cette période.</p>
                </div>
            `;
            return;
        }

        // Construire le HTML des tableaux
        let html = '<div style="overflow-x:auto;">';
        html += `<h3 style="margin-top:20px;">📅 Synthèse du ${synthesis.period.startDate} au ${synthesis.period.endDate}</h3>`;

        // 1. Tontine Principale
        html += renderTontinePrincipaleTable(synthesis.tontinePrincipale);

        // 2. Caisse Ration
        html += renderCaisseRationTable(synthesis.caisseRation);

        // 3. Caisse Assiettes
        html += renderCaisseAssiettesTable(synthesis.caisseAssiettes);

        // 4. Caisse Scolaire
        html += renderCaisseScolaireTable(synthesis.caisseScolaire);

        // 5. Congrès Familial
        html += renderCongresFamilialTable(synthesis.congresFamilial);

        // 6. Grand Tableau Récapitulatif
        html += renderGrandTableau(synthesis.grandTableau);

        html += '</div>';
        container.innerHTML = html;
    }).catch(err => {
        console.error('Erreur lors de la génération de la synthèse:', err);
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#c62828;">
                <p>❌ Erreur lors de la génération : ${err.message}</p>
            </div>
        `;
    });
}

// ============================================================
// FONCTIONS DE RENDU DES TABLEAUX DE SYNTHÈSE
// ============================================================

function renderTontinePrincipaleTable(data) {
    if (!data || !data.months || data.months.length === 0) {
        return '<p style="color:#888;">Aucune donnée pour la tontine principale.</p>';
    }

    let html = '<h4 style="margin-top:16px;">1. Tontine Principale (10 000 F/mois)</h4>';
    html += '<div style="overflow-x:auto;margin-bottom:16px;"><table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
    html += '<thead><tr><th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">N°</th><th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Nom</th>';
    data.months.forEach(month => {
        html += `<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">${month}</th>`;
    });
    html += '<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Total</th></tr></thead><tbody>';

    data.members.forEach((m, idx) => {
        html += `<tr><td style="padding:4px 6px;border:1px solid #ddd;">${idx + 1}</td>`;
        html += `<td style="padding:4px 6px;border:1px solid #ddd;">${m}</td>`;
        let total = 0;
        data.months.forEach(month => {
            const val = data.data[m]?.[month] || 0;
            html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${val > 0 ? val.toLocaleString() : '-'}</td>`;
            total += val;
        });
        html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;font-weight:bold;">${total.toLocaleString()}</td></tr>`;
    });

    // Ligne des totaux mensuels
    html += '<tr style="font-weight:bold;background:#f5f5f5;"><td colspan="2" style="padding:4px 6px;border:1px solid #ddd;">TOTAL MENSUEL</td>';
    let grandTotal = 0;
    data.months.forEach(month => {
        const val = data.monthlyTotals[month] || 0;
        html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${val.toLocaleString()}</td>`;
        grandTotal += val;
    });
    html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${grandTotal.toLocaleString()}</td></tr>`;

    // Ligne des bénéficiaires
    html += '<tr style="background:#fff3e0;"><td colspan="2" style="padding:4px 6px;border:1px solid #ddd;">Bénéficiaire (N°)</td>';
    data.months.forEach(month => {
        const benef = data.beneficiaries[month] || '—';
        html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:center;">${benef}</td>`;
    });
    html += '<td style="padding:4px 6px;border:1px solid #ddd;"></td></tr>';

    html += '</tbody></table></div>';
    return html;
}

function renderCaisseRationTable(data) {
    if (!data || !data.months || data.months.length === 0) {
        return '<p style="color:#888;">Aucune donnée pour la caisse ration.</p>';
    }

    let html = '<h4 style="margin-top:16px;">2. Caisse Ration (1 500 F/mois)</h4>';
    html += '<div style="overflow-x:auto;margin-bottom:16px;"><table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
    html += '<thead><tr><th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">N°</th><th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Nom</th>';
    data.months.forEach(month => {
        html += `<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">${month}</th>`;
    });
    html += '<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Total</th></tr></thead><tbody>';

    data.members.forEach((m, idx) => {
        html += `<tr><td style="padding:4px 6px;border:1px solid #ddd;">${idx + 1}</td>`;
        html += `<td style="padding:4px 6px;border:1px solid #ddd;">${m}</td>`;
        let total = 0;
        data.months.forEach(month => {
            const val = data.data[m]?.[month] || 0;
            html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${val > 0 ? val.toLocaleString() : '-'}</td>`;
            total += val;
        });
        html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;font-weight:bold;">${total.toLocaleString()}</td></tr>`;
    });

    // Ligne des totaux mensuels
    html += '<tr style="font-weight:bold;background:#f5f5f5;"><td colspan="2" style="padding:4px 6px;border:1px solid #ddd;">TOTAL MENSUEL</td>';
    let grandTotal = 0;
    data.months.forEach(month => {
        const val = data.monthlyTotals[month] || 0;
        html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${val.toLocaleString()}</td>`;
        grandTotal += val;
    });
    html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${grandTotal.toLocaleString()}</td></tr>`;

    html += '</tbody></table></div>';
    return html;
}

function renderCaisseAssiettesTable(data) {
    if (!data || !data.months || data.months.length === 0) {
        return '<p style="color:#888;">Aucune donnée pour la caisse assiettes.</p>';
    }

    let html = '<h4 style="margin-top:16px;">3. Caisse Assiettes (1 000 F/mois)</h4>';
    html += '<div style="overflow-x:auto;margin-bottom:16px;"><table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
    html += '<thead><tr><th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">N°</th><th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Nom</th>';
    data.months.forEach(month => {
        html += `<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">${month}</th>`;
    });
    html += '<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Total</th></tr></thead><tbody>';

    data.members.forEach((m, idx) => {
        html += `<tr><td style="padding:4px 6px;border:1px solid #ddd;">${idx + 1}</td>`;
        html += `<td style="padding:4px 6px;border:1px solid #ddd;">${m}</td>`;
        let total = 0;
        data.months.forEach(month => {
            const val = data.data[m]?.[month] || 0;
            html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${val > 0 ? val.toLocaleString() : '-'}</td>`;
            total += val;
        });
        html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;font-weight:bold;">${total.toLocaleString()}</td></tr>`;
    });

    html += '<tr style="font-weight:bold;background:#f5f5f5;"><td colspan="2" style="padding:4px 6px;border:1px solid #ddd;">TOTAL MENSUEL</td>';
    let grandTotal = 0;
    data.months.forEach(month => {
        const val = data.monthlyTotals[month] || 0;
        html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${val.toLocaleString()}</td>`;
        grandTotal += val;
    });
    html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${grandTotal.toLocaleString()}</td></tr>`;

    html += '</tbody></table></div>';
    return html;
}

function renderCaisseScolaireTable(data) {
    if (!data || !data.months || data.months.length === 0) {
        return '<p style="color:#888;">Aucune donnée pour la caisse scolaire.</p>';
    }

    let html = '<h4 style="margin-top:16px;">4. Caisse Scolaire (versements variables)</h4>';
    html += '<div style="overflow-x:auto;margin-bottom:16px;"><table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
    html += '<thead><tr><th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">N°</th><th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Nom</th>';
    data.months.forEach(month => {
        html += `<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">${month}</th>`;
    });
    html += '<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Total</th></tr></thead><tbody>';

    data.members.forEach((m, idx) => {
        html += `<tr><td style="padding:4px 6px;border:1px solid #ddd;">${idx + 1}</td>`;
        html += `<td style="padding:4px 6px;border:1px solid #ddd;">${m}</td>`;
        let total = 0;
        data.months.forEach(month => {
            const val = data.data[m]?.[month] || 0;
            html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${val > 0 ? val.toLocaleString() : '-'}</td>`;
            total += val;
        });
        html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;font-weight:bold;">${total.toLocaleString()}</td></tr>`;
    });

    html += '<tr style="font-weight:bold;background:#f5f5f5;"><td colspan="2" style="padding:4px 6px;border:1px solid #ddd;">TOTAL MENSUEL</td>';
    let grandTotal = 0;
    data.months.forEach(month => {
        const val = data.monthlyTotals[month] || 0;
        html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${val.toLocaleString()}</td>`;
        grandTotal += val;
    });
    html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${grandTotal.toLocaleString()}</td></tr>`;

    html += '</tbody></table></div>';
    return html;
}

function renderCongresFamilialTable(data) {
    if (!data || !data.months || data.months.length === 0) {
        return '<p style="color:#888;">Aucune donnée pour le congrès familial.</p>';
    }

    let html = '<h4 style="margin-top:16px;">5. Congrès Familial (épargne projet)</h4>';
    html += '<div style="overflow-x:auto;margin-bottom:16px;"><table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
    html += '<thead><tr><th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">N°</th><th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Nom</th>';
    data.months.forEach(month => {
        html += `<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">${month}</th>`;
    });
    html += '<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Total</th></tr></thead><tbody>';

    data.members.forEach((m, idx) => {
        html += `<tr><td style="padding:4px 6px;border:1px solid #ddd;">${idx + 1}</td>`;
        html += `<td style="padding:4px 6px;border:1px solid #ddd;">${m}</td>`;
        let total = 0;
        data.months.forEach(month => {
            const val = data.data[m]?.[month] || 0;
            html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${val > 0 ? val.toLocaleString() : '-'}</td>`;
            total += val;
        });
        html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;font-weight:bold;">${total.toLocaleString()}</td></tr>`;
    });

    html += '<tr style="font-weight:bold;background:#f5f5f5;"><td colspan="2" style="padding:4px 6px;border:1px solid #ddd;">TOTAL MENSUEL</td>';
    let grandTotal = 0;
    data.months.forEach(month => {
        const val = data.monthlyTotals[month] || 0;
        html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${val.toLocaleString()}</td>`;
        grandTotal += val;
    });
    html += `<td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${grandTotal.toLocaleString()}</td></tr>`;

    html += '</tbody></table></div>';
    return html;
}

function renderGrandTableau(data) {
    if (!data || !data.members || data.members.length === 0) {
        return '<p style="color:#888;">Aucune donnée pour le grand tableau récapitulatif.</p>';
    }

    let html = '<h3 style="margin-top:24px;">📊 Grand Tableau Récapitulatif de Fin d\'Exercice</h3>';
    html += '<div style="overflow-x:auto;margin-bottom:16px;"><table style="width:100%;border-collapse:collapse;font-size:0.85rem;">';
    html += '<thead><tr><th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">N°</th>';
    html += '<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Membre</th>';
    html += '<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Ration</th>';
    html += '<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Assiettes</th>';
    html += '<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Scolaire</th>';
    html += '<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">Congrès</th>';
    html += '<th style="padding:4px 6px;border:1px solid #ddd;background:#e8f5e9;">TOTAL</th></tr></thead><tbody>';

    data.members.forEach((m, idx) => {
        const d = data.data[m] || { ration: 0, assiettes: 0, scolaire: 0, congres: 0, total: 0 };
        html += `<tr>
            <td style="padding:4px 6px;border:1px solid #ddd;">${idx + 1}</td>
            <td style="padding:4px 6px;border:1px solid #ddd;">${m}</td>
            <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${d.ration.toLocaleString()}</td>
            <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${d.assiettes.toLocaleString()}</td>
            <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${d.scolaire.toLocaleString()}</td>
            <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${d.congres.toLocaleString()}</td>
            <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;font-weight:bold;">${d.total.toLocaleString()}</td>
        </tr>`;
    });

    html += `<tr style="font-weight:bold;background:#f5f5f5;">
        <td colspan="2" style="padding:4px 6px;border:1px solid #ddd;">TOTAL GÉNÉRAL</td>
        <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${data.totalGeneral.toLocaleString()}</td>
        <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${data.totalGeneral.toLocaleString()}</td>
        <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${data.totalGeneral.toLocaleString()}</td>
        <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${data.totalGeneral.toLocaleString()}</td>
        <td style="padding:4px 6px;border:1px solid #ddd;text-align:right;">${data.totalGeneral.toLocaleString()}</td>
    </tr>`;

    html += '</tbody></table></div>';
    return html;
}

// ============================================================
// MISE À JOUR DES TOTAUX
// ============================================================
export function updateTotalsDisplay(state) {
    const totals = computeTotals(state);
    const totalPartsDisplay = document.getElementById('totalCotisationPartsDisplay');
    if (totalPartsDisplay) totalPartsDisplay.innerText = totals.totalCotisation;
    const fondsDisplay = document.getElementById('fondsCaisseDisplay');
    if (fondsDisplay) fondsDisplay.innerText = state.fondsCaisse || 0;
}
