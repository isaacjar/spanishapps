const Game = {
  state: { currentQ:0, score:0, streak:0, lives:3, list:[] },

  init() { },

  start(mode="es2lang") {
    this.state = { currentQ:0, score:0, streak:0, lives:3, list: window.currentVoclist||[] };
    UI.showGame();
    this.nextQuestion(mode);
  },

  nextQuestion(mode) {
    if (this.state.currentQ >= Settings.data.questions || this.state.lives <= 0) {
      UI.toast("🎮 Game Over");
      UI.showMenu();
      return;
    }
    this.state.currentQ++;

    const q = this.state.list[Math.floor(Math.random()*this.state.list.length)];
    const correct = (mode==="es2lang") ? q[Settings.data.lang] : q.es;
    const questionWord = (mode==="es2lang") ? q.es : q[Settings.data.lang];

    $("#questionWord").text(questionWord);

    let opts = [correct];
    while (opts.length < (Settings.data.difficulty===2?6:4)) {
      const rand = this.state.list[Math.floor(Math.random()*this.state.list.length)];
      const val = (mode==="es2lang")? rand[Settings.data.lang] : rand.es;
      if (!opts.includes(val)) opts.push(val);
    }
    opts = opts.sort(()=>Math.random()-0.5);

    const container = $("#optionsContainer").empty();
    opts.forEach(o=>{
      const btn = $("<button>").text(o).click(()=>{
        if (o===correct) {
          this.state.score++;
          this.state.streak++;
          UI.toastSuccess();
          btn.addClass("correct");
        } else {
          this.state.lives--;
          this.state.streak=0;
          UI.toastFail();
          btn.addClass("wrong");
        }
        UI.updateGameStatus(this.state);
        setTimeout(()=>this.nextQuestion(mode),800);
      });
      container.append(btn);
    });

    UI.updateGameStatus(this.state);
  }
};
