document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = GAME.width;
  canvas.height = GAME.height;

  const loadingEl = document.getElementById('loading');
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const startBtn = document.getElementById('startBtn');

  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const asePct = document.getElementById('asePct');
  const weekPct = document.getElementById('weekPct');
  const flowPct = document.getElementById('flowPct');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalBox = modalOverlay.querySelector('.modalBox');
  const modalTag = document.getElementById('modalTag');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const closeBtn = document.getElementById('closeBtn');
  const restartBtn = document.getElementById('restartBtn');

  const joystickZone = document.getElementById('joystickZone');
  const joystickStick = document.getElementById('joystickStick');
  const btnAction = document.getElementById('btnAction');

  const btnRotate = document.getElementById('btnRotate');
  const rotateHint = document.getElementById('rotateHint');
  const rotateNowBtn = document.getElementById('rotateNowBtn');
  const rotateCloseBtn = document.getElementById('rotateCloseBtn');

  const visited = new Set();
  const keys = {};
  let started = false;
  let lastFocus = null;
  let joystickActive = false;
  let rotateDismissed = false;
  let actionLock = false;

  const player = {
    x: MAIN_PATH.minX,
    y: MAIN_PATH.y,
    speed: 3,
    facing: 1,
    walking: false,
    walkFrame: 0
  };

  let moveVec = { x: 0, y: 0 };

  function isMobileLike() {
    return window.matchMedia('(max-width: 1024px)').matches;
  }

  function isPortrait() {
    return window.matchMedia('(orientation: portrait)').matches;
  }

  function isModalOpen() {
    return modalOverlay.style.display === 'flex';
  }

  function updateHud() {
    const total = Object.keys(MAP_STATIONS).length;
    const done = visited.size;
    const pct = total ? Math.round((done / total) * 100) : 0;

    progressFill.style.width = pct + '%';
    progressText.textContent = `${done}/${total}`;
    asePct.textContent = pct + '%';
    weekPct.textContent = pct + '%';
    flowPct.textContent = pct + '%';
  }

  function modalFocusable() {
    return [...modalOverlay.querySelectorAll('button,[tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.disabled && el.offsetParent !== null);
  }

  function trapFocus(e) {
    if (!isModalOpen() || e.key !== 'Tab') return;
    const f = modalFocusable();
    if (!f.length) return;

    const first = f[0];
    const last = f[f.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function closeModal() {
    modalOverlay.style.display = 'none';
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', trapFocus);
    updateRotateHint();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function stationHTML(s) {
    return `
      <div class="modalText">
        ${s.imagen ? `<img src="${s.imagen}" alt="${s.nombre}" class="stationImage">` : ''}
        <p><strong>Áreas responsables:</strong> ${s.areas}</p>
        <p><strong>Actividad central:</strong> ${s.resumen}</p>
        <p><strong>Propósito pedagógico:</strong> ${s.proposito}</p>
      </div>
      <div class="infoCard">
        <h3>¿Qué se vive en este día?</h3>
        <p>${s.actividad}</p>
      </div>
      <div class="infoCard">
        <h3>Seguimiento</h3>
        <p><strong>Criterio:</strong> ${s.criterio}</p>
        <p><strong>Evidencia:</strong> ${s.evidencia}</p>
        <p><strong>Instrumento:</strong> ${s.instrumento}</p>
      </div>
    `;
  }

  function endingHTML() {
    return `
      <div class="modalText">
        ${ENDING.paragraphs.map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class="infoCard">
        <h3>Meta de la propuesta</h3>
        <p>Que cada estudiante encuentre un lugar para aprender, convivir y disfrutar siendo parte viva de la comunidad escolar.</p>
      </div>
    `;
  }

  function resetModalScroll() {
    modalOverlay.scrollTop = 0;
    modalBox.scrollTop = 0;
    modalBody.scrollTop = 0;
  }

  function openStation(key, trigger = null) {
    const s = STATIONS[key];
    if (!s) return;

    visited.add(key);
    updateHud();
    lastFocus = trigger || document.activeElement;

    modalTag.textContent = s.zona;
    modalTitle.textContent = s.nombre;
    modalBody.innerHTML = stationHTML(s);

    restartBtn.classList.add('hidden');
    closeBtn.textContent = 'Cerrar';
    modalOverlay.style.display = 'flex';
    modalOverlay.setAttribute('aria-hidden', 'false');
    resetModalScroll();

    document.addEventListener('keydown', trapFocus);
    (modalFocusable()[0] || modalBox).focus();
    requestAnimationFrame(resetModalScroll);
    updateRotateHint();
  }

  function openEnding(trigger = null) {
    lastFocus = trigger || document.activeElement;
    modalTag.textContent = ENDING.tag;
    modalTitle.textContent = ENDING.title;
    modalBody.innerHTML = endingHTML();

    restartBtn.classList.remove('hidden');
    closeBtn.textContent = 'Cerrar';
    modalOverlay.style.display = 'flex';
    modalOverlay.setAttribute('aria-hidden', 'false');
    resetModalScroll();

    document.addEventListener('keydown', trapFocus);
    (modalFocusable()[0] || modalBox).focus();
    requestAnimationFrame(resetModalScroll);
    updateRotateHint();
  }

  function resetGame() {
    visited.clear();
    updateHud();
    closeModal();

    player.x = MAIN_PATH.minX;
    player.y = MAIN_PATH.y;
    player.facing = 1;
    player.walking = false;
    player.walkFrame = 0;

    moveVec.x = 0;
    moveVec.y = 0;
    centerStick();

    started = false;
    rotateDismissed = false;
    welcomeOverlay.style.display = 'flex';
    updateRotateHint();
  }

  function performAction(trigger = null) {
    if (actionLock || isModalOpen() || !started) return;
    actionLock = true;
    interact(trigger);
    window.setTimeout(() => { actionLock = false; }, 220);
  }

  function interact(trigger = null) {
    const nearby = getNearbyStation(player);
    const nearExit = getNearbyExit(player);

    if (nearby) openStation(nearby.key, trigger);
    else if (nearExit) openEnding(trigger);
  }

  function keyboardVector() {
    let dx = 0;
    let dy = 0;

    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright'] || keys['d']) dx += 1;
    if (keys['arrowup'] || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;

    return { dx, dy };
  }

  function inputVector() {
    const kb = keyboardVector();
    return {
      dx: Math.max(-1, Math.min(1, kb.dx + moveVec.x)),
      dy: Math.max(-1, Math.min(1, kb.dy + moveVec.y))
    };
  }

  function updateMovement() {
    if (!started || isModalOpen()) return;

    const { dx, dy } = inputVector();
    const movingNow = Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15;

    player.walking = movingNow;
    if (movingNow) player.walkFrame += 1;

    if (dx < -0.15) player.facing = -1;
    else if (dx > 0.15) player.facing = 1;

    const branch = getNearestBranch(player, 48);
    const onBranch = branch && Math.abs(player.x - branch.x) <= 3 && player.y < branch.baseY;

    if (onBranch) {
      if (dy < -0.15) {
        player.y -= player.speed * Math.abs(dy);
        if (player.y < branch.topY) player.y = branch.topY;
      }

      if (dy > 0.15) {
        player.y += player.speed * Math.abs(dy);
        if (player.y > branch.baseY) player.y = branch.baseY;
      }

      if (dx < -0.15) {
        player.y = branch.baseY;
        player.x -= player.speed * Math.abs(dx);
      }

      if (dx > 0.15) {
        player.y = branch.baseY;
        player.x += player.speed * Math.abs(dx);
      }
    } else {
      if (dx < -0.15) player.x -= player.speed * Math.abs(dx);
      if (dx > 0.15) player.x += player.speed * Math.abs(dx);

      if (dy < -0.15 && branch) {
        player.x += (branch.x - player.x) * 0.3;
        player.y -= player.speed * Math.abs(dy);

        if (Math.abs(player.x - branch.x) < 1.2) player.x = branch.x;
        if (player.y < branch.topY) player.y = branch.topY;
      }

      if (dy > 0.15) player.y = MAIN_PATH.y;
    }

    clampPlayerToWalkable(player);
  }

  function loop() {
    updateMovement();
    drawScene(ctx, player, visited);
    requestAnimationFrame(loop);
  }

  function centerStick() {
    joystickStick.style.left = '31px';
    joystickStick.style.top = '31px';
  }

  function updateJoystick(clientX, clientY) {
    if (isModalOpen()) return;

    const rect = joystickZone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = clientX - cx;
    let dy = clientY - cy;

    const max = rect.width / 2 - 16;
    const dist = Math.hypot(dx, dy);

    if (dist > max) {
      dx = (dx / dist) * max;
      dy = (dy / dist) * max;
    }

    joystickStick.style.left = `${31 + dx}px`;
    joystickStick.style.top = `${31 + dy}px`;

    moveVec.x = dx / max;
    moveVec.y = dy / max;
    joystickActive = true;
  }

  function endJoystick() {
    moveVec.x = 0;
    moveVec.y = 0;
    joystickActive = false;
    centerStick();
  }

  function canvasPointToGame(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function nearestTappedStation(point) {
    let best = null;

    for (const key in MAP_STATIONS) {
      const s = MAP_STATIONS[key];
      const dist = Math.hypot(point.x - s.x, point.y - s.y);
      if (dist <= 70 && (!best || dist < best.dist)) best = { key, ...s, dist };
    }

    return best;
  }

  async function requestLandscape() {
    const root = document.documentElement;
    try {
      if (root.requestFullscreen) await root.requestFullscreen();
      if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
    } catch (err) {}
  }

  function updateRotateHint() {
    if (!rotateHint) return;
    const shouldShow = started && isMobileLike() && isPortrait() && !isModalOpen() && !rotateDismissed;
    rotateHint.classList.toggle('show', !!shouldShow);
    rotateHint.setAttribute('aria-hidden', String(!shouldShow));
  }

  function startExperience() {
    started = true;
    welcomeOverlay.style.display = 'none';
    canvas.focus();
    updateRotateHint();
  }

  startBtn.addEventListener('click', startExperience);
  closeBtn.addEventListener('click', closeModal);
  restartBtn.addEventListener('click', resetGame);

  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });

  window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();

    if (key === 'escape' && isModalOpen()) {
      e.preventDefault();
      closeModal();
      return;
    }

    if (isModalOpen()) return;

    keys[key] = true;

    if (key === 'e' && !e.repeat) {
      e.preventDefault();
      performAction(canvas);
    }
  });

  window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

  window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
    endJoystick();
  });

  btnAction.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();
    performAction(btnAction);
  });

  btnAction.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    performAction(btnAction);
  });

  if (btnRotate) btnRotate.addEventListener('click', async () => {
    rotateDismissed = true;
    updateRotateHint();
    await requestLandscape();
  });

  if (rotateNowBtn) rotateNowBtn.addEventListener('click', async () => {
    rotateDismissed = true;
    updateRotateHint();
    await requestLandscape();
  });

  if (rotateCloseBtn) rotateCloseBtn.addEventListener('click', () => {
    rotateDismissed = true;
    updateRotateHint();
  });

  window.addEventListener('resize', updateRotateHint);
  window.addEventListener('orientationchange', updateRotateHint);

  joystickZone.addEventListener('pointerdown', e => {
    e.preventDefault();
    joystickZone.setPointerCapture(e.pointerId);
    updateJoystick(e.clientX, e.clientY);
  });

  joystickZone.addEventListener('pointermove', e => {
    if (!joystickActive) return;
    e.preventDefault();
    updateJoystick(e.clientX, e.clientY);
  });

  joystickZone.addEventListener('pointerup', e => {
    e.preventDefault();
    endJoystick();
  });

  joystickZone.addEventListener('pointercancel', e => {
    e.preventDefault();
    endJoystick();
  });

  canvas.addEventListener('pointerdown', e => {
    if (isModalOpen()) return;

    const pt = canvasPointToGame(e.clientX, e.clientY);
    const station = nearestTappedStation(pt);

    if (station) {
      const previousX = player.x;
      const targetX = BRANCHES[station.key].x;
      player.facing = targetX < previousX ? -1 : 1;
      player.walking = false;
      player.x = targetX;
      player.y = BRANCHES[station.key].topY;
      clampPlayerToWalkable(player);
      openStation(station.key, canvas);
    }
  });

  if (loadingEl) loadingEl.style.display = 'none';
  updateHud();
  centerStick();
  updateRotateHint();
  loop();
});