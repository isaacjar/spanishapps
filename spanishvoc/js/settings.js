export const Settings = {
  data: {
    lang: "en",    // en|zh|urf
    time: 10,      // 2..30 (segundos)
    questions: 15, // 5..50
    lives: 3,       // 👈 número de vidas por defecto
    difficulty: 1  // 1=4 opciones, 2=6 opciones
  },

  load() {
    // 1) URL params (prioridad)
    const params = new URLSearchParams(location.search);
    if (params.has("lang")) this.data.lang = params.get("lang");
    if (params.has("time")) this.data.time = Math.max(2, Math.min(30, parseInt(params.get("time")) || 10));
    if (params.has("questions")) this.data.questions = Math.max(5, Math.min(50, parseInt(params.get("questions")) || 15));
    if (params.has("difficulty")) this.data.difficulty = [1,2].includes(parseInt(params.get("difficulty"))) ? parseInt(params.get("difficulty")) : 1;
    if (params.has("lives")) this.data.lives = Math.max(1, Math.min(10, parseInt(params.get("lives")) || 3));

    // 2) LocalStorage (si NO viene por URL)
    ["lang","time","questions","difficulty","lives"].forEach(k => {
      const key = "vocaboomb_" + k;
      const saved = localStorage.getItem(key);
      if (saved !== null && !params.has(k)) {
        this.data[k] = (k==="lang") ? saved : parseInt(saved);
      }
    });

    this.applyUI();
    this.bindEvents();
    this.bindModalButtons();
  },

  save() {
    localStorage.setItem("vocaboomb_lang", this.data.lang);
    localStorage.setItem("vocaboomb_time", String(this.data.time));
    localStorage.setItem("vocaboomb_questions", String(this.data.questions));
    localStorage.setItem("vocaboomb_difficulty", String(this.data.difficulty));
    localStorage.setItem("vocaboomb_lives", String(this.data.lives));
    this.applyUI(); // 🔧 refresca interfaz tras guardar
  },

  reset() {
    this.data = {
      lang: "en",
      time: 10,
      questions: 15,
      difficulty: 1,
      lives: 3
    };
    this.applyUI();
    this.save();
  },

  applyUI() {
    // Idioma
    document.querySelector("#langSelect").value = this.data.lang;

    // Tiempo (label + slider)
    const timeRange = document.querySelector("#timeRange");
    const timeLabel = document.querySelector("#timeLabel");
    if (timeRange) timeRange.value = this.data.time;
    if (timeLabel) timeLabel.textContent = `${this.data.time} segs.`;

    // Preguntas
    const nq = document.querySelector("#numQuestions");
    const nqv = document.querySelector("#numQuestionsVal");
    if (nq) nq.value = this.data.questions;
    if (nqv) nqv.textContent = this.data.questions;

    // Dificultad
    const sw = document.querySelector("#difficultySwitch");
    const emo = document.querySelector("#difficultyEmoji");
    if (sw) sw.checked = this.data.difficulty === 2;
    if (emo) emo.textContent = (this.data.difficulty === 2) ? "🥵" : "😎";

    // Vidas
    const lv = document.querySelector("#livesValue");
    const ls = document.querySelector("#livesSlider");
    if (ls) ls.value = this.data.lives;
    if (lv) lv.textContent = this.data.lives;
        
  },

  bindEvents() {
    const langSelect = document.querySelector("#langSelect");
    const timeRange  = document.querySelector("#timeRange");
    const timeLabel  = document.querySelector("#timeLabel");
    const nq         = document.querySelector("#numQuestions");
    const nqv        = document.querySelector("#numQuestionsVal");
    const sw         = document.querySelector("#difficultySwitch");
    const livesSlider = document.querySelector("#livesSlider");
    const livesValue  = document.querySelector("#livesValue");

    if (langSelect) langSelect.addEventListener("change", e => { 
      this.data.lang = e.target.value; 
    });

    if (timeRange) timeRange.addEventListener("input", e => {
      this.data.time = parseInt(e.target.value);
      if (timeLabel) timeLabel.textContent = `${this.data.time} segs.`;
    });

    if (nq) nq.addEventListener("input", e => {
      this.data.questions = parseInt(e.target.value);
      if (nqv) nqv.textContent = this.data.questions;
    });

    if (sw) sw.addEventListener("change", e => {
      this.data.difficulty = e.target.checked ? 2 : 1;
      const emo = document.querySelector("#difficultyEmoji");
      if (emo) emo.textContent = e.target.checked ? "🥵" : "😎";
    });

    if (livesSlider) livesSlider.addEventListener("input", e => {
      this.data.lives = parseInt(e.target.value);
      if (livesValue) livesValue.textContent = this.data.lives;
    });
  },

  bindModalButtons() {
    const btnSave   = document.getElementById("btnSaveSettings");
    //const btnCancel = document.getElementById("btnCancelSettings");
    const btnReset  = document.getElementById("btnResetSettings");

    if (btnSave) btnSave.addEventListener("click", () => {
      this.save(); // guarda en localStorage y refresca UI
      UI.closeSettings();
      UI.toast("✅ Configuración guardada");
    });

    /*if (btnCancel) btnCancel.addEventListener("click", () => {
      this.applyUI(); // restaurar interfaz con datos actuales
      UI.closeSettings();
    });*/

    if (btnReset) btnReset.addEventListener("click", () => {
      this.reset();
      UI.closeSettings();
      UI.toast("🔄 Configuración restablecida");
    });
  }
};
