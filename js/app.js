/* Lógica do jogo — Show do Milhão (front-end only) */

const QUESTION_TIME = 30; // segundos por pergunta

const state = {
  levelIndex: 0,
  securedValue: 0,
  usedQuestionIndexByLevel: {},
  currentQuestion: null,
  lifelines: { pular: false, universitarios: false, computador: false },
  answered: false,
  timerId: null,
  timeLeft: QUESTION_TIME,
};

/* ---------- Helpers de navegação de tela ---------- */
// Qual trilha sonora deve tocar em cada tela (screen-decision mantém a música
// do jogo rolando, já que o jogador ainda está "dentro" da partida).
const MUSIC_BY_SCREEN = {
  "screen-start": "theme-music",
  "screen-game": "game-music",
  "screen-decision": "game-music",
};
const MUSIC_IDS = ["theme-music", "game-music"];

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  updateBackgroundMusic(MUSIC_BY_SCREEN[id] || null);
}

/* ---------- Músicas de fundo (tema de abertura / trilha do jogo) ---------- */
function updateBackgroundMusic(targetId) {
  MUSIC_IDS.forEach((musicId) => {
    const el = document.getElementById(musicId);
    if (!el) return;
    if (musicId === targetId) {
      playMusicElement(el);
    } else {
      el.pause();
    }
  });
}

function playMusicElement(music) {
  music.muted = AudioEngine.isMuted();
  const playPromise = music.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {
      // Autoplay bloqueado pelo navegador: tenta de novo no primeiro gesto do usuário.
      const retry = () => music.play().catch(() => {});
      document.addEventListener("click", retry, { once: true });
      document.addEventListener("keydown", retry, { once: true });
    });
  }
}

function formatMoney(v) {
  return "R$ " + v.toLocaleString("pt-BR");
}

/* ---------- Starfield de fundo ---------- */
function buildStarfield() {
  const field = document.getElementById("starfield");
  const count = 80;
  let html = "";
  for (let i = 0; i < count; i++) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const delay = Math.random() * 5;
    const size = Math.random() * 2 + 1;
    html += `<div class="star" style="top:${top}%;left:${left}%;animation-delay:${delay}s;width:${size}px;height:${size}px;"></div>`;
  }
  field.innerHTML = html;
}

/* ---------- Escada de prêmios ---------- */
function buildLadder() {
  const ladder = document.getElementById("ladder");
  let html = "";
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const lvl = LEVELS[i];
    const classes = ["ladder-row"];
    if (lvl.checkpoint) classes.push("checkpoint");
    html += `<div class="${classes.join(" ")}" data-level="${i}">
      <span class="ladder-num">${i + 1}</span>
      <span class="ladder-value">${lvl.label}</span>
      ${lvl.checkpoint ? '<span class="ladder-star">★</span>' : ""}
    </div>`;
  }
  ladder.innerHTML = html;
}

function updateLadderHighlight() {
  document.querySelectorAll(".ladder-row").forEach((row) => {
    row.classList.remove("current", "cleared");
    const idx = Number(row.dataset.level);
    if (idx === state.levelIndex) row.classList.add("current");
    else if (idx < state.levelIndex) row.classList.add("cleared");
  });
}

/* ---------- Novo jogo ---------- */
function startGame() {
  state.levelIndex = 0;
  state.securedValue = 0;
  state.usedQuestionIndexByLevel = {};
  state.lifelines = { pular: false, universitarios: false, computador: false };

  document.querySelectorAll(".card-lifeline").forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("used");
  });

  buildLadder();
  showScreen("screen-game");
  loadQuestion(0);
}

/* ---------- Carregar pergunta ---------- */
function pickQuestionForLevel(levelIndex) {
  const pool = QUESTION_POOL[levelIndex];
  const used = state.usedQuestionIndexByLevel[levelIndex] || [];
  let available = pool.map((_, i) => i).filter((i) => !used.includes(i));
  if (available.length === 0) {
    available = pool.map((_, i) => i);
    state.usedQuestionIndexByLevel[levelIndex] = [];
  }
  const choice = available[Math.floor(Math.random() * available.length)];
  state.usedQuestionIndexByLevel[levelIndex] = (state.usedQuestionIndexByLevel[levelIndex] || []).concat(choice);
  return pool[choice];
}

