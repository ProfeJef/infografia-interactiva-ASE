const GAME = { width: 1024, height: 576 };

const ASSETS = {
  background: new Image(),
  avatar: new Image()
};

ASSETS.background.src = 'assets/FONDO-INFOGRAFIA.png';
ASSETS.avatar.src = 'assets/avatar-1.png';

const MAIN_PATH = { minX: 60, maxX: 1015, y: 445 };

const BRANCHES = {
  d1: { x: 177, topY: 400, baseY: 445 },
  d2: { x: 345, topY: 400, baseY: 445 },
  d3: { x: 518, topY: 400, baseY: 445 },
  d4: { x: 695, topY: 400, baseY: 445 },
  d5: { x: 872, topY: 400, baseY: 445 }
};

const MAP_STATIONS = {
  d1: { x: 177, y: 400, r: 42 },
  d2: { x: 345, y: 400, r: 42 },
  d3: { x: 518, y: 400, r: 42 },
  d4: { x: 695, y: 400, r: 42 },
  d5: { x: 872, y: 400, r: 42 }
};

const EXIT_POINT = { key: 'exit', x: 1015, y: 445, r: 32, label: 'SALIR' };

function isAssetReady(img){
  return img && img.complete && img.naturalWidth > 0;
}

function drawBackground(ctx){
  if(isAssetReady(ASSETS.background)){
    ctx.drawImage(ASSETS.background, 0, 0, GAME.width, GAME.height);
  }else{
    const g = ctx.createLinearGradient(0,0,0,GAME.height);
    g.addColorStop(0,'#76c3ff');
    g.addColorStop(1,'#cfefff');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,GAME.width,GAME.height);
  }
}

function drawAvatar(ctx, player){
  const facing = player.facing === -1 ? -1 : 1;
  const bob = player.walking ? Math.sin((player.walkFrame || 0) * 0.45) * 2 : 0;
  const tilt = player.walking ? Math.sin((player.walkFrame || 0) * 0.45) * 0.04 : 0;

  ctx.save();
  ctx.translate(player.x, player.y - 38 + bob);
  ctx.scale(facing, 1);
  ctx.rotate(tilt);

  if(isAssetReady(ASSETS.avatar)){
    ctx.drawImage(ASSETS.avatar, -30, -36, 60, 82);
  }else{
    ctx.fillStyle = '#d83a2e';
    ctx.fillRect(-12, 10, 24, 28);
  }

  if(player.walking){
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const legSwing = Math.sin((player.walkFrame || 0) * 0.45) * 5;
    ctx.beginPath();
    ctx.moveTo(-6, 42);
    ctx.lineTo(-8 - legSwing, 53);
    ctx.moveTo(6, 42);
    ctx.lineTo(8 + legSwing, 53);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPointGlow(ctx,x,y,r,active=false,color='255,245,170'){
  ctx.save();
  const pulse = .5 + .5 * Math.sin(Date.now() * .005);
  const radius = active ? r + 14 + pulse * 4 : r + 6 + pulse * 2;
  const grad = ctx.createRadialGradient(x,y,6,x,y,radius);
  grad.addColorStop(0,`rgba(${color},0.34)`);
  grad.addColorStop(.6,`rgba(${color},0.12)`);
  grad.addColorStop(1,`rgba(${color},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x,y,radius,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawVisitedBadge(ctx,x,y,r){
  ctx.save();
  const bx = x + r - 8;
  const by = y - r + 8;
  ctx.fillStyle = '#35a853';
  ctx.strokeStyle = '#173d23';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(bx,by,12,0,Math.PI*2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(bx-4,by);
  ctx.lineTo(bx-1,by+4);
  ctx.lineTo(bx+5,by-5);
  ctx.stroke();
  ctx.restore();
}

function drawHint(ctx,x,y,text){
  ctx.save();
  ctx.fillStyle = 'rgba(26,16,8,.85)';
  ctx.fillRect(x-82,y-102,164,30);
  ctx.strokeStyle = '#f8efcf';
  ctx.lineWidth = 2;
  ctx.strokeRect(x-82,y-102,164,30);
  ctx.fillStyle = '#fffdf4';
  ctx.font = '18px VT323';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text,x,y-87);
  ctx.restore();
}

function drawLegend(ctx){
  ctx.save();
  ctx.fillStyle='rgba(33,20,10,.84)';
  ctx.fillRect(18,18,246,52);
  ctx.strokeStyle='#f6dfa7';
  ctx.lineWidth=2;
  ctx.strokeRect(18,18,246,52);
  ctx.fillStyle='#fff8dd';
  ctx.font='18px VT323';
  ctx.fillText('Mover: Flechas / WASD',28,39);
  ctx.fillText('Abrir: E o toque',28,60);
  ctx.restore();
}

function getNearestBranch(player,tolerance=48){
  let best = null;
  for(const key in BRANCHES){
    const b = BRANCHES[key];
    const dx = Math.abs(player.x - b.x);
    if(dx <= tolerance && (!best || dx < best.dx)) best = { key, ...b, dx };
  }
  return best;
}

function getNearbyStation(player){
  for(const key in MAP_STATIONS){
    const s = MAP_STATIONS[key];
    const dist = Math.hypot(player.x - s.x, player.y - s.y);
    if(dist <= s.r) return { key, ...s };
  }
  return null;
}

function getNearbyExit(player){
  const dist = Math.hypot(player.x - EXIT_POINT.x, player.y - EXIT_POINT.y);
  return dist <= EXIT_POINT.r ? EXIT_POINT : null;
}

function clampPlayerToWalkable(player){
  player.x = Math.max(MAIN_PATH.minX, Math.min(MAIN_PATH.maxX, player.x));
  player.y = Math.max(400, Math.min(445, player.y));
}

function drawScene(ctx,player,visited=new Set()){
  drawBackground(ctx);
  drawLegend(ctx);

  const nearby = getNearbyStation(player);
  const nearExit = getNearbyExit(player);

  for(const key in MAP_STATIONS){
    const s = MAP_STATIONS[key];
    drawPointGlow(ctx,s.x,s.y,s.r,nearby && nearby.key === key);
    if(visited.has(key)) drawVisitedBadge(ctx,s.x,s.y,s.r);
  }

  drawPointGlow(ctx,EXIT_POINT.x,EXIT_POINT.y,EXIT_POINT.r,!!nearExit,'255,150,150');
  drawAvatar(ctx,player);

  if(nearby){
    drawHint(ctx,player.x,player.y,'Abrir: E');
  }else if(nearExit){
    drawHint(ctx,player.x,player.y,'Final: E');
  }
}