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
    if (Game.finished) return;

    // Letras (incluye ñ)
    if (/^[a-zñ]$/i.test(e.key)) {
      UI.handleInput(normalize(e.key));
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
    if (!Game.finished && Game.row > 0) {
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
     CARGA VOCABULARIO
  ========================= */

  if (!settings.voclist) {
    UI.toast(t.selectList);
    return;
  }

  let vocModule, valModule;

  try {
    vocModule = await import(`./data/${settings.voclist}.js`);
  } catch (e) {
    console.error("Archivo de vocabulario no encontrado", e);
    UI.toast(t.vocabError || "❌ Error cargando vocabulario");
    return;
  }

  if (!vocModule.default || !vocModule.default.length) {
    UI.toast(t.vocabEmpty || "📭 Vocabulario vacío");
    return;
  }

  try {
    valModule = await import(`./data/${vocModule.val}.js`);
  } catch (e) {
    console.error("Archivo de validación no encontrado", e);
    UI.toast(t.validationError || "❌ Error cargando validación");
    return;
  }

  if (!valModule.default || !valModule.default.length) {
    UI.toast(t.validationEmpty || "📭 Validación vacía");
    return;
  }

  /* =========================
     INICIALIZACIÓN JUEGO
  ========================= */

  Game.init(
    vocModule.default,
    valModule.default,
    Number(vocModule.num),
    Number(settings.numint)
  );

  UI.renderBoard(settings.numint, vocModule.num);
  UI.renderKeyboard(settings.lang);
  UI.updateBoard();

})();
