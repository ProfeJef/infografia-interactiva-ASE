/* ==========================================================================
   ESTADO GLOBAL DE LA APLICACIÓN
   ========================================================================== */
const state = {
  currentPage: 1,
  totalPages: 4,
  maze: { index: 0, correct: 0 },
};

const modalContent = {
  cheat: {
    title: "🤖 Usar IA para copiar la tarea",
    body: "Cuando delegas todo el pensamiento a la IA sin comprender el proceso, tu cerebro no fortalece las rutas neuronales del aprendizaje. A corto plazo sientes alivio, pero a largo plazo pierdes confianza en tus propias capacidades.",
    tags: ["Dependencia cognitiva", "Pérdida de autoconfianza", "Aprendizaje superficial"],
  },
  rumor: {
    title: "🗣️ Compartir un rumor sin verificar",
    body: "Reenviar información sin confirmar su veracidad puede dañar la reputación de otra persona en minutos. Emocionalmente, quien lo recibe siente ansiedad, vergüenza o exclusión, efectos que pueden durar mucho más que el mensaje mismo.",
    tags: ["Daño reputacional", "Ansiedad social", "Pérdida de confianza"],
  },
  anger: {
    title: "😡 Responder con rabia",
    body: "Contestar impulsivamente activa la amígdala cerebral, la zona de reacciones instintivas, antes de que la corteza prefrontal (razonamiento) pueda intervenir. Una pausa de 10 segundos permite responder desde la calma, no desde el impulso.",
    tags: ["Reacción amigdalar", "Escalamiento del conflicto", "Regulación emocional"],
  },
};

const toneProfiles = {
  cruel:   { meter: 92, state: "Se siente herida y ansiosa 😢", face: "#f7a1a1", eyeH: "6px", mouth: "frown", tear: true },
  neutral: { meter: 40, state: "Se siente insegura, pero tranquila 😐", face: "#ffe9a8", eyeH: "14px", mouth: "flat", tear: false },
  kind:    { meter: 8,  state: "Se siente apoyada y en calma 😊", face: "#c9f2d8", eyeH: "14px", mouth: "smile", tear: false },
};

const mazeCheckpoints = [
  {
    clue: "Titular: '¡Esta fruta cura el 100% de las enfermedades, los médicos están ocultándolo!' — Fuente: blog sin autor, sin fecha.",
    isFake: true,
    explain: "Correcto: las afirmaciones absolutas ('100%') y la falta de autor/fecha son señales clásicas de clickbait o desinformación.",
  },
  {
    clue: "Artículo publicado por el Ministerio de Educación con datos estadísticos, fecha y autor verificable.",
    isFake: false,
    explain: "Correcto: fuente oficial, con autoría y datos verificables, es información confiable.",
  },
  {
    clue: "Titular: 'No creerás lo que hizo esta celebridad, haz clic para ver el video impactante'.",
    isFake: true,
    explain: "Correcto: el lenguaje sensacionalista busca generar clics, no informar. Es clickbait.",
  },
  {
    clue: "Publicación de una universidad citando un estudio revisado por pares, con enlace a la fuente original.",
    isFake: false,
    explain: "Correcto: la trazabilidad a una fuente académica primaria es un fuerte indicador de confiabilidad.",
  },
];

function initParticles() {
  const container = document.getElementById("particles");
  const colors = ["#5b8cff", "#34e0d0", "#ff7a6b", "#e0d4ff", "#ffd6b8"];
  const count = 26;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 5 + 3;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = `${Math.random() * 12 + 10}s`;
    p.style.animationDelay = `${Math.random() * 10}s`;
    p.style.bottom = `-10px`;
    container.appendChild(p);
  }
}

function goToPage(pageNum) {
  if (pageNum < 1 || pageNum > state.totalPages) return;
  document.querySelectorAll(".page").forEach((sec) => sec.classList.remove("active"));
  document.querySelector(`#page-${pageNum}`).classList.add("active");

  document.querySelectorAll(".dot").forEach((dot) => dot.classList.remove("active"));
  document.querySelector(`.dot[data-page="${pageNum}"]`).classList.add("active");

  state.currentPage = pageNum;
  document.getElementById("pageIndicator").textContent = `Página ${pageNum} de ${state.totalPages}`;
  document.getElementById("btnPrev").disabled = pageNum === 1;
  document.getElementById("btnNext").disabled = pageNum === state.totalPages;
}

function initFooterNav() {
  document.getElementById("btnPrev").addEventListener("click", () => goToPage(state.currentPage - 1));
  document.getElementById("btnNext").addEventListener("click", () => goToPage(state.currentPage + 1));
  document.querySelectorAll(".dot").forEach((dot) => {
    dot.addEventListener("click", () => goToPage(Number(dot.dataset.page)));
  });
}

function initPauseModals() {
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  const tagsEl = document.getElementById("modalTags");

  document.querySelectorAll(".impulse-card").forEach((card) => {
    card.addEventListener("click", () => {
      const data = modalContent[card.dataset.modal];
      titleEl.textContent = data.title;
      bodyEl.textContent = data.body;
      tagsEl.innerHTML = data.tags.map((t) => `<span>${t}</span>`).join("");
      overlay.classList.add("open");
    });
  });

  function closeModal() { overlay.classList.remove("open"); }
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalAck").addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
}

