// app.js
(async function () {

  /* =========================
     CARGA SETTINGS
  ========================= */
  const settings = Settings.load();

  /* =========================
     CARGA IDIOMAS
  ========================= */
  let langData;
  try {
    langData = await fetch("lang.json").then(r => r.json());
  } catch (e) {
    console.error("Error cargando lang.json", e);
    return;
  }

  const t = langData[settings.lang] || langData.es;
  window.i18n = t;

  // Textos dinámicos
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.textContent = t[key];
  });

  /* =========================
     TECLADO FÍSICO
  ========================= */
  window.addEventListener("keydown", e => {
    if (!window.Game || Game.finished) return;

    const key = e.key.toUpperCase();

    // Letras (A-Z + Ñ)
    if (/^[A-ZÑ]$/.test(key)) {
      UI.handleInput(key);
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      UI.handleInput("BACK");
      return;
    }

    if (e.key === "Enter") {
      UI.handleInput("ENTER");
      return;
    }
  });

  /* =========================
     BOTONES SUPERIORES
  ========================= */
  document.getElementById("btnNew")?.addEventListener("click", () => {
    if (Game.row > 0 && !Game.finished) {
      UI.toast(t.confirmNew || "¿Desea terminar la partida actual?");
      return;
    }
    Game.reset();
    UI.renderBoard(Game.attempts, Game.numLetters);
    UI.updateBoard();
  });

  document.getElementById("btnSettings")?.addEventListener("click", () => {
    UI.toast(t.settings || "⚙️ Settings");
  });

  /* =========================
     FLUJO PRINCIPAL
  ========================= */
  if (settings.voclist) {
    const direct = window.voclists?.find(v => v.filename === settings.voclist);
    if (direct) {
      startGame(direct, settings);
      return;
    }
  }

  // Si no hay voclist → popup
  if (window.voclists?.length) {
    UI.showVocabPopup(window.voclists, selected => {
      startGame(selected, settings);
    });
  } else {
    UI.toast(t.vocabError || "❌ No hay vocabularios disponibles");
  }

})();

/* =========================
   FUNCIÓN ÚNICA DE ARRANQUE
========================= */
async function startGame(voc, settings) {

  let vocModule, valModule;

  try {
    vocModule = await import(`../data/${voc.filename}.js`);
    valModule = await import(`../data/${voc.val}.js`);
  } catch (e) {
    console.error(e);
    UI.toast(window.i18n.vocabError || "❌ Error cargando vocabulario");
    return;
  }

  if (!vocModule.default?.length) {
    UI.toast(window.i18n.vocabEmpty || "📭 Vocabulario vacío");
    return;
  }

  if (!valModule.default?.length) {
    UI.toast(window.i18n.validationEmpty || "📭 Validación vacía");
    return;
  }

  // Inicializa juego
  Game.init(
    vocModule.default,
    valModule.default,
    Number(voc.num),
    Number(settings.numint)
  );

  // Renderiza tablero y teclado
  UI.renderBoard(Game.attempts, Game.numLetters);
  UI.renderKeyboard(settings.lang);
  UI.updateBoard();
}
