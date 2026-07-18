import { stationsData } from './data.js';

// Estado del juego
const gameState = {
    visitedStations: new Set(),
    progressPerNode: 14.28, // 100 / 7 nodos
    currentProgress: 0,
    isMoving: false
};

// Referencias al DOM
const dom = {
    map: document.getElementById('map-container'),
    avatar: document.getElementById('player-avatar'),
    aseBar: document.getElementById('ase-bar'),
    asePercent: document.getElementById('ase-percent'),
    modal: document.getElementById('dialog-modal'),
    dialogTitle: document.getElementById('dialog-title'),
    dialogSubtitle: document.getElementById('dialog-subtitle'),
    dialogText: document.getElementById('dialog-text'),
    closeBtn: document.getElementById('close-dialog-btn')
};

// Generar las estaciones en el DOM
export function renderMap() {
    stationsData.forEach((station, index) => {
        const node = document.createElement('div');
        node.className = 'station-node';
        node.id = `node-${station.id}`;
        
        // Marcador de misión (solo visible si no ha sido visitado)
        const questMarker = document.createElement('div');
        questMarker.className = 'quest-marker';
        questMarker.innerText = '!';
        questMarker.id = `quest-${station.id}`;
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'station-icon';
        iconDiv.innerText = station.icon;

        const label = document.createElement('div');
        label.className = 'station-label';
        label.innerText = station.day;

        node.appendChild(questMarker);
        node.appendChild(iconDiv);
        node.appendChild(label);

        // Evento Click para viajar a la estación
        node.addEventListener('click', () => handleNodeClick(node, station));

        dom.map.appendChild(node);
    });
}

// Lógica de Movimiento y Clic
function handleNodeClick(nodeElement, stationData) {
    if (gameState.isMoving) return; // Prevenir clics múltiples mientras camina

    gameState.isMoving = true;
    
    // Calcular posición para el avatar (centrado respecto a la estación)
    const nodeRect = nodeElement.getBoundingClientRect();
    const mapRect = dom.map.getBoundingClientRect();
    
    // Calcular Left relativo al contenedor
    const targetLeft = (nodeRect.left - mapRect.left) + (nodeRect.width / 2) - 20; // 20 es la mitad del width del avatar

    // Mover Avatar (CSS Transition lo hace suave)
    dom.avatar.style.left = `${targetLeft}px`;
    
    // Quitar idle mientras "camina"
    dom.avatar.classList.remove('idle');

    // Esperar a que termine la transición (0.8s definido en CSS)
    setTimeout(() => {
        dom.avatar.classList.add('idle'); // Volver a respirar
        
        // Procesar lógica del nodo
        visitStation(stationData);
        openModal(stationData);
        
        gameState.isMoving = false;
    }, 800);
}

// Lógica de Barra ASE y Progreso
function visitStation(stationData) {
    if (!gameState.visitedStations.has(stationData.id)) {
        gameState.visitedStations.add(stationData.id);
        
        // Ocultar marcador de quest
        const marker = document.getElementById(`quest-${stationData.id}`);
        if(marker) marker.style.display = 'none';

        // Aumentar barra
        gameState.currentProgress += gameState.progressPerNode;
        if (gameState.currentProgress > 99) gameState.currentProgress = 100; // Cap a 100%
        
        dom.aseBar.style.width = `${gameState.currentProgress}%`;
        dom.asePercent.innerText = `${Math.round(gameState.currentProgress)}%`;
        
        // Cambiar color de la barra si llega a 100% (Verde)
        if(gameState.currentProgress === 100) {
            dom.aseBar.style.backgroundColor = '#7CFC00';
        }
    }
}

// Funciones del Modal
function openModal(data) {
    dom.dialogTitle.innerText = `${data.day}: ${data.title}`;
    dom.dialogSubtitle.innerText = `Líder: ${data.role}`;
    dom.dialogText.innerText = data.description;
    dom.modal.classList.remove('hidden');
}

export function initUIListeners() {
    dom.closeBtn.addEventListener('click', () => {
        dom.modal.classList.add('hidden');
    });
}
