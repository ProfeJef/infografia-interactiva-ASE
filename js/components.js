const GAME = {
  width: 1024,
  height: 576
};

const ASSETS = {
  background: new Image(),
  avatar: new Image()
};

ASSETS.background.src = 'assets/FONDO-INFOGRAFÍA.png';
ASSETS.avatar.src = 'assets/avatar-1.png';

const MAIN_PATH = {
  minX: 60,
  maxX: 1015,
  y: 445
};

const BRANCHES = {
  d1: { x: 177, topY: 400, baseY: 445 },
  d2: { x: 345, topY: 400, baseY: 445 },
  d3: { x: 518, topY: 400, baseY: 445 },
  d4: { x: 695, topY: 400, baseY: 445 },
  d5: { x: 872, topY: 400, baseY: 445 }
};

const MAP_STATIONS = {
  d1: { x: 177, y: 400, r: 42, label: 'LUNES' },
  d2: { x: 345, y: 400, r: 42, label: 'MARTES' },
  d3: { x: 518, y: 400, r: 42, label: 'MIERCOLES' },
  d4: { x: 695, y: 400, r: 42, label: 'JUEVES' },
  d5: { x: 872, y: 400, r: 42, label: 'VIERNES' }
};

const EXIT_POINT = {
  key: 'exit',
  x: 1015,
  y: 445,
  r: 32,
  label: 'SALIR'
};

function isAssetReady(img) {
  return img && img.complete && img.naturalWidth > 0;
}

function drawBackground(ctx) {
  if (isAssetReady(ASSETS.background)) {
    ctx.drawImage(ASSETS.background, 0, 0, GAME.width, GAME.height);
  } else {
    ctx.fillStyle = '#8fd6f0';
    ctx.fillRect(0, 0, GAME.width, GAME.height);
  }
}

function drawAvatar(ctx, player) {
  if (isAssetReady(ASSETS.avatar)) {
    const w = 60;
    const h = 82;
    ctx.drawImage(ASSETS.avatar, player.x - w / 2, player.y - h + 8, w, h);
  } else {
    ctx.fillStyle = '#d62828';
    ctx.fillRect(player.x - 10, player.y - 24, 20, 24);
  }
}

function drawPointGlow(ctx, x, y, r, active = false, color = '255,255,180') {
  ctx.save();

  const radius = active ? r + 10 : Math.max(10, r - 8);
  const alpha = active ? 0.35 : 0.12;

  const gradient = ctx.createRadialGradient(x, y, 6, x, y, radius);
  gradient.addColorStop(0, `rgba(${color},${alpha})`);
  gradient.addColorStop(1, `rgba(${color},0)`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function getNearestBranch(player, tolerance = 48) {
  let best = null;

  for (const key in BRANCHES) {
    const b = BRANCHES[key];
    const dx = Math.abs(player.x - b.x);

    if (dx <= tolerance && (!best || dx < best.dx)) {
      best = { key, ...b, dx };
    }
  }

  return best;
}

function getNearbyStation(player) {
  for (const key in MAP_STATIONS) {
    const s = MAP_STATIONS[key];
    const dist = Math.hypot(player.x - s.x, player.y - s.y);
    if (dist <= s.r) return { key, ...s };
  }
  return null;
}

function getNearbyExit(player) {
  const dist = Math.hypot(player.x - EXIT_POINT.x, player.y - EXIT_POINT.y);
  return dist <= EXIT_POINT.r ? EXIT_POINT : null;
}

function drawHint(ctx, x, y, text) {
  ctx.save();

  ctx.fillStyle = 'rgba(0,0,0,0.84)';
  ctx.fillRect(x - 60, y - 96, 120, 30);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 60, y - 96, 120, 30);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px VT323, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y - 76);

  ctx.restore();
}

function clampPlayerToWalkable(player) {
  player.x = Math.max(MAIN_PATH.minX, Math.min(MAIN_PATH.maxX, player.x));
  player.y = Math.max(400, Math.min(445, player.y));
}

function drawScene(ctx, player) {
  drawBackground(ctx);

  const nearby = getNearbyStation(player);
  const nearExit = getNearbyExit(player);

  for (const key in MAP_STATIONS) {
    const s = MAP_STATIONS[key];
    drawPointGlow(ctx, s.x, s.y, s.r, nearby && nearby.key === key);
  }

  drawPointGlow(
    ctx,
    EXIT_POINT.x,
    EXIT_POINT.y,
    EXIT_POINT.r,
    !!nearExit,
    '255,120,120'
  );

  drawAvatar(ctx, player);

  if (nearby) {
    drawHint(ctx, player.x, player.y, 'E o tocar');
  } else if (nearExit) {
    drawHint(ctx, player.x, player.y, 'Salir: E');
  }
}