function loadQuestion(levelIndex) {
  state.levelIndex = levelIndex;
  state.answered = false;
  state.currentQuestion = pickQuestionForLevel(levelIndex);

  const lvl = LEVELS[levelIndex];
  document.getElementById("question-level").textContent = `PERGUNTA ${levelIndex + 1} — ${lvl.label}`;
  document.getElementById("question-text").textContent = state.currentQuestion.q;
  document.getElementById("hud-current-value").textContent = lvl.label;
  document.getElementById("hud-secured-value").textContent = formatMoney(state.securedValue);

  const optionButtons = document.querySelectorAll(".option-btn");
  optionButtons.forEach((btn, i) => {
    btn.querySelector(".opt-text").textContent = state.currentQuestion.opts[i];
    btn.classList.remove("selected", "correct", "wrong", "disabled-opt", "eliminated");
    btn.disabled = false;
  });

  updateLadderHighlight();
  AudioEngine.playNextQuestion();
  startTimer();
}

/* ---------- Timer ---------- */
function startTimer() {
  clearInterval(state.timerId);
  state.timeLeft = QUESTION_TIME;
  const fg = document.getElementById("timer-fg");
  const text = document.getElementById("timer-text");
  const circumference = 2 * Math.PI * 45;
  fg.style.strokeDasharray = `${circumference}`;
  fg.style.strokeDashoffset = "0";
  fg.classList.remove("timer-warning");
  text.textContent = state.timeLeft;

  state.timerId = setInterval(() => {
    state.timeLeft--;
    text.textContent = state.timeLeft;
    const offset = circumference * (1 - state.timeLeft / QUESTION_TIME);
    fg.style.strokeDashoffset = `${offset}`;
    if (state.timeLeft <= 10) fg.classList.add("timer-warning");
    if (state.timeLeft <= 0) {
      clearInterval(state.timerId);
      handleTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerId);
}

function handleTimeUp() {
  if (state.answered) return;
  revealAnswer(-1); // nenhuma opção selecionada = errado
}

/* ---------- Seleção de resposta ---------- */
function onOptionClick(e) {
  const btn = e.currentTarget;
  if (state.answered || btn.classList.contains("eliminated")) return;
  const optIndex = Number(btn.dataset.opt);
  revealAnswer(optIndex);
}

function revealAnswer(selectedIndex) {
  state.answered = true;
  stopTimer();

  const correctIndex = state.currentQuestion.correct;
  const optionButtons = document.querySelectorAll(".option-btn");
  optionButtons.forEach((btn) => (btn.disabled = true));

  if (selectedIndex >= 0) {
    optionButtons[selectedIndex].classList.add("selected");
  }

  setTimeout(() => {
    optionButtons[correctIndex].classList.add("correct");
    if (selectedIndex >= 0 && selectedIndex !== correctIndex) {
      optionButtons[selectedIndex].classList.add("wrong");
    }
    if (selectedIndex === correctIndex) {
      AudioEngine.playCorrect();
    } else {
      AudioEngine.playWrong();
    }

    setTimeout(() => {
      if (selectedIndex === correctIndex) {
        handleCorrectAnswer();
      } else {
        handleWrongAnswer();
      }
    }, 1800);
  }, 900);
}

function handleCorrectAnswer() {
  const lvl = LEVELS[state.levelIndex];
  if (lvl.checkpoint) state.securedValue = lvl.value;

  if (state.levelIndex === LEVELS.length - 1) {
    winGame(lvl.value, true);
    return;
  }

  document.getElementById("decision-value").textContent = lvl.label;
  showScreen("screen-decision");
}

function handleWrongAnswer() {
  const correctText = state.currentQuestion.opts[state.currentQuestion.correct];
  document.getElementById("lose-correct-answer").textContent = correctText;
  document.getElementById("lose-value").textContent = formatMoney(state.securedValue);
  showScreen("screen-lose");
}

function winGame(amount, topPrize) {
  document.getElementById("win-title").textContent = topPrize ? "VOCÊ É MILIONÁRIO!" : "PARABÉNS!";
  document.getElementById("win-sub").textContent = "Você levou para casa:";
  document.getElementById("win-value").textContent = formatMoney(amount);
  launchConfetti();
  showScreen("screen-win");
}

/* ---------- Tela de decisão: parar ou continuar ---------- */
function onStopClick() {
  const lvl = LEVELS[state.levelIndex];
  winGame(lvl.value, false);
}

function onContinueClick() {
  const nextLevel = state.levelIndex + 1;
  showScreen("screen-game");
  loadQuestion(nextLevel);
}

/* ---------- Cartas (lifelines) ---------- */
function useLifeline(type) {
  if (state.lifelines[type] || state.answered) return;
  state.lifelines[type] = true;

  const btn = document.querySelector(`.card-lifeline[data-card="${type}"]`);
  btn.disabled = true;
  btn.classList.add("used");

  if (type === "pular") {
    loadQuestion(state.levelIndex);
  } else if (type === "universitarios") {
    showUniversitarios();
  } else if (type === "computador") {
    useComputador();
  }
}

function showUniversitarios() {
  const correctIndex = state.currentQuestion.correct;
  const percentages = [0, 0, 0, 0];
  const correctPct = 40 + Math.floor(Math.random() * 31); // 40-70%
  percentages[correctIndex] = correctPct;

  let remaining = 100 - correctPct;
  const others = [0, 1, 2, 3].filter((i) => i !== correctIndex);
  others.forEach((idx, i) => {
    if (i === others.length - 1) {
      percentages[idx] = remaining;
    } else {
      const slice = Math.floor(Math.random() * (remaining - (others.length - 1 - i)));
      percentages[idx] = slice;
      remaining -= slice;
    }
  });

  const container = document.getElementById("uni-bars");
  const letters = ["A", "B", "C", "D"];
  container.innerHTML = letters
    .map(
      (letter, i) => `
    <div class="bar-row">
      <span class="bar-letter">${letter}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${percentages[i]}%"></div></div>
      <span class="bar-pct">${percentages[i]}%</span>
    </div>`
    )
    .join("");

  document.getElementById("overlay-universitarios").classList.remove("hidden");
}

function useComputador() {
  const correctIndex = state.currentQuestion.correct;
  const wrongIndexes = [0, 1, 2, 3].filter((i) => i !== correctIndex);
  wrongIndexes.sort(() => Math.random() - 0.5);
  const toEliminate = wrongIndexes.slice(0, 2);

  toEliminate.forEach((idx) => {
    const btn = document.querySelector(`.option-btn[data-opt="${idx}"]`);
    btn.classList.add("eliminated");
    btn.disabled = true;
  });
}

/* ---------- Prompt pronto para gerar perguntas com IA ---------- */
const AI_PROMPT_TEMPLATE = `Você é um gerador de perguntas para um quiz estilo "Show do Milhão": 10 níveis de dificuldade crescente, prêmios crescentes, 4 alternativas por pergunta e apenas uma correta.

TEMA: [troque por qualquer assunto, ex: "História do Brasil", "Programação em Python", "Cinema dos anos 90"]

Gere exatamente 10 perguntas sobre esse tema, uma para cada nível de 1 a 10, com dificuldade crescente (nível 1 = muito fácil, nível 10 = extremamente difícil ou específico).

Regras obrigatórias:
- Cada pergunta deve ter exatamente 4 alternativas plausíveis, com tamanho e estilo parecidos entre si (evite alternativas óbvias por serem muito maiores/menores que as outras).
- Apenas uma alternativa correta por pergunta.
- Varie a posição da resposta certa entre as perguntas (não deixe sempre na mesma letra).
- Perguntas objetivas, sem ambiguidade, com resposta factual e verificável.
- Não inclua explicações, comentários, markdown ou qualquer texto fora do JSON.

Responda APENAS com um JSON válido, exatamente neste formato (sem \`\`\`json, sem texto antes ou depois):

{
  "titulo": "Nome do quiz sobre o tema escolhido",
  "perguntas": [
    {
      "nivel": 1,
      "pergunta": "Texto da pergunta",
      "alternativas": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correta": 0
    }
  ]
}

Onde "nivel" vai de 1 a 10 (uma pergunta por nível, sem repetir nível) e "correta" é o índice (0 a 3) da alternativa certa dentro da lista "alternativas".`;

function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const temp = document.createElement("textarea");
    temp.value = text;
    temp.style.position = "fixed";
    temp.style.opacity = "0";
    document.body.appendChild(temp);
    temp.focus();
    temp.select();
    try {
      document.execCommand("copy") ? resolve() : reject(new Error("execCommand copy falhou"));
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(temp);
    }
  });
}