function analyzeTone(text) {
  const lower = text.toLowerCase();
  const cruelWords = ["tonto", "idiota", "estúpido", "torpe", "odio", "jajaja qué", "cállate"];
  const kindWords = ["lamento", "aquí estoy", "gracias", "perdón", "te entiendo", "apoyo", "estás bien"];

  const isCruel = cruelWords.some((w) => lower.includes(w));
  const isKind = kindWords.some((w) => lower.includes(w));

  if (isCruel) return "cruel";
  if (isKind) return "kind";
  return "neutral";
}

function updateAvatar(toneKey) {
  const profile = toneProfiles[toneKey];
  document.getElementById("meterFill").style.width = `${profile.meter}%`;
  document.getElementById("avatarState").textContent = profile.state;
  document.getElementById("avatarFace").style.background = profile.face;
  document.getElementById("avatarTear").style.opacity = profile.tear ? "1" : "0";

  document.querySelectorAll(".eye").forEach((eye) => (eye.style.height = profile.eyeH));

  const mouth = document.getElementById("avatarMouth");
  mouth.style.borderRadius = "";
  mouth.style.transform = "";
  if (profile.mouth === "smile") {
    mouth.style.borderRadius = "0 0 50px 50px";
    mouth.style.transform = "rotate(0deg)";
  } else if (profile.mouth === "frown") {
    mouth.style.borderRadius = "50px 50px 0 0";
    mouth.style.transform = "translateY(10px)";
  } else {
    mouth.style.borderRadius = "0";
    mouth.style.transform = "translateY(0)";
  }
}

function initEmpathySimulator() {
  const input = document.getElementById("chatInput");
  input.addEventListener("input", () => updateAvatar(analyzeTone(input.value)));

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      input.value = chip.textContent.replace(/["\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}]/gu, "").trim();
      updateAvatar(chip.dataset.tone);
    });
  });

  updateAvatar("neutral");
}

function renderCheckpoint() {
  const stage = document.getElementById("checkpointStage");
  const feedback = document.getElementById("mazeFeedback");
  feedback.classList.remove("show", "correct", "incorrect");

  if (state.maze.index >= mazeCheckpoints.length) {
    stage.innerHTML = `
      <div class="clue-box">
        <h3 class="checkpoint-title">🏁 ¡Ruta completada!</h3>
        <p>Clasificaste correctamente ${state.maze.correct} de ${mazeCheckpoints.length} publicaciones. La verificación constante de fuentes es clave para una ciudadanía digital responsable.</p>
      </div>`;
    document.getElementById("mazeProgress").style.width = "100%";
    return;
  }

  const cp = mazeCheckpoints[state.maze.index];
  stage.innerHTML = `
    <div class="clue-box">
      <h3 class="checkpoint-title">Punto de control ${state.maze.index + 1} de ${mazeCheckpoints.length}</h3>
      <p>${cp.clue}</p>
    </div>
    <div class="checkpoint-actions">
      <button class="btn-choice fake" data-choice="fake">🚩 Fake news / Clickbait</button>
      <button class="btn-choice verified" data-choice="verified">✅ Información verificada</button>
    </div>`;

  document.querySelectorAll(".btn-choice").forEach((btn) => {
    btn.addEventListener("click", () => handleMazeChoice(btn.dataset.choice === "fake", cp));
  });

  const pct = (state.maze.index / mazeCheckpoints.length) * 100;
  document.getElementById("mazeProgress").style.width = `${pct}%`;
}

function handleMazeChoice(choseFake, checkpoint) {
  const feedback = document.getElementById("mazeFeedback");
  const isCorrect = choseFake === checkpoint.isFake;
  if (isCorrect) state.maze.correct += 1;

  feedback.textContent = checkpoint.explain;
  feedback.classList.add("show", isCorrect ? "correct" : "incorrect");

  setTimeout(() => {
    state.maze.index += 1;
    renderCheckpoint();
  }, 1600);
}

function launchConfetti() {
  const layer = document.getElementById("confettiLayer");
  const colors = ["#5b8cff", "#34e0d0", "#ff7a6b", "#ffd166", "#e0d4ff"];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    layer.appendChild(piece);
    setTimeout(() => piece.remove(), 2200);
  }
}

function initCommitmentChecklist() {
  const checks = document.querySelectorAll(".commit-check");
  const badge = document.getElementById("badgeMedal");
  const caption = document.getElementById("badgeCaption");
  const title = document.getElementById("badgeTitle");
  let wasUnlocked = false;

  function updateBadge() {
    const total = checks.length;
    const checked = [...checks].filter((c) => c.checked).length;

    if (checked === total) {
      badge.classList.add("unlocked");
      title.textContent = "🏆 ¡Insignia desbloqueada!";
      caption.textContent = "Líder Digital Consciente";
      if (!wasUnlocked) { launchConfetti(); wasUnlocked = true; }
    } else {
      badge.classList.remove("unlocked");
      title.textContent = "Insignia bloqueada";
      caption.textContent = `Completa los ${total} compromisos para desbloquearla (${checked}/${total})`;
      wasUnlocked = false;
    }
  }

  checks.forEach((c) => c.addEventListener("change", updateBadge));
  updateBadge();
}

document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  initFooterNav();
  initPauseModals();
  initEmpathySimulator();
  renderCheckpoint();
  initCommitmentChecklist();
});
