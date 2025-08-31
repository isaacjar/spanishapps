window.addEventListener("DOMContentLoaded", () => {
  Settings.load();
  UI.init();
  Game.init();
  Stats.init();

  // cargar lista de listas
  fetch("https://isaacjar.github.io/spanishapps/spanishvoc/voclists/index.js")
    .then(r => r.text())
    .then(code => {
      eval(code); // crea la variable global voclists
      UI.renderVoclists(voclists);

      // Si hay voclist en URL → cargar directamente
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("voclist")) {
        UI.loadVoclist(urlParams.get("voclist"));
      }
    });
});
