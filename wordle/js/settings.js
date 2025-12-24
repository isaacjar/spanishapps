const Settings = {
  defaults: { lang: "es", numint: 6 },

  load() {
    const url = new URLSearchParams(location.search);
    return {
      lang: url.get("lang") || localStorage.lang || this.defaults.lang,
      numint: parseInt(url.get("numint")) || localStorage.numint || this.defaults.numint,
      voclist: url.get("voclist")
    };
  },

  save(s) {
    localStorage.lang = s.lang;
    localStorage.numint = s.numint;
  }
};
