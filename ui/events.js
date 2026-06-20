/**
 * ============================================================
 * UI / EVENTS
 * Famille TANAZEU - V2.0
 * 
 * Gestion des événements utilisateur (clics, changements, etc.)
 * Ces fonctions lient les actions de l'utilisateur aux
 * modifications de l'état et au rafraîchissement de l'UI.
 * 
 * VERSION AVEC SYNTHÈSE ANNUELLE
 * ============================================================
 */

import {
    getPresentMembers,
    getPresentCount,
    calculateRecoveryPerMember
} from '../core/calculators.js';

import {
    archiveCurrentSessionWithFlows,
    archiveCurrentSession,
    exportStateToJSON,
    exportHistoryToJSON,
    importStateFromJSON,
    importHistoryFromJSON,
    resetAllData
} from '../data/storage.js';

import { setDetailIndex } from './render.js';
import { MEMBERS } from '../core/constants.js';

export function initEvents(state, refreshAndSave) {

    // ============================================================
    // TAB 1 : PRÉSENCES & COTISATIONS LIBRES
    // ============================================================

    document.getElementById('savePresenceBtn')?.addEventListener('click', function() {
        state.members.forEach(m => {
            const cb = document.getElementById(`presence_${m}`);
            if (cb) state.presences[m] = cb.checked;
        });
        refreshAndSave();
    });

    document.getElementById('saveLibreBtn')?.addEventListener('click', function() {
        const present = getPresentMembers(state);
        present.forEach(m => {
            const scol = parseInt(document.getElementById(`scol_${m}`)?.value) || 0;
            const cong = parseInt(document.getElementById(`cong_${m}`)?.value) || 0;
            state.scolaires[m] = scol;
            state.congres[m] = cong;
        });
        refreshAndSave();
    });

    // ============================================================
    // TAB 2 : TONTINES & FONDS
    // ============================================================

    document.getElementById('cotisationPriceInput')?.addEventListener('change', function() {
        const newPrice = parseInt(this.value) || 0;
        if (newPrice > 0) {
            state.cotisationPrice = newPrice;
            refreshAndSave();
        } else {
            alert('Veuillez entrer un prix valide (supérieur à 0).');
            this.value = state.cotisationPrice || 10000;
        }
    });

    document.getElementById('participationContainer')?.addEventListener('change', function(e) {
        if (e.target && e.target.id) {
            const id = e.target.id;
            if (id.startsWith('ration_')) {
                const m = id.replace('ration_', '');
                state.rationParticipants[m] = e.target.checked;
                refreshAndSave();
            } else if (id.startsWith('assiette_')) {
                const m = id.replace('assiette_', '');
                state.assietteParticipants[m] = e.target.checked;
                refreshAndSave();
            }
        }
    });

    document.getElementById('partsSelectContainer')?.addEventListener('change', function(e) {
        if (e.target && e.target.id && e.target.id.startsWith('parts_')) {
            const m = e.target.id.replace('parts_', '');
            state.parts[m] = parseInt(e.target.value) || 0;
            refreshAndSave();
        }
    });

    document.getElementById('ajouterRecouvrementBtn')?.addEventListener('click', function() {
        const montant = parseInt(document.getElementById('recouvrementMontantInput')?.value);
        if (!montant || montant <= 0) {
            alert('Veuillez entrer un montant valide.');
            return;
        }
        const presentCount = getPresentCount(state);
        if (presentCount === 0) {
            alert('Aucun membre présent pour le recouvrement.');
            return;
        }
        const parMembre = calculateRecoveryPerMember(montant, presentCount);
        state.recouvrements.push({
            montant: montant,
            parMembre: parMembre,
            date: new Date().toISOString().slice(0, 10)
        });
        state.fondsCaisse = (state.fondsCaisse || 0) - montant;
        if (!state.balances) state.balances = {};
        state.balances.fonds = state.fondsCaisse;
        refreshAndSave();
    });

    document.getElementById('attribuerTontineBtn')?.addEventListener('click', function() {
        const val = document.getElementById('beneficiaireSelect')?.value;
        if (!val) {
            alert('Veuillez sélectionner un bénéficiaire.');
            return;
        }
        state.tontineBeneficiaire = val;
        refreshAndSave();
    });

    // ============================================================
    // TAB 3 : RÉCAP & EXPORT
    // ============================================================

    document.getElementById('printBtn')?.addEventListener('click', function() {
        window.print();
    });

    document.getElementById('saveDecisionsBtn')?.addEventListener('click', function() {
        const textarea = document.getElementById('decisionsTextarea');
        if (textarea) {
            state.decisions = textarea.value;
            refreshAndSave();
            alert('✅ Décisions enregistrées !');
        }
    });

    document.getElementById('archiveBtn')?.addEventListener('click', function() {
        const date = state.currentDate || new Date().toISOString().slice(0, 10);
        if (confirm(`Archiver la réunion du ${date} ? Les soldes seront mis à jour.`)) {
            archiveCurrentSessionWithFlows(state);
            refreshAndSave();
            alert(`✅ Réunion du ${date} archivée avec succès !\nLes caisses ont été mises à jour.`);
        }
    });

    document.getElementById('exportPdfBtn')?.addEventListener('click', function() {
        const recapContent = document.getElementById('recapContainer');
        if (!recapContent) {
            alert('Aucun récapitulatif à exporter.');
            return;
        }
        const title = `<h2 style="text-align:center;color:#1b5e20;">📄 Récapitulatif TANAZEU - ${state.currentDate || ''}</h2>`;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = title + recapContent.innerHTML;
        tempDiv.style.padding = '20px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(tempDiv);
        if (typeof html2pdf !== 'undefined') {
            html2pdf().from(tempDiv).set({
                margin: 10,
                filename: `tanazu_recap_${state.currentDate || 'reunion'}.pdf`,
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).save().then(() => {
                document.body.removeChild(tempDiv);
            });
        } else {
            alert('La bibliothèque html2pdf.js n\'est pas chargée. Vérifie le script dans index.html.');
            document.body.removeChild(tempDiv);
        }
    });

    document.getElementById('exportBtn')?.addEventListener('click', function() {
        const json = exportStateToJSON(state);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tanazu_${state.currentDate || 'reunion'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    document.getElementById('importBtn')?.addEventListener('click', function() {
        document.getElementById('importFileInput')?.click();
    });

    document.getElementById('importFileInput')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const imported = importStateFromJSON(ev.target.result, state);
                Object.assign(state, imported);
                refreshAndSave();
                alert('✅ Données importées avec succès !');
            } catch (err) {
                alert('❌ Erreur lors de l\'import : ' + err.message);
            }
        };
        reader.readAsText(file);
        this.value = '';
    });

    document.getElementById('resetBtn')?.addEventListener('click', function() {
        if (confirm('⚠️ Réinitialiser TOUTES les données ? Cette action est irréversible.')) {
            const newState = resetAllData();
            Object.assign(state, newState);
            refreshAndSave();
            alert('Données réinitialisées.');
        }
    });

    // ============================================================
    // TAB 4 : HISTORIQUE
    // ============================================================

    document.getElementById('exportHistoryBtn')?.addEventListener('click', function() {
        const historyData = {
            familyName: "TANAZEU",
            exportDate: new Date().toISOString().slice(0, 10),
            archive: state.archive || [],
            members: state.members || []
        };
        const json = JSON.stringify(historyData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tanazu_historique_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    document.getElementById('importHistoryBtn')?.addEventListener('click', function() {
        document.getElementById('importHistoryFileInput')?.click();
    });

    document.getElementById('importHistoryFileInput')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const imported = JSON.parse(ev.target.result);
                if (!imported.archive || !Array.isArray(imported.archive)) {
                    throw new Error("Structure d'historique invalide.");
                }
                const existingDates = new Set((state.archive || []).map(entry => entry.date));
                let addedCount = 0;
                imported.archive.forEach(entry => {
                    if (!existingDates.has(entry.date)) {
                        state.archive.push(entry);
                        existingDates.add(entry.date);
                        addedCount++;
                    }
                });
                refreshAndSave();
                alert(`✅ ${addedCount} réunion(s) importée(s) avec succès !`);
                if (addedCount === 0) {
                    alert('ℹ️ Aucune nouvelle réunion à importer (doublons détectés).');
                }
            } catch (err) {
                alert('❌ Erreur lors de l\'import d\'historique : ' + err.message);
            }
        };
        reader.readAsText(file);
        this.value = '';
    });

    // ============================================================
    // TAB 5 : TRÉSORERIE
    // ============================================================

    document.getElementById('addTransferBtn')?.addEventListener('click', function() {
        const from = prompt('De qui (nom ou caisse) ?');
        if (from === null) return;
        const to = prompt('Vers qui (nom ou caisse) ?');
        if (to === null) return;
        const amount = parseInt(prompt('Montant (F) ?'));
        if (!amount || amount <= 0) {
            alert('Montant invalide.');
            return;
        }
        const rubrique = prompt('Rubrique (ex: Assiette, Scolaire...)') || '';
        state.transferHistory.push({
            date: state.currentDate || new Date().toISOString().slice(0, 10),
            from: from,
            to: to,
            amount: amount,
            rubrique: rubrique
        });
        refreshAndSave();
        alert('✅ Transfert enregistré !');
    });

    document.getElementById('settleBoissonBtn')?.addEventListener('click', function() {
        const reste = parseInt(prompt('Montant restant de la boisson (F) ?')) || 0;
        if (reste <= 0) {
            alert('Montant invalide ou nul.');
            return;
        }
        if (!state.balances) state.balances = {};
        state.balances.ration = (state.balances.ration || 0) + reste;
        state.transferHistory.push({
            date: state.currentDate || new Date().toISOString().slice(0, 10),
            from: 'Boisson (séance)',
            to: state.nextHost || 'Prochain hôte',
            amount: reste,
            rubrique: 'Reste boisson → Ration'
        });
        refreshAndSave();
        alert(`✅ ${reste.toLocaleString()} F reversés à ${state.nextHost || 'prochain hôte'} pour la ration.`);
    });

    document.getElementById('changeTreasurerBtn')?.addEventListener('click', function() {
        const memberList = state.members.join('\n');
        const newTreasurer = prompt(`Entrez le nom du nouveau trésorier :\n\nMembres disponibles :\n${memberList}`);
        if (newTreasurer && state.members.includes(newTreasurer.trim())) {
            state.treasurer = newTreasurer.trim();
            refreshAndSave();
            alert(`✅ Trésorier changé : ${state.treasurer}`);
        } else if (newTreasurer !== null) {
            alert('❌ Nom invalide. Veuillez choisir un nom dans la liste.');
        }
    });

    document.getElementById('changeNextHostBtn')?.addEventListener('click', function() {
        const memberList = state.members.join('\n');
        const newHost = prompt(`Entrez le nom du prochain hôte :\n\nMembres disponibles :\n${memberList}`);
        if (newHost && state.members.includes(newHost.trim())) {
            state.nextHost = newHost.trim();
            refreshAndSave();
            alert(`✅ Prochain hôte changé : ${state.nextHost}`);
        } else if (newHost !== null) {
            alert('❌ Nom invalide. Veuillez choisir un nom dans la liste.');
        }
    });

    // ============================================================
    // TAB 6 : STATISTIQUES - Export PDF
    // ============================================================
    document.getElementById('exportStatsPdfBtn')?.addEventListener('click', function() {
        const statsContent = document.getElementById('statsContainer');
        if (!statsContent) {
            alert('Aucune statistique à exporter.');
            return;
        }
        const title = `<h1 style="text-align:center;color:#1b5e20;">📊 Statistiques TANAZEU</h1>
            <p style="text-align:center;">Généré le ${new Date().toLocaleDateString()}</p>`;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = title + statsContent.innerHTML;
        tempDiv.style.padding = '20px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(tempDiv);
        if (typeof html2pdf !== 'undefined') {
            html2pdf().from(tempDiv).set({
                margin: 10,
                filename: 'tanazu_statistiques.pdf',
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).save().then(() => {
                document.body.removeChild(tempDiv);
            });
        } else {
            alert('La bibliothèque html2pdf.js n\'est pas chargée. Vérifie le script dans index.html.');
            document.body.removeChild(tempDiv);
        }
    });

    // ============================================================
    // TAB 7 : SYNTHÈSE ANNUELLE (NOUVEAU)
    // ============================================================

    /**
     * Générer la synthèse
     */
    document.getElementById('generateSynthesisBtn')?.addEventListener('click', function() {
        const startDate = document.getElementById('synthesisStart')?.value;
        const endDate = document.getElementById('synthesisEnd')?.value;
        
        if (!startDate || !endDate) {
            alert('Veuillez sélectionner une date de début et une date de fin.');
            return;
        }
        
        if (startDate > endDate) {
            alert('La date de début doit être antérieure à la date de fin.');
            return;
        }
        
        refreshAndSave();
    });

    /**
     * Auto-génération au changement des dates
     */
    document.getElementById('synthesisStart')?.addEventListener('change', function() {
        const endDate = document.getElementById('synthesisEnd')?.value;
        if (this.value && endDate && this.value <= endDate) {
            refreshAndSave();
        }
    });

    document.getElementById('synthesisEnd')?.addEventListener('change', function() {
        const startDate = document.getElementById('synthesisStart')?.value;
        if (startDate && this.value && startDate <= this.value) {
            refreshAndSave();
        }
    });

    /**
     * Export PDF de la synthèse
     */
    document.getElementById('exportSynthesisPdfBtn')?.addEventListener('click', function() {
        const synthesisContent = document.getElementById('synthesisContainer');
        if (!synthesisContent) {
            alert('Aucune synthèse à exporter.');
            return;
        }
        
        const startDate = document.getElementById('synthesisStart')?.value || '';
        const endDate = document.getElementById('synthesisEnd')?.value || '';
        const title = `<h1 style="text-align:center;color:#1b5e20;">📊 SYNTHÈSE NUMÉRIQUE DES COMPTABILITÉS</h1>
            <h2 style="text-align:center;color:#2e7d32;">RÉUNION TANAZEU — EXERCICE ${startDate} à ${endDate}</h2>
            <p style="text-align:center;">Date d'édition : ${new Date().toLocaleDateString()}</p>
            <hr>`;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = title + synthesisContent.innerHTML;
        tempDiv.style.padding = '20px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(tempDiv);
        
        if (typeof html2pdf !== 'undefined') {
            html2pdf().from(tempDiv).set({
                margin: 10,
                filename: `tanazu_synthese_${startDate}_${endDate}.pdf`,
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            }).save().then(() => {
                document.body.removeChild(tempDiv);
            });
        } else {
            alert('La bibliothèque html2pdf.js n\'est pas chargée. Vérifie le script dans index.html.');
            document.body.removeChild(tempDiv);
        }
    });

    // ============================================================
    // GESTION DE LA DATE
    // ============================================================

    document.getElementById('sessionDateInput')?.addEventListener('change', function() {
        const newDate = this.value;
        if (newDate) {
            state.currentDate = newDate;
            refreshAndSave();
        }
    });

    // ============================================================
    // GESTION DES ONGLETS
    // ============================================================

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            const targetId = this.dataset.tab;
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.remove('hidden');
            
            if (targetId !== 'tab4') {
                setDetailIndex(-1);
            }
            refreshAndSave();
        });
    });

    // ============================================================
    // MISE À JOUR EN DIRECT DU RECOUVREMENT
    // ============================================================

    document.getElementById('recouvrementMontantInput')?.addEventListener('input', function() {
        const montant = parseInt(this.value) || 0;
        const presentCount = getPresentCount(state);
        const perMember = calculateRecoveryPerMember(montant, presentCount);
        const display = document.getElementById('recouvrementParMembreDisplay');
        if (display) display.innerText = perMember;
    });

    // ============================================================
    // RACCOURCI CLAVIER
    // ============================================================

    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            refreshAndSave();
            const btn = document.querySelector('.header h1');
            if (btn) {
                const original = btn.textContent;
                btn.textContent = '💾 Sauvegardé !';
                setTimeout(() => { btn.textContent = original; }, 1000);
            }
        }
    });

    console.log('✅ Événements initialisés avec succès !');
}
