import { renderMap, initUIListeners } from './game-logic.js';

// Evento principal: Cuando el DOM está listo, inicializamos la experiencia
document.addEventListener('DOMContentLoaded', () => {
    // 1. Renderizar el mapa de estaciones
    renderMap();
    
    // 2. Inicializar los eventos de la interfaz (botones de modales, etc.)
    initUIListeners();

    console.log("Infografía Pedagógica Inicializada con Éxito. ¡A jugar!");
});
