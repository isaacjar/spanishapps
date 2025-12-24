const Settings = {
  defaults: { lang: "es", numint: 6 },

  /* =========================
     CARGA SETTINGS
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
  }
};
