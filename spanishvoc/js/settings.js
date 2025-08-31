const Settings = {
  data: {
    lang: "en",    // en|zh|ur
    time: 10,      // 2..30 (segundos)
    questions: 15, // 5..50
    difficulty: 1  // 1=4 opciones, 2=6 opciones
  },

  load() {
    // 1) URL params (prioridad)
    const params = new URLSearchParams(location.search);
    if (params.has("lang")) this.data.lang = params.get("lang");
    if (params.has("time")) this.data.time = Math.max(2, Math.min(30, parseInt(params.get("time")) || 10));
    if (params.has("questions")) this.data.questions = Math.max(5, Math.min(50, parseInt(params.get("questions")) || 15));
    if (params.has("difficulty")) this.data.difficulty = [1,2].includes(parseInt(params.get("difficulty"))) ? parseInt(params.get("difficulty")) : 1;

    // 2) LocalStorage (si NO viene por URL)
    ["lang","time","questions","difficulty"].forEach(k => {
      const key = "vocaboomb_" + k;
      const saved = localStorage.getItem(key);
      if (saved !== null && !params.has(k)) {
        this.data[k] = (k==="lang") ? saved : parseInt(saved);
      }
    });

    this.applyUI();
    this.bindEvents();
  },

  save() {
    localStorage.setItem("vocaboomb_lang", this.data.lang);
    localStorage.setItem("vocaboomb_time", String(this.data.time));
    localStorage.setItem("vocaboomb_questions", String(this.data.questions));
    localStorage.setItem("vocaboomb_difficulty", String(this.data.difficulty));
  },

  applyUI() {
    // Idioma
    document.querySelector("#langSelect").value = this.data.lang;
    // Tiempo (label + slider — el slider se añade en el paso 2; de momento solo label)
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
  },

  bindEvents() {
    const langSelect = document.querySelector("#langSelect");
    const timeRange  = document.querySelector("#timeRange");
    const timeLabel  = document.querySelector("#timeLabel");
    const nq         = document.querySelector("#numQuestions");
    const nqv        = document.querySelector("#numQuestionsVal");
    const sw         = document.querySelector("#difficultySwitch");

    if (langSelect) langSelect.addEventListener("change", e => { this.data.lang = e.target.value; });

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
  }
};
