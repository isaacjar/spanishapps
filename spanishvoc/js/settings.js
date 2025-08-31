const Settings = {
  data: {
    lang: "en",
    time: 10,
    questions: 15,
    difficulty: 1
  },

  load() {
    // URL params tienen prioridad
    const urlParams = new URLSearchParams(window.location.search);
    ["lang","time","questions","difficulty"].forEach(key => {
      if (urlParams.has(key)) {
        this.data[key] = isNaN(urlParams.get(key)) ? urlParams.get(key) : parseInt(urlParams.get(key));
      }
    });

    // LocalStorage si no hay params
    Object.keys(this.data).forEach(k => {
      const saved = localStorage.getItem("vocaboomb_" + k);
      if (saved !== null && !urlParams.has(k)) {
        this.data[k] = isNaN(saved) ? saved : parseInt(saved);
      }
    });

    this.applyUI();
  },

  save() {
    Object.keys(this.data).forEach(k => {
      localStorage.setItem("vocaboomb_" + k, this.data[k]);
    });
  },

  applyUI() {
    $("#langSelect").val(this.data.lang);
    $("#timeKnob").val(this.data.time).trigger("change");
    $("#numQuestions").val(this.data.questions);
    $("#numQuestionsVal").text(this.data.questions);
    $("#difficultySwitch").prop("checked", this.data.difficulty === 2);
    $("#difficultyEmoji").text(this.data.difficulty === 2 ? "🥵" : "😎");

    $("#timeKnob").knob({
      min: 2, max: 30, step: 1,
      change: v => this.data.time = v
    });
  }
};

$("#langSelect").on("change", function(){ Settings.data.lang = this.value; });
$("#numQuestions").on("input", function(){
  Settings.data.questions = parseInt(this.value);
  $("#numQuestionsVal").text(this.value);
});
$("#difficultySwitch").on("change", function(){
  Settings.data.difficulty = this.checked ? 2 : 1;
  $("#difficultyEmoji").text(this.checked ? "🥵" : "😎");
});
