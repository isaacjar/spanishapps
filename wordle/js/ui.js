// ui.js

/* =========================
   UI & ANIMACIONES
========================= */
const UI = {
  animating: false,

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

        const inner = document.createElement("div");
        inner.className = "cell-inner";

        const front = document.createElement("div");
        front.className = "cell-face cell-front";

        const back = document.createElement("div");
        back.className = "cell-face cell-back";

        inner.appendChild(front);
        inner.appendChild(back);
        cell.appendChild(inner);
        row.appendChild(cell);
      }
      board.appendChild(row);
    }
  },

  updateBoard() {
    const cells = document.querySelectorAll(".cell");
    const flat = Game.grid.flat();
    cells.forEach((cell, i) => {
      cell.querySelector(".cell-front").textContent = flat[i] || "";
    });
  },

  paintRow(result) {
    const rowIndex = Game.row;
    const row = document.querySelectorAll(".row")[rowIndex];
    if (!row) return;

    UI.animating = true;
    const btnNew = document.getElementById("btnNew");
    if (btnNew) {
      btnNew.classList.add("disabled");
      btnNew.style.opacity = "0.5";
      btnNew.style.cursor = "not-allowed";
    }

    [...row.children].forEach((cell, i) => {
      const inner = cell.querySelector(".cell-inner");
      const back = cell.querySelector(".cell-back");
      const front = cell.querySelector(".cell-front");

      back.textContent = front.textContent;
      cell.classList.remove("correct", "present", "absent", "flip");
      cell.classList.add(result[i]);
      void cell.offsetWidth;
      setTimeout(() => cell.classList.add("flip"), i * 300);
    });

    setTimeout(() => {
      UI.animating = false;
      if (btnNew) {
        btnNew.classList.remove("disabled");
        btnNew.style.opacity = "1";
        btnNew.style.cursor = "pointer";
      }
    }, result.length * 300 + 400);
  },

  shakeRow() {
    const row = document.querySelectorAll(".row")[Game.row];
    if (!row) return;
    row.classList.add("shake");
    setTimeout(() => row.classList.remove("shake"), 300);
  },

  toast(msg) {
    const box = document.getElementById("messageBox");
    if (!box) return;
    box.textContent = msg;
    box.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => box.classList.remove("show"), 2000);
  },

  randomMessage(type) {
    const arr = window.i18n[type];
    return arr[Math.floor(Math.random() * arr.length)];
  },

  handleInput(input) {
    if (Game.finished) return;

    if (input === "BACK") {
      if (Game.col > 0) {
        Game.backspace();
        UI.updateBoard();
      }
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

      this.paintRow(result);

      setTimeout(() => {
        const currentWord = Game.grid[Game.row].join("");

        // ⭐ VICTORIA
        if (normalize(currentWord) === normalize(Game.solution)) {
          Game.finished = true;

          UI.toast(UI.randomMessage("success"));
          UI.celebrate();

          setTimeout(() => {
            UI.showConfirmPopup(
              `<strong>${UI.randomMessage("success")}</strong><br><br>
               ${window.i18n.playAgain || "¿Otra partida?"}`,
              () => {
                Game.resetWord();
                setTimeout(() => UI.focusOkKey(), 50);
              },
              () => {}
            );
          }, 600);

          return;
        }

        // ⭐ DERROTA
        if (Game.row >= Game.attempts - 1) {
          Game.finished = true;

          setTimeout(() => {
            UI.showConfirmPopup(
              `${window.i18n.youLost || "La palabra era"}:
               <strong>${Game.solution}</strong><br><br>
               ${window.i18n.playAgain || "¿Otra partida?"}`,
              () => {
                Game.resetWord();
                setTimeout(() => UI.focusOkKey(), 50);
              },
              () => {}
            );
          }, 600);

          return;
        }

        Game.row++;
        Game.col = 0;
        Game.grid[Game.row] = Array(Game.numLetters).fill("");
        UI.updateBoard();

      }, result.length * 300 + 100);

      return;
    }

    if (/^[A-ZÑ]$/.test(input)) {
      if (Game.col < Game.numLetters) {
        Game.inputLetter(input);
        UI.updateBoard();
      }
    }
  },

  celebrate() {
    /* igual que el tuyo, sin cambios */
    /* … */
  },

  _clearPopup() {
    const popup = document.getElementById("popup");
    if (!popup) return;
    popup.innerHTML = "";
    popup.classList.add("hidden");
  },

  showConfirmPopup(message, onConfirm, onCancel) {
    UI._clearPopup();
    const popup = document.getElementById("popup");
    const card = document.createElement("div");
    card.className = "popup-card";

    const p = document.createElement("p");
    p.innerHTML = message;  
    p.style.textAlign = "center";
    p.style.fontSize = "18px";
    p.style.fontWeight = "600";
    card.appendChild(p);

    const btnDiv = document.createElement("div");
    btnDiv.style.display = "flex";
    btnDiv.style.justifyContent = "center";
    btnDiv.style.gap = "20px";
    btnDiv.style.marginTop = "16px";

    const yesBtn = document.createElement("button");
    yesBtn.textContent = window.i18n.yes || "Sí";
    yesBtn.onclick = () => {
      popup.classList.add("hidden");
      onConfirm && onConfirm();
    };

    const noBtn = document.createElement("button");
    noBtn.textContent = window.i18n.no || "No";
    noBtn.onclick = () => {
      popup.classList.add("hidden");
      onCancel && onCancel();
    };

    btnDiv.appendChild(yesBtn);
    btnDiv.appendChild(noBtn);
    card.appendChild(btnDiv);
    popup.appendChild(card);
    popup.classList.remove("hidden");
  },

  focusOkKey() {
    const ok = document.querySelector(".key.ok");
    if (ok) ok.focus();
  }
};

window.UI = UI;
