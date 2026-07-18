document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const loadingEl = document.getElementById('loading');
  const welcomeOverlay = document.getElementById('welcomeOverlay');
  const startBtn = document.getElementById('startBtn');

  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const aseBar = document.getElementById('aseBar');
  const weekBar = document.getElementById('weekBar');
  const flowBar = document.getElementById('flowBar');
  const asePct = document.getElementById('asePct');
  const weekPct = document.getElementById('weekPct');
  const flowPct = document.getElementById('flowPct');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalTag = document.getElementById('modalTag');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const closeBtn = document.getElementById('closeBtn');

  const joystickZone = document.getElementById('joystickZone');
  const joystickStick = document.getElementById('joystickStick');
  const btnAction = document.getElementById('btnAction');

  const btnRotate = document.getElementById('btnRotate');
  const btnBack = document.getElementById('btnBack');
  const rotateHint = document.getElementById('rotateHint');
  const rotateNowBtn = document.getElementById('rotateNowBtn');
  const rotateCloseBtn = document.getElementById('rotateCloseBtn');

  canvas.width = GAME.width;
  canvas.height = GAME.height;

  const visited = new Set();
  const keys = {};
  let started = false;
  let rotateDismissed = false;

  const player = {
    x: MAIN_PATH.minX,
    y: MAIN_PATH.y,
    speed: 3
  };

  let moveVec = { x: 0, y: 0 };
  let joystickActive = false;

  function isMobileLike() {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  function updateHud() {
    const total = Object.keys(MAP_STATIONS).length;
    const done = visited.size;
    const pct = total ? Math.round((done / total) * 100) : 0;

    if (progressFill) progressFill.style.width = pct + '%';
    if (progressText) progressText.textContent = `${done}/${total} días`;

    if (aseBar) aseBar.style.width = pct + '%';
    if (weekBar) weekBar.style.width = pct + '%';
    if (flowBar) flowBar.style.width = pct + '%';

    if (asePct) asePct.textContent = pct + '%';
    if (weekPct) weekPct.textContent = pct + '%';
    if (flowPct) flowPct.textContent = pct + '%';
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.style.display = 'none';
  }

  function openStation(key) {
    if (typeof STATIONS === 'undefined' || !STATIONS[key]) return;

    const s = STATIONS[key];
    visited.add(key);
    updateHud();

    if (modalTag) modalTag.textContent = s.zona || 'DÍA';
    if (modalTitle) modalTitle.textContent = s.nombre || '';

    if (modalBody) {
      modalBody.className = s.zona ? String(s.zona).toLowerCase() : '';
      modalBody.innerHTML = `
        ${s.imagen ? `<img src="${s.imagen}" alt="${s.nombre || 'Imagen del día'}" class="stationImage">` : ''}
        <p><strong>Contexto:</strong> ${s.contexto || ''}</p>
        <p><strong>Enfoque:</strong> ${s.enfoque || ''}</p>
        <p><strong>Metodología:</strong> ${s.metodologia || ''}</p>
        <p><strong>TIC:</strong> ${s.tics || ''}</p>
        <p><strong>Aportes:</strong> ${s.aportes || ''}</p>
        ${s.fuente ? `<p><a href="${s.fuente}" target="_blank" rel="noopener noreferrer">Ver fuente</a></p>` : ''}
      `;
    }

    if (modalOverlay) modalOverlay.style.display = 'flex';
    updateRotateHint();
  }

  function resetGame() {
    visited.clear();
    updateHud();
    closeModal();

    player.x = MAIN_PATH.minX;
    player.y = MAIN_PATH.y;

    moveVec.x = 0;
    moveVec.y = 0;
    joystickActive = false;
    centerStick();

    started = false;
    rotateDismissed = false;

    if (welcomeOverlay) welcomeOverlay.style.display = 'flex';
    updateRotateHint();
  }

  function interact() {
    const nearby = getNearbyStation(player);
    const nearExit = getNearbyExit(player);

    if (nearby) {
      openStation(nearby.key);
    } else if (nearExit) {
      resetGame();
    }
  }

  function getKeyboardVector() {
    let dx = 0;
    let dy = 0;

    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright'] || keys['d']) dx += 1;
    if (keys['arrowup'] || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;

    return { dx, dy };
  }

  function getInputVector() {
    const kb = getKeyboardVector();
    let dx = kb.dx + moveVec.x;
    let dy = kb.dy + moveVec.y;

    dx = Math.max(-1, Math.min(1, dx));
    dy = Math.max(-1, Math.min(1, dy));

    return { dx, dy };
  }

  function updateMovement() {
    if (!started) return;

    const { dx, dy } = getInputVector();
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

      if (dy > 0.15) {
        player.y = MAIN_PATH.y;
      }
    }

    clampPlayerToWalkable(player);
  }

  function loop() {
    updateMovement();
    drawScene(ctx, player);
    requestAnimationFrame(loop);
  }

  function centerStick() {
    if (!joystickStick) return;
    joystickStick.style.left = '31px';
    joystickStick.style.top = '31px';
  }

  function updateJoystick(clientX, clientY) {
    if (!joystickZone || !joystickStick) return;

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

  async function requestLandscape() {
    const root = document.documentElement;

    try {
      if (root.requestFullscreen) {
        await root.requestFullscreen();
      }

      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (err) {
    }
  }

  async function exitLandscape() {
    try {
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    } catch (err) {
    }

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
    }

    rotateDismissed = false;
    updateRotateHint();
  }

  function updateRotateHint() {
    if (!rotateHint || !isMobileLike()) return;

    const portrait = window.matchMedia('(orientation: portrait)').matches;
    const modalOpen = modalOverlay && modalOverlay.style.display === 'flex';

    const shouldShow =
      started &&
      portrait &&
      !modalOpen &&
      !rotateDismissed;

    rotateHint.classList.toggle('show', !!shouldShow);
  }

  function canvasPointToGame(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function nearestTappedStation(point) {
    let best = null;

    for (const key in MAP_STATIONS) {
      const s = MAP_STATIONS[key];
      const dist = Math.hypot(point.x - s.x, point.y - s.y);

      if (dist <= 70 && (!best || dist < best.dist)) {
        best = { key, ...s, dist };
      }
    }

    return best;
  }

  function movePlayerNearStation(key) {
    const station = MAP_STATIONS[key];
    const branch = BRANCHES[key];
    if (!station || !branch) return;

    player.x = branch.x;
    player.y = branch.topY;
    clampPlayerToWalkable(player);
  }

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;

    if (key === 'escape') closeModal();

    if (key === 'e' && !e.repeat) {
      interact();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
    endJoystick();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      started = true;
      if (welcomeOverlay) welcomeOverlay.style.display = 'none';
      updateRotateHint();
    });
  }

  if (btnAction) {
    btnAction.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      interact();
    });
  }

  if (btnRotate) {
    btnRotate.addEventListener('click', async () => {
      rotateDismissed = true;
      if (rotateHint) rotateHint.classList.remove('show');
      await requestLandscape();
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', async () => {
      await exitLandscape();
    });
  }

  if (rotateNowBtn) {
    rotateNowBtn.addEventListener('click', async () => {
      rotateDismissed = true;
      if (rotateHint) rotateHint.classList.remove('show');
      await requestLandscape();
    });
  }

  if (rotateCloseBtn) {
    rotateCloseBtn.addEventListener('click', () => {
      rotateDismissed = true;
      if (rotateHint) rotateHint.classList.remove('show');
    });
  }

  if (joystickZone) {
    let dragging = false;

    const start = (clientX, clientY) => {
      dragging = true;
      updateJoystick(clientX, clientY);
    };

    const move = (clientX, clientY) => {
      if (!dragging) return;
      updateJoystick(clientX, clientY);
    };

    const end = () => {
      dragging = false;
      endJoystick();
    };

    joystickZone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      joystickZone.setPointerCapture(e.pointerId);
      start(e.clientX, e.clientY);
    });

    joystickZone.addEventListener('pointermove', (e) => {
      move(e.clientX, e.clientY);
    });

    joystickZone.addEventListener('pointerup', () => {
      end();
    });

    joystickZone.addEventListener('pointercancel', () => {
      end();
    });

    joystickZone.addEventListener('lostpointercapture', () => {
      end();
    });
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (!started) return;

    const point = canvasPointToGame(e.clientX, e.clientY);
    const tappedStation = nearestTappedStation(point);

    if (tappedStation) {
      movePlayerNearStation(tappedStation.key);
      interact();
      return;
    }

    const nearExitTap = Math.hypot(point.x - EXIT_POINT.x, point.y - EXIT_POINT.y) <= 56;

    if (nearExitTap) {
      player.x = EXIT_POINT.x;
      player.y = EXIT_POINT.y;
      interact();
    }
  });

  window.addEventListener('resize', updateRotateHint);
  window.addEventListener('orientationchange', updateRotateHint);

  document.addEventListener('fullscreenchange', () => {
    updateRotateHint();
  });

  updateHud();

  if (loadingEl) {
    loadingEl.style.display = 'none';
  }

  centerStick();
  updateRotateHint();
  loop();
});
