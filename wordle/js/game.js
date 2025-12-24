// game.js  

function normalize(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

const Game = {
  init(words, valid, numLetters, attempts) {
    this.words = words;
    this.valid = valid.map(normalize);
    this.numLetters = numLetters;
    this.attempts = attempts;
    this.reset();
  },

  reset() {
    do {
      this.solution = this.words[Math.floor(Math.random() * this.words.length)];
    } while (this.solution === this.last);
    this.last = this.solution;
    this.row = 0;
    this.col = 0;
    this.grid = Array.from({ length: this.attempts }, () => Array(this.numLetters).fill(""));
  },

  check(word) {
    const sol = normalize(this.solution);
    const res = [];
    [...word].forEach((l, i) => {
      if (l === sol[i]) res[i] = "correct";
      else if (sol.includes(l)) res[i] = "present";
      else res[i] = "absent";
    });
    return res;
  }
};
