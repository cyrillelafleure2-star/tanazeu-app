/**
 * ============================================================
 * APP - POINT D'ENTRÉE PRINCIPAL
 * Famille TANAZEU - V2.0
 * ============================================================
 */

import { loadState, saveState } from './data/storage.js';
import { renderAll } from './ui/render.js';
import { initEvents } from './ui/events.js';

let state = loadState();

function refreshAndSave() {
    saveState(state);
    renderAll(state);
}

// Exposer la fonction de rafraîchissement globalement
// pour que les écouteurs d'événements puissent l'appeler
window.refreshApp = refreshAndSave;

function initApp() {
    console.log('🏠 Famille TANAZEU - Application V2.0');
    console.log(`📅 Date actuelle : ${state.currentDate || 'Non définie'}`);
    console.log(`👥 Membres : ${state.members.length} inscrits`);
    console.log(`📂 Réunions archivées : ${(state.archive || []).length}`);
    
    renderAll(state);
    initEvents(state, refreshAndSave);
    
    if (!state.currentDate) {
        state.currentDate = new Date().toISOString().slice(0, 10);
        saveState(state);
        renderAll(state);
    }
    
    console.log('✅ Application prête !');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Exposition globale pour le débogage
window.__TANAZEU_APP__ = {
    state: state,
    refreshAndSave: refreshAndSave,
    loadState: loadState,
    saveState: saveState,
    renderAll: renderAll
};