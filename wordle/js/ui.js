// ui.js

const UI = {

  /* =========================
     TABLERO
  ========================= */

  renderBoard(rows, cols) {
    const board = document.getElementById("board");
    board.innerHTML = "";
    board.style.gridTemplateRows = `repeat(${rows}, auto)`;

    for (let r = 0; r < rows; r++) {
      const row = document.createElement("div");
      row.className = "row";
      row.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

      for (let c = 0; c < cols; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        row.appendChild(cell);
      }

      board.appendChild(row);
    }
  },

  updateBoard() {
    const cells = document.querySelectorAll(".cell");
    const flat = Game.grid.flat();

    cells.forEach((cell, i) => {
      cell.textContent = flat[i] || "";
    });
  },

  paintRow(result) {
    const rowIndex = Game.row - 1;
    const row = document.querySelectorAll(".row")[rowIndex];
    if (!row) return;

    [...row.children].forEach((cell, i) => {
      cell.classList.add(result[i]);
    });
  },

  shakeRow() {
    const row = document.querySelectorAll(".row")[Game.row];
    if (!row) return;
    row.classList.add("shake");
    setTimeout(() => row.classList.remove("shake"), 300);
  },

  /* =========================
     MENSAJES / TOAST
  ========================= */

  toast(msg) {
    const box = document.getElementById("messageBox");
    box.textContent = msg;
    box.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      box.classList.remove("show");
    }, 2000);
  },

  randomMessage(type) {
    const arr = window.i18n[type];
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /* =========================
     TECLADO
  ========================= */

  renderKeyboard(lang) {
    const kb = document.getElementById("keyboard");
    kb.innerHTML = "";

    const rows = [
      "QWERTYUIOP",
      "ASDFGHJKL",
      lang === "es" ? "ZXCVBNMÑ" : "ZXCVBNM"
    ];

    rows.forEach(row => {
      [...row].forEach(letter => {
        kb.appendChild(this.createKey(letter));
      });
    });

    kb.appendChild(this.createKey("🔙", "BACK"));
    kb.appendChild(this.createKey("✅", "ENTER", true));
  },

  createKey(label, value = label, wide = false) {
    const key = document.createElement("div");
    key.className = "key";
    if (wide) key.classList.add("ok");
    key.textContent = label;
    key.dataset.key = value;

    key.addEventListener("click", () => {
      UI.handleInput(value);
    });

    return key;
  },

  /* =========================
     INPUT CENTRALIZADO
  ========================= */

  handleInput(input) {
    if (!Game.words || !Game.words.length) {
      UI.toast(window.i18n.noVocabulary || "No vocabulary loaded");
      return;
    }

    if (input === "BACK") {
      Game.backspace();
      UI.updateBoard();
      return;
    }

    if (input === "ENTER") {
      const result = Game.submit();

      if (result === "short") {
        UI.toast(window.i18n.wordTooShort);
        UI.shakeRow();
        return;
      }

      if (result === "invalid") {
        UI.toast(window.i18n.notValid);
        UI.shakeRow();
        return;
      }

      UI.paintRow(result);

      // Victoria
      if (normalize(Game.grid[Game.row - 1].join("")) === normalize(Game.solution)) {
        UI.toast(UI.randomMessage("success"));
        UI.celebrate();
        return;
      }

      // Último intento fallido
      if (Game.row >= Game.attempts) {
        UI.toast(UI.randomMessage("fail") + " → " + Game.solution);
      }

      return;
    }

    // Letras
    if (/^[A-ZÑ]$/.test(input)) {
      Game.inputLetter(input);
      UI.updateBoard();
    }
  },

  /* =========================
     ANIMACIONES
  ========================= */

  celebrate() {
    document.querySelectorAll(".key").forEach((k, i) => {
      setTimeout(() => k.classList.add("jump"), i * 20);
      setTimeout(() => k.classList.remove("jump"), 600);
    });
  }

};
