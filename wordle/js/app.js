// app.js
(async function () {

  /* =========================
     ESPERAR A DEPENDENCIAS
  ========================= */
  async function waitForGlobals() {
    const max = 100; // ~2s
    let i = 0;
    while ((!window.voclists || !window.UI || !window.Game || !window.Settings) && i < max) {
      await new Promise(r => setTimeout(r, 20));
      i++;
    }

    if (!window.voclists || !window.UI || !window.Game || !window.Settings) {
      console.error("❌ Dependencias no cargadas", {
        voclists: !!window.voclists,
        UI: !!window.UI,
        Game: !!window.Game,
        Settings: !!window.Settings
      });
      return false;
    }
    return true;
  }

  if (!(await waitForGlobals())) return;

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

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.textContent = t[key];
  });

  /* =========================
     TECLADO FÍSICO
  ========================= */
  window.addEventListener("keydown", e => {
    if (!Game || Game.finished || UI.animating) return;

    const key = e.key.toUpperCase();
    if (/^[A-ZÑ]$/.test(key)) UI.handleInput(key);
    if (e.key === "Backspace") {
      e.preventDefault();
      UI.handleInput("BACK");
    }
    if (e.key === "Enter") UI.handleInput("ENTER");
  });

  /* =========================
     BOTÓN NUEVA PALABRA
  ========================= */
  document.getElementById("btnNew")?.addEventListener("click", () => {
    if (!Game.words?.length) return;

    const startNew = () => {
      Game.resetWord();
      Game.inProgress = true;
      setTimeout(() => UI.focusOkKey(), 50);
    };

    if (Game.inProgress && !Game.finished) {
      UI.showConfirmPopup(
        window.i18n.confirmNewWord || "¿Desea terminar la partida en curso?",
        startNew,
        () => {}
      );
    } else {
      startNew();
    }
  });

  /* =========================
     BOTÓN SETTINGS
  ========================= */
  document.getElementById("btnSettings")?.addEventListener("click", () => {
    UI.showSettingsPopup(settings, updated => {
      Settings.save(updated);
      if (Game.words?.length) {
        Game.reset();
        UI.renderBoard(Game.attempts, Game.numLetters);
        UI.updateBoard();
      }
    });
  });

  /* =========================
     ARRANQUE DEL JUEGO
  ========================= */
  async function startGame(voc) {
    let vocModule, valModule;

    try {
      vocModule = await import(`../data/${voc.filename}.js`);
      valModule = await import(`../data/${voc.val}.js`);
    } catch (e) {
      console.error(e);
      UI.toast(window.i18n.vocabError || "❌ Error cargando vocabulario");
      return false;
    }

    if (!vocModule.default?.length || !valModule.default?.length) {
      UI.toast(window.i18n.vocabEmpty || "📭 Vocabulario vacío");
      return false;
    }

    Game.init(
      vocModule.default,
      valModule.default,
      Number(voc.num),
      Number(settings.numint)
    );

    Game.inProgress = true;
    UI.renderBoard(Game.attempts, Game.numLetters);
    UI.renderKeyboard(settings.lang);
    UI.updateBoard();

    return true;
  }

  /* =========================
     FLUJO PRINCIPAL: VOCABULARIO
  ========================= */
  if (settings.voclist) {
    const direct = voclists.find(v => v.filename === settings.voclist);
    if (direct) {
      const ok = await startGame(direct);
      if (ok) return;
    }
  }

  // Popup de selección de vocabulario
  UI.showVocabPopup(voclists, async selected => {
    await startGame(selected);
  });

})();
