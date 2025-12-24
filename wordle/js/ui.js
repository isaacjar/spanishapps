// ui.js

const UI = {

  /* =========================
     TABLERO DINÁMICO CON FLIP
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

        // FLIP structure
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
      const front = cell.querySelector(".cell-front");
      front.textContent = flat[i] || "";
    });
  },

  /* =========================
     PINTAR FILA CON FLIP
  ========================= */
  paintRow(result) {
    const rowIndex = Game.row - 1;
    const row = document.querySelectorAll(".row")[rowIndex];
    if (!row) return;

    [...row.children].forEach((cell, i) => {
      const inner = cell.querySelector(".cell-inner");
      const back = cell.querySelector(".cell-back");

      back.textContent = cell.querySelector(".cell-front").textContent;
      back.className = "cell-face cell-back " + result[i];

      // Trigger flip con retraso para efecto tipo Wordle
      setTimeout(() => inner.classList.add("flip"), i * 200);
    });
  },

  shakeRow() {
    const row = document.querySelectorAll(".row")[Game.row];
    if (!row) return;
    row.classList.add("shake");
    setTimeout(() => row.classList.remove("shake"), 300);
  },

  /* =========================
     TOAST / MENSAJES
  ========================= */
  toast(msg) {
    const box = document.getElementById("messageBox");
    box.textContent = msg;
    box.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => box.classList.remove("show"), 2000);
  },

  randomMessage(type) {
    const arr = window.i18n[type];
    return arr[Math.floor(Math.random() * arr.length)];
  },

  /* =========================
     TECLADO DINÁMICO
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
      [...row].forEach(letter => kb.appendChild(this.createKey(letter)));
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
     CELEBRACIÓN / CONFETI
  ========================= */
  celebrate() {
    // Rebote teclado
    document.querySelectorAll(".key").forEach((k, i) => {
      setTimeout(() => k.classList.add("jump"), i * 20);
      setTimeout(() => k.classList.remove("jump"), 600);
    });

    // Confeti canvas
    const canvas = document.createElement("canvas");
    canvas.id = "confetti";
    canvas.style.position = "fixed";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = 2000;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = [];
    const colors = ["#FFB6C1","#FFD700","#87CEFA","#98FB98","#FFA07A"];

    for (let i = 0; i < 150; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * 30 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 10,
        tiltAngle: 0,
        tiltAngleIncrement: Math.random() * 0.07 + 0.05
      });
    }

    let angle = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confetti.forEach(f => {
        ctx.beginPath();
        ctx.lineWidth = f.r / 2;
        ctx.strokeStyle = f.color;
        ctx.moveTo(f.x + f.tilt + f.r / 4, f.y);
        ctx.lineTo(f.x + f.tilt, f.y + f.tilt + f.r / 4);
        ctx.stroke();
      });
      update();
    };

    const update = () => {
      angle += 0.01;
      confetti.forEach(f => {
        f.tiltAngle += f.tiltAngleIncrement;
        f.y += (Math.cos(angle + f.d) + 3 + f.r / 2) / 2;
        f.x += Math.sin(angle);
        f.tilt = Math.sin(f.tiltAngle) * 15;

        if (f.y > canvas.height) f.y = -10;
        if (f.x > canvas.width) f.x = 0;
        if (f.x < 0) f.x = canvas.width;
      });
    };

    let confettiAnim;
    const animate = () => {
      draw();
      confettiAnim = requestAnimationFrame(animate);
    };
    animate();

    setTimeout(() => {
      cancelAnimationFrame(confettiAnim);
      canvas.remove();
    }, 4000); // duración 4s
  }

};

/* =========================
   POPUP VOCABULARIO
========================= */
UI.showVocabPopup = function (lists, onSelect) {
  const popup = document.getElementById("popup");
  popup.innerHTML = "";

  const card = document.createElement("div");
  card.className = "popup-card";

  const title = document.createElement("h2");
  title.textContent = window.i18n.selectList;
  card.appendChild(title);

  const listBox = document.createElement("div");
  listBox.className = "popup-list";

  lists.forEach(v => {
    const btn = document.createElement("button");
    btn.textContent = v.title;
    btn.onclick = () => {
      popup.classList.add("hidden");
      onSelect(v);
    };
    listBox.appendChild(btn);
  });

  card.appendChild(listBox);
  popup.appendChild(card);
  popup.classList.remove("hidden");
};


