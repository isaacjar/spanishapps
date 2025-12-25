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

  paintRow(result) {
    const rowIndex = Game.row - 1;
    const row = document.querySelectorAll(".row")[rowIndex];
    if (!row) return;

    [...row.children].forEach((cell, i) => {
      const inner = cell.querySelector(".cell-inner");
      const back = cell.querySelector(".cell-back");

      back.textContent = cell.querySelector(".cell-front").textContent;
      back.className = "cell-face cell-back " + result[i];

      setTimeout(() => inner.classList.add("flip"), i * 200);
    });
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

  renderKeyboard(lang) {
    const kb = document.getElementById("keyboard");
    kb.innerHTML = "";

    const rows = [
      "QWERTYUIOP",
      "ASDFGHJKL",
      "ZXCVBNMÑ"
      //lang === "es" ? "ZXCVBNMÑ" : "ZXCVBNM"
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
  
      if (result === "short") { UI.toast(window.i18n.wordTooShort); UI.shakeRow(); return; }
      if (result === "invalid") { UI.toast(window.i18n.notValid); UI.shakeRow(); return; }
  
      const rowIndex = Game.row - 1;
      const row = document.querySelectorAll(".row")[rowIndex];
      if (!row) return;
  
      // Aplica clases y contenido antes del flip
      [...row.children].forEach((cell,i)=>{
        const inner = cell.querySelector(".cell-inner");
        const back = cell.querySelector(".cell-back");
        back.textContent = cell.querySelector(".cell-front").textContent;
        cell.classList.remove("correct","present","absent");
        cell.classList.add(result[i]);
        inner.classList.remove("flip");
      });
  
      // Flip escalonado tipo Wordle
      [...row.children].forEach((cell,i)=>{
        setTimeout(()=>cell.querySelector(".cell-inner").classList.add("flip"), i*250);
      });
  
      // Espera animación completa antes de avanzar
      setTimeout(()=>{
        // Victoria
        if (normalize(Game.grid[rowIndex].join("")) === normalize(Game.solution)) {
          UI.toast(UI.randomMessage("success"));
          UI.celebrate();
          return;
        }
        // Último intento fallido
        if (Game.row >= Game.attempts && !Game.finished) {
          UI.toast(UI.randomMessage("fail")+" → "+Game.solution);
          return;
        }
        // Avanzar fila
        Game.row++;
        Game.col=0;
      }, result.length*250 + 300);
  
      return;
    }
  
    // Letras
    if (/^[A-ZÑ]$/.test(input)) {
      Game.inputLetter(input);
      UI.updateBoard();
    }
  },

  celebrate() {
    document.querySelectorAll(".key").forEach((k, i) => {
      setTimeout(() => k.classList.add("jump"), i * 20);
      setTimeout(() => k.classList.remove("jump"), 600);
    });

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
    }, 4000);
  },

  /* =========================
     POPUP HELP: limpiar antes de mostrar
  ========================= */
  _clearPopup() {
    const popup = document.getElementById("popup");
    if (!popup) return;
    popup.innerHTML = "";
    popup.classList.add("hidden");
  },

  /* =========================
     POPUP CONFIRMACIÓN
  ========================= */
  showConfirmPopup(message, onConfirm, onCancel) { 
    UI._clearPopup();
  
    const popup = document.getElementById("popup");
    const card = document.createElement("div");
    card.className = "popup-card";
  
    const p = document.createElement("p");
    p.textContent = message;
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
    yesBtn.textContent = window.i18n.yes || "✅";
    yesBtn.className = "confirm-btn confirm-yes";
    yesBtn.onclick = () => { popup.classList.add("hidden"); if(onConfirm) onConfirm(); };
  
    const noBtn = document.createElement("button");
    noBtn.textContent = window.i18n.no || "❌";
    noBtn.className = "confirm-btn confirm-no";
    noBtn.onclick = () => { popup.classList.add("hidden"); if(onCancel) onCancel(); };
  
    btnDiv.appendChild(yesBtn);
    btnDiv.appendChild(noBtn);
    card.appendChild(btnDiv);
  
    popup.appendChild(card);
    popup.classList.remove("hidden");
  }
};

/* =========================
   POPUP VOCABULARIO
========================= */
UI.showVocabPopup = function(lists, onSelect) {
  UI._clearPopup();

  const popup = document.getElementById("popup");
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

/* =========================
   POPUP SETTINGS CON ESTADÍSTICAS
========================= */
UI.showSettingsPopup = function(currentSettings, onUpdate) {
  UI._clearPopup();

  const popup = document.getElementById("popup");
  const card = document.createElement("div");
  card.className = "popup-card";

  const title = document.createElement("h2");
  title.textContent = "Opciones";
  card.appendChild(title);

  // Idioma
  const langLabel = document.createElement("label");
  langLabel.textContent = "Idioma:";
  langLabel.style.display = "block";
  langLabel.style.marginTop = "8px";
  const langSelect = document.createElement("select");
  ["es","en"].forEach(l => {
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l.toUpperCase();
    if (currentSettings.lang === l) opt.selected = true;
    langSelect.appendChild(opt);
  });
  card.appendChild(langLabel);
  card.appendChild(langSelect);

  // Número de intentos
  const attemptsLabel = document.createElement("label");
  attemptsLabel.textContent = "Intentos:";
  attemptsLabel.style.display = "block";
  attemptsLabel.style.marginTop = "8px";
  const attemptsInput = document.createElement("input");
  attemptsInput.type = "range";
  attemptsInput.min = 4;
  attemptsInput.max = 10;
  attemptsInput.value = currentSettings.numint;
  attemptsInput.style.width = "100%";
  card.appendChild(attemptsLabel);
  card.appendChild(attemptsInput);

  // Estadísticas
  const statsDiv = document.createElement("div");
  statsDiv.style.marginTop = "12px";
  function updateStats() {
    const stats = JSON.parse(localStorage.getItem("stats")||'{"played":0,"won":0}');
    statsDiv.innerHTML = `Palabras jugadas: ${stats.played}<br>Palabras acertadas: ${stats.won}`;
  }
  updateStats();
  card.appendChild(statsDiv);

  // Botones
  const btnSave = document.createElement("button");
  btnSave.textContent = "💾 Guardar";
  btnSave.style.marginRight = "6px";
  btnSave.onclick = () => {
    const updated = { lang: langSelect.value, numint: attemptsInput.value };
    Settings.save(updated);
    if (onUpdate) onUpdate(updated);
    popup.classList.add("hidden");
  };

  const btnReset = document.createElement("button");
  btnReset.textContent = "🔄 Resetear";
  btnReset.style.marginRight = "6px";
  btnReset.onclick = () => {
    localStorage.clear();
    location.reload();
  };

  const btnCancel = document.createElement("button");
  btnCancel.textContent = "✖ Cancelar";
  btnCancel.onclick = () => popup.classList.add("hidden");

  const btnDiv = document.createElement("div");
  btnDiv.style.marginTop = "12px";
  btnDiv.appendChild(btnSave);
  btnDiv.appendChild(btnReset);
  btnDiv.appendChild(btnCancel);

  card.appendChild(btnDiv);
  popup.appendChild(card);
  popup.classList.remove("hidden");
};

UI.focusOkKey = function() {
  const ok = document.querySelector(".key.ok");
  if(ok) ok.focus();
};

window.UI = UI;
