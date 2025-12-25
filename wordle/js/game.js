// game.js

/* =========================
   NORMALIZACIÓN CENTRAL
========================= */
function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

/* =========================
   LÓGICA DEL JUEGO
========================= */
const Game = {

  init(words, valid, numLetters, attempts) {
    this.words = words || [];
    this.valid = (valid || []).map(normalize);
    this.numLetters = Number(numLetters);
    this.attempts = Number(attempts);

    this.last = null;
    this.reset();
    console.log("📝 ", this.solution);
  },

  reset() {
    if (!this.words.length) return;

    // Evitar palabra repetida
    do {
      this.solution =
        this.words[Math.floor(Math.random() * this.words.length)];
    } while (this.solution === this.last && this.words.length > 1);

    this.last = this.solution;

    this.row = 0;
    this.col = 0;
    this.finished = false;

    this.grid = Array.from(
      { length: this.attempts },
      () => Array(this.numLetters).fill("")
    );
  },

  /* =========================
     INPUT DE LETRAS
  ========================= */
  inputLetter(letter) {
    if (this.finished) return;
    if (this.col >= this.numLetters) return;

    this.grid[this.row][this.col] = letter;
    this.col++;
  },

  backspace() {
    if (this.finished) return;
    if (this.col === 0) return;

    this.col--;
    this.grid[this.row][this.col] = "";
  },

  /* =========================
     ENVÍO DE PALABRA
     Devuelve array de estados para animación FLIP
  ========================= */
  submit() {
    if (this.finished) return "finished";

    // Palabra incompleta
    if (this.col < this.numLetters) return "short";

    const word = this.grid[this.row].join("");

    // Validación con vocabulario permitido
    if (!this.valid.includes(normalize(word))) return "invalid";

    const result = this.check(word);

    // Victoria
    if (normalize(word) === normalize(this.solution)) {
      this.finished = true;
    }

    // Avanza fila
    this.row++;
    this.col = 0;

    // Último intento
    if (this.row >= this.attempts && !this.finished) {
      this.finished = true;
    }

    return result; // <-- array ["correct","present","absent"...] para UI.animateRow()
  },

  /* =========================
     COMPARACIÓN WORDLE REAL
     Maneja letras repetidas
  ========================= */
  check(word) {
    const sol = normalize(this.solution).split("");
    const guess = normalize(word).split("");
    const res = Array(this.numLetters).fill("absent");

    // Conteo de letras de la solución
    const counts = {};
    sol.forEach(l => counts[l] = (counts[l] || 0) + 1);

    // 1ª pasada: correctas
    guess.forEach((l, i) => {
      if (l === sol[i]) {
        res[i] = "correct";
        counts[l]--;
      }
    });

    // 2ª pasada: presentes
    guess.forEach((l, i) => {
      if (res[i] === "correct") return;
      if (counts[l] > 0) {
        res[i] = "present";
        counts[l]--;
      }
    });

    return res;
  }

};

window.Game = Game;
window.normalize = normalize;