/* ---------- Upload de perguntas personalizadas (JSON) ---------- */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showUploadError(errors) {
  document.getElementById("upload-error-list").innerHTML = errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("");
  document.getElementById("modal-upload-error").classList.remove("hidden");
}

function setUploadSourceLabel(text) {
  document.getElementById("upload-source-label").textContent = text;
}

function handleJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(reader.result);
    } catch (err) {
      showUploadError(["O arquivo selecionado não é um JSON válido: " + err.message]);
      return;
    }
    const result = loadCustomQuestionData(data);
    if (!result.ok) {
      showUploadError(result.errors);
      return;
    }
    const titlePart = result.title ? ` — "${result.title}"` : "";
    setUploadSourceLabel(`personalizado${titlePart} (${result.count} perguntas)`);
    document.getElementById("upload-status").innerHTML =
      `✅ ${result.count} perguntas carregadas com sucesso. <button id="btn-reset-questions" class="link-small link-button">Usar perguntas padrão</button>`;
    document.getElementById("btn-reset-questions").addEventListener("click", () => {
      resetQuestionsToDefault();
      setUploadSourceLabel("padrão (embutidas)");
      document.getElementById("upload-status").textContent = "";
    });
    buildLadder();
  };
  reader.onerror = () => showUploadError(["Não foi possível ler o arquivo selecionado."]);
  reader.readAsText(file);
}

