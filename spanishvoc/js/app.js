// app.js  ✅ versión ESM unificada

import { UI } from "./ui.js";
import { Game } from "./game.js";
import { Stats } from "./stats.js";
import { Settings } from "./settings.js";
import("../voclists/index.js");
//import { voclists } from "https://isaacjar.github.io/spanishapps/spanishvoc/voclists/index.js";

// Exponer para depuración opcional en consola
window.Game = Game;
window.UI = UI;

window.addEventListener("DOMContentLoaded", () => {
  Settings.load();
  UI.init();
  Game.init();
  Stats.init();

  // Renderizar listas filtradas según user=... o fallback a Isaac
  UI.renderVoclists(getUserVoclists(voclists));

  // Si hay voclist en la URL → cargar directamente
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("voclist")) {
    UI.loadVoclist(urlParams.get("voclist"));
  }
});

/* ========= Helpers multiusuario ========= */

// Obtiene el usuario activo (query param o fallback)
function getActiveUser() {
  const params = new URLSearchParams(window.location.search);
  const userParam = params.get("user");
  return userParam ? userParam : "Isaac";
}

// Filtra las listas por usuario activo
function getUserVoclists(allVoclists) {
  const activeUser = getActiveUser();
  let filtered = allVoclists.filter(v => v.misc === activeUser);

  // fallback si no hay listas para ese user
  if (filtered.length === 0) {
    filtered = allVoclists.filter(v => v.misc === "Isaac");
  }
  return filtered;
}
