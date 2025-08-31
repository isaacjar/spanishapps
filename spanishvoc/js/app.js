window.addEventListener("DOMContentLoaded", () => {
  Settings.load();
  UI.init();
  Game.init();
  Stats.init();

  // cargar lista de listas (versión moderna con módulos)
import("https://isaacjar.github.io/spanishapps/spanishvoc/voclists/index.js")
  .then(module => {
    UI.renderVoclists(module.voclists);

    // Si hay voclist en URL → cargar directamente
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("voclist")) {
      UI.loadVoclist(urlParams.get("voclist"));
    }
  })
  .catch(err => console.error("Error cargando voclists:", err));
});
