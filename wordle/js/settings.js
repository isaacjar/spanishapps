const Settings = {
  defaults: { lang: "es", numint: 6 },

  /* =========================
     CARGA SETTINGS
     Prioridad: URL > localStorage > defaults
  ========================= */
  load() {
    const url = new URLSearchParams(location.search);
    let lang = url.get("lang") || localStorage.lang || this.defaults.lang;
    let numint = parseInt(url.get("numint")) || parseInt(localStorage.numint) || this.defaults.numint;
    let voclist = url.get("voclist") || null;

    // Validaciones
    if (!["es","en"].includes(lang)) lang = this.defaults.lang;
    if (numint < 4 || numint > 10) numint = this.defaults.numint;

    return { lang, numint, voclist };
  },

  /* =========================
     GUARDAR SETTINGS
  ========================= */
  save(s) {
    if (s.lang) localStorage.lang = s.lang;
    if (s.numint) localStorage.numint = s.numint;
  },

  /* =========================
     ESTADÍSTICAS DEL JUEGO
     Guardar y leer stats en localStorage
  ========================= */
  stats() {
    return JSON.parse(localStorage.stats || '{"played":0,"won":0}');
  },

  saveStats(st) {
    localStorage.stats = JSON.stringify(st);
  },

  /* =========================
     RESET COMPLETO
     Borra settings y stats
  ========================= */
  resetAll() {
    localStorage.removeItem("lang");
    localStorage.removeItem("numint");
    localStorage.removeItem("stats");
  }
};

// Exponer globalmente para que app.js lo pueda usar
window.Settings = Settings;