/* ---------- Confete simples para vitória ---------- */
function launchConfetti() {
  const container = document.getElementById("confetti");
  container.innerHTML = "";
  const colors = ["#ffd700", "#ffffff", "#ffb703", "#fff8dc"];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 2 + "s";
    piece.style.animationDuration = 3 + Math.random() * 2 + "s";
    container.appendChild(piece);
  }
}

/* ---------- Inicialização ---------- */
document.addEventListener("DOMContentLoaded", () => {
  buildStarfield();
  buildLadder();

  document.getElementById("btn-play").addEventListener("click", startGame);
  document.getElementById("btn-play-again-win").addEventListener("click", startGame);
  document.getElementById("btn-play-again-lose").addEventListener("click", startGame);

  document.getElementById("btn-rules").addEventListener("click", () => {
    document.getElementById("modal-rules").classList.remove("hidden");
  });
  document.getElementById("btn-close-rules").addEventListener("click", () => {
    document.getElementById("modal-rules").classList.add("hidden");
  });

  document.querySelectorAll(".option-btn").forEach((btn) => btn.addEventListener("click", onOptionClick));

  document.querySelectorAll(".card-lifeline").forEach((btn) => {
    btn.addEventListener("click", () => useLifeline(btn.dataset.card));
  });

  document.getElementById("btn-close-uni").addEventListener("click", () => {
    document.getElementById("overlay-universitarios").classList.add("hidden");
  });

  document.getElementById("btn-stop").addEventListener("click", onStopClick);
  document.getElementById("btn-continue").addEventListener("click", onContinueClick);

  const fileInput = document.getElementById("json-upload");
  document.getElementById("btn-upload").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleJsonFile(file);
    fileInput.value = "";
  });

  document.getElementById("btn-format-help").addEventListener("click", () => {
    document.getElementById("modal-format-help").classList.remove("hidden");
  });
  document.getElementById("btn-close-format-help").addEventListener("click", () => {
    document.getElementById("modal-format-help").classList.add("hidden");
  });
  document.getElementById("btn-close-upload-error").addEventListener("click", () => {
    document.getElementById("modal-upload-error").classList.add("hidden");
  });

  const aiPromptText = document.getElementById("ai-prompt-text");
  aiPromptText.value = AI_PROMPT_TEMPLATE;
  document.getElementById("btn-ai-prompt").addEventListener("click", () => {
    document.getElementById("modal-ai-prompt").classList.remove("hidden");
  });
  document.getElementById("btn-close-ai-prompt").addEventListener("click", () => {
    document.getElementById("modal-ai-prompt").classList.add("hidden");
  });
  document.getElementById("btn-copy-prompt").addEventListener("click", () => {
    const btn = document.getElementById("btn-copy-prompt");
    copyTextToClipboard(aiPromptText.value)
      .then(() => {
        const original = btn.textContent;
        btn.textContent = "Copiado!";
        setTimeout(() => (btn.textContent = original), 1800);
      })
      .catch(() => {
        aiPromptText.focus();
        aiPromptText.select();
      });
  });

  const muteBtn = document.getElementById("btn-mute");
  let savedMute = false;
  try {
    savedMute = localStorage.getItem("showdomilhao_muted") === "1";
  } catch (e) {
    /* localStorage indisponível (ex.: navegação privada) — segue sem persistir a preferência */
  }
  AudioEngine.setMuted(savedMute);
  muteBtn.textContent = savedMute ? "🔇" : "🔊";

  MUSIC_IDS.forEach((musicId) => {
    const el = document.getElementById(musicId);
    el.volume = 0.45;
    el.muted = savedMute;
  });

  muteBtn.addEventListener("click", () => {
    const next = !AudioEngine.isMuted();
    AudioEngine.setMuted(next);
    muteBtn.textContent = next ? "🔇" : "🔊";
    MUSIC_IDS.forEach((musicId) => {
      document.getElementById(musicId).muted = next;
    });
    try {
      localStorage.setItem("showdomilhao_muted", next ? "1" : "0");
    } catch (e) {
      /* ignora falha ao persistir */
    }
  });

  updateBackgroundMusic(MUSIC_BY_SCREEN["screen-start"]);
});
