// app.js
(async function () {

  /* =========================
     ESPERAR DEPENDENCIAS
  ========================= */
  async function waitForGlobals() {
    let i = 0;
    while (
      (!window.voclists || !window.UI || !window.Game || !window.Settings) &&
      i < 100
    ) {
      await new Promise(r => setTimeout(r, 20));
      i++;
    }
    return window.voclists && window.UI && window.Game && window.Settings;
  }

  if (!(await waitForGlobals())) {
    console.error("❌ Dependencias no cargadas");
    return;
  }

  /* =========================
     SETTINGS
  ========================= */
  const settings = Settings.load();

  /* =========================
     I18N
  ========================= */
  const langData = await fetch("lang.json").then(r => r.json());
  window.i18n = langData[settings.lang] || langData.es;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (window.i18n[key]) el.textContent = window.i18n[key];
  });

  /* =========================
     TECLADO FÍSICO
  ========================= */
  window.addEventListener("keydown", e => {
    if (Game.finished || UI.animating) return;

    const k = e.key.toUpperCase();
    if (/^[A-ZÑ]$/.test(k)) UI.handleInput(k);
    if (e.key === "Backspace") UI.handleInput("BACK");
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
        window.i18n.confirmNewWord,
        startNew
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
    }, window.i18n);
  });

  /* =========================
     ARRANQUE DEL JUEGO
  ========================= */
  async function startGame(voc) {
    const vocModule = await import(`../data/${voc.filename}.js`);
    const valModule = await import(`../data/${voc.val}.js`);

    Game.init(
      vocModule.default,
      valModule.default,
      voc.num,
      settings.numint
    );

    Game.inProgress = true;
    UI.renderBoard(Game.attempts, Game.numLetters);
    UI.renderKeyboard(settings.lang);
    UI.updateBoard();

    hookEndGamePopup();
    return true;
  }

  /* =========================
     POPUP FIN DE PARTIDA
  ========================= */
  function hookEndGamePopup() {
    if (Game._popupHooked) return;
    Game._popupHooked = true;

    const originalSubmit = Game.submit.bind(Game);

    Game.submit = function () {
      const result = originalSubmit();

      if (!Game.finished || result === "short" || result === "invalid") {
        return result;
      }

      const delay = Game.numLetters * 300 + 500;

      setTimeout(() => {
        const win =
          normalize(Game.grid[Game.row].join("")) ===
          normalize(Game.solution);

        const message = win
          ? window.i18n.playAgain
          : `${window.i18n.youLost} ${Game.solution}\n\n${window.i18n.playAgain}`;

        UI.showConfirmPopup(
          message,
          () => {
            Game.resetWord();
            Game.inProgress = true;
            setTimeout(() => UI.focusOkKey(), 50);
          }
        );
      }, delay);

      return result;
    };
  }

  /* =========================
     SELECCIÓN DE VOCABULARIO
  ========================= */
  if (settings.voclist) {
    const direct = voclists.find(v => v.filename === settings.voclist);
    if (direct && (await startGame(direct))) return;
  }

  UI.showVocabPopup(voclists, startGame);

})();
