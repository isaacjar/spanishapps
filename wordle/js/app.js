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
    if (!window.Game || Game.finished || UI.animating) return;

    if (/^[a-zñ]$/i.test(e.key)) { UI.handleInput(normalize(e.key)); return; }
    if (e.key === "Backspace") { e.preventDefault(); UI.handleInput("BACK"); return; }
    if (e.key === "Enter") { UI.handleInput("ENTER"); return; }
  });

  /* =========================
     POOL SIN REPETICIÓN
  ========================= */
  Game._usedWords = new Set();
  const originalResetWord = Game.resetWord.bind(Game);
  Game.resetWord = function() {
    if (!this.words?.length) return;

    if (this._usedWords.size >= this.words.length) this._usedWords.clear();

    let candidate;
    do {
      candidate = this.words[Math.floor(Math.random() * this.words.length)];
    } while (this._usedWords.has(candidate) && this.words.length > 1);

    this.solution = candidate;
    this._usedWords.add(candidate);
    this.last = this.solution;

    this.row = 0;
    this.col = 0;
    this.finished = false;
    this.grid = Array.from({ length: this.attempts }, () => Array(this.numLetters).fill(""));

    if (window.UI) {
      UI.renderBoard(this.attempts, this.numLetters);
      UI.updateBoard();
    }
    console.log("📝 Palabra nueva (pool sin repetir):", this.solution);
  };

  /* =========================
     BOTONES SUPERIORES
  ========================= */
  const btnNew = document.getElementById("btnNew");
  btnNew?.addEventListener("click", () => {
    if (!Game.words?.length) {
      UI.toast(window.i18n.noVocabulary || "No vocabulary loaded");
      return;
    }

    const startNew = () => {
      Game.resetWord();
      UI.focusOkKey(); // mueve foco al botón OK
    };

    // Solo preguntar si ya hay intentos
    if (!Game.finished && Game.row > 0) {
      UI.showConfirmPopup(
        window.i18n.confirmNewWord || "¿Desea terminar la partida en curso?",
        startNew,
        () => {}
      );
    } else {
      startNew();
    }
  });

  // Animar/deshabilitar btnNew según animaciones
  const observer = new MutationObserver(() => {
    if (UI.animating) {
      btnNew.classList.add("disabled");
      btnNew.style.opacity = "0.5";
      btnNew.style.cursor = "not-allowed";
    } else {
      btnNew.classList.remove("disabled");
      btnNew.style.opacity = "1";
      btnNew.style.cursor = "pointer";
    }
  });
  observer.observe(document.body, { attributes: true, subtree: true });

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
     FLUJO PRINCIPAL
  ========================= */
  if (!window.voclists || !voclists.length) {
    console.error("voclists no disponible");
    return;
  }

  let started = false;

  if (settings.voclist) {
    const direct = voclists.find(v => v.filename === settings.voclist);
    if (direct) {
      try {
        await startGame(direct, settings);
        started = true;
      } catch(e) {
        console.error("Error iniciando voclist directo", e);
      }
    }
  }

  if (!started) {
    UI.showVocabPopup(voclists, selected => {
      startGame(selected, settings);
    });
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

  Game.init(
    vocModule.default,
    valModule.default,
    Number(voc.num),
    Number(settings.numint)
  );

  UI.renderBoard(Game.attempts, Game.numLetters);
  UI.renderKeyboard(settings.lang);
  UI.updateBoard();
}
