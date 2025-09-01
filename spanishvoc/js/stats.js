export const Stats = {
  init() {
    if (!localStorage.getItem("vocaboomb_total")) localStorage.setItem("vocaboomb_total", "0");
    if (!localStorage.getItem("vocaboomb_hits"))  localStorage.setItem("vocaboomb_hits",  "0");

    document.getElementById("resetStats")?.addEventListener("click", () => {
      if (confirm("⚠️ ¿Seguro que quieres borrar las estadísticas?")) {
        localStorage.setItem("vocaboomb_total", "0");
        localStorage.setItem("vocaboomb_hits",  "0");
        this.show();
      }
    });
  },

  add(correct) {
    const t = parseInt(localStorage.getItem("vocaboomb_total") || "0") + 1;
    const h = parseInt(localStorage.getItem("vocaboomb_hits")  || "0") + (correct ? 1 : 0);
    localStorage.setItem("vocaboomb_total", String(t));
    localStorage.setItem("vocaboomb_hits",  String(h));
  },

  show() {
    const total = parseInt(localStorage.getItem("vocaboomb_total") || "0");
    const hits  = parseInt(localStorage.getItem("vocaboomb_hits")  || "0");
    const pct   = total ? Math.round((hits / total) * 100) : 0;
    const box = document.getElementById("statsContent");
    if (box) box.innerHTML = `Preguntas: ${total}<br>✅ Aciertos: ${hits}<br>📈 ${pct}%`;
  }
};
