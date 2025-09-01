import { Settings } from "./settings.js";

let _timerId = null; // Temporizador

export const Game = {
  state: { currentQ: 0, score: 0, streak: 0, lives: 3, list: [], active: false },

  init() {},

  start(mode = "es2lang") {
    if (!window.currentVoclist || !window.currentVoclist.length) {
      UI.toast("📚 Elige primero una lista de palabras");
      UI.showVoclists();
      return;
    }
    this.mode = mode;
    this.state = { currentQ: 0, score: 0, streak: 0, lives: 3, list: window.currentVoclist.slice(), active: false };
    UI.showGame();
    this.nextQuestion();
  },

  nextQuestion() {
    if (this.state.currentQ >= Settings.data.questions || this.state.lives <= 0) {
      UI.toast("🎮 Game Over");
      UI.showMenu();
      return;
    }

    this.state.currentQ++;
    this.state.active = true;

    const q = this.state.list[Math.floor(Math.random() * this.state.list.length)];
    const ask = (this.mode === "es2lang") ? q.es : q[Settings.data.lang];
    const correct = (this.mode === "es2lang") ? q[Settings.data.lang] : q.es;

    // Palabra a preguntar
    document.getElementById("questionWord").textContent = ask;

    // Opciones
    const optsNeeded = (Settings.data.difficulty === 2) ? 6 : 4;
    let options = new Set([correct]);
    while (options.size < optsNeeded) {
      const r = this.state.list[Math.floor(Math.random() * this.state.list.length)];
      const val = (this.mode === "es2lang") ? r[Settings.data.lang] : r.es;
      if (val) options.add(val);
    }
    const optionList = Array.from(options).sort(() => Math.random() - 0.5);

    const cont = document.getElementById("optionsContainer");
    cont.innerHTML = "";
    cont.classList.toggle("six", optsNeeded === 6); // útil si quieres estilos distintos

    optionList.forEach(text => {
      const btn = document.createElement("button");
      btn.textContent = text;
      btn.addEventListener("click", () => this.onAnswer(text === correct, btn));
      cont.appendChild(btn);
    });
    this.startTimer(Settings.data.time); // Temporizador
    UI.updateGameStatus(this.state);
  },

  // FUNCION INICIA TEMPORIZADOR
  startTimer(seconds) {
    clearInterval(_timerId);
    const bar = document.getElementById("timeBar");
    let timeLeft = seconds;
    // Reset
    bar.style.width = "100%";
    bar.style.backgroundColor = "#4caf50"; // verde
  
    _timerId = setInterval(() => {
      timeLeft--;
      const percent = Math.max(0, (timeLeft / seconds) * 100);
      bar.style.width = percent + "%";
  
      // Colores: >50% verde, 50–20% amarillo, <20% rojo
      if (percent <= 20) {
        bar.style.backgroundColor = "#f44336"; // rojo
      } else if (percent <= 50) {
        bar.style.backgroundColor = "#ffeb3b"; // amarillo
      } else {
        bar.style.backgroundColor = "#4caf50"; // verde
      }
  
      if (timeLeft <= 0) {
        clearInterval(_timerId);
        this.onTimeUp();
      }
    }, 1000);
  },
    
  onAnswer(isCorrect, btn) {
    if (!this.state.active) return; // evitar doble
    this.state.active = false;
    clearInterval(_timerId);
    
    // Feedback visual
    btn.classList.add(isCorrect ? "correct" : "wrong");

    // Puntuar + estadísticas
    if (isCorrect) {
      this.state.score++;
      this.state.streak++;
      UI.toastSuccess();
      Stats.add(true);
    } else {
      this.state.lives--;
      this.state.streak = 0;
      UI.toastFail();
      Stats.add(false);
    }
    UI.updateGameStatus(this.state);

    // Siguiente pregunta tras pequeño delay
    setTimeout(() => this.nextQuestion(), 700);
  },

  // Se usará en el paso 2 para la barra de tiempo:
  onTimeUp() {
    if (!this.state.active) return;
    this.onAnswer(false, document.createElement("div")); // marca fallo sin botón
  },

  // PARA EL JUEGO 🛑
  stop() {
    clearInterval(_timerId);
    _timerId = null;
    this.state.active = false;
  
    // Opcional: limpiar la UI de juego
    const bar = document.getElementById("timeBar");
    if (bar) {
      bar.style.width = "100%";
      bar.style.backgroundColor = "#4caf50";
    }
  
    const cont = document.getElementById("optionsContainer");
    if (cont) cont.innerHTML = "";
  }

};
