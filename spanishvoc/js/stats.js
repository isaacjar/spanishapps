const Stats = {
  init() {
    if (!localStorage.getItem("vocaboomb_total")) {
      localStorage.setItem("vocaboomb_total",0);
      localStorage.setItem("vocaboomb_hits",0);
    }
    $("#resetStats").on("click", ()=>{
      if (confirm("⚠️ ¿Seguro que quieres borrar las estadísticas?")) {
        localStorage.setItem("vocaboomb_total",0);
        localStorage.setItem("vocaboomb_hits",0);
        this.show();
      }
    });
  },

  add(correct) {
    localStorage.setItem("vocaboomb_total", parseInt(localStorage.getItem("vocaboomb_total"))+1);
    if (correct) {
      localStorage.setItem("vocaboomb_hits", parseInt(localStorage.getItem("vocaboomb_hits"))+1);
    }
  },

  show() {
    const total = parseInt(localStorage.getItem("vocaboomb_total"));
    const hits = parseInt(localStorage.getItem("vocaboomb_hits"));
    const pct = total>0 ? Math.round((hits/total)*100) : 0;
    $("#statsContent").html(`Preguntas: ${total}<br>✅ Aciertos: ${hits}<br>📈 ${pct}%`);
  }
};
