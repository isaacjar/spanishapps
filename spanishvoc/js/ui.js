const UI = {
  currentScreen: null,

  init() {
    // Botones menú
    const byId = id => document.getElementById(id);
    byId("btnVoclists")?.addEventListener("click", () => this.showVoclists());
    byId("btnGame1")?.addEventListener("click", () => Game.start("es2lang"));
    byId("btnGame2")?.addEventListener("click", () => Game.start("lang2es"));
    byId("btnStats")?.addEventListener("click", () => this.showStats());
    byId("btnReview")?.addEventListener("click", () => this.showReview());

    // Settings
    document.getElementById("settingsBtn")?.addEventListener("click", () => this.openSettings());

    // Pantalla inicial
    this.showMenu();
  },

  /* ===== Pantallas ===== */
  showScreen(id) {
    const newEl = document.getElementById(id);
    const current = this.currentScreen;
  
    if (current && current !== newEl) {
      // salida
      gsap.to(current, {
        opacity: 0,
        y: 40,
        duration: 0.25,
        onComplete: () => {
          current.classList.add("hidden");
          // entrada
          newEl.classList.remove("hidden");
          gsap.fromTo(newEl,
            { opacity: 0, y: -30 },
            { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
          );
          this.currentScreen = newEl;
        }
      });
    } else {
      // primera vez o mismo panel
      newEl.classList.remove("hidden");
      gsap.fromTo(newEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      this.currentScreen = newEl;
    }
  },
  showMenu() {
    this.showScreen("menuScreen");
    document.getElementById("settingsBtn")?.classList.remove("hidden");
    document.getElementById("gameStatus")?.classList.add("hidden");
  },
  showVoclists() { this.showScreen("voclistScreen"); },
  showGame() {
    this.showScreen("gameScreen");
    document.getElementById("settingsBtn")?.classList.add("hidden");
    document.getElementById("gameStatus")?.classList.remove("hidden");
  },
  showStats() {
    this.showScreen("statsScreen");
    Stats.show();
  }, 
  showReview() {   /* ===== Review ===== */
    if (!window.currentVoclist || !window.currentVoclist.length) {
      this.toast("⚠️ Primero carga una lista de vocabulario");
      return;
    }
    const box = document.getElementById("reviewContent");
    box.innerHTML = "";
    window.currentVoclist.forEach(w => {
      const div = document.createElement("div");
      div.innerHTML = `<b>${w.es}</b>: ${w[Settings.data.lang]}`;
      box.appendChild(div);
    });
    this.showScreen("reviewScreen");
  },
  closeReview() { this.showMenu(); },

  /* ===== Voclists ===== */
  renderVoclists(voclists) {
    const cont = document.getElementById("voclistContainer");
    if (!cont) return;
    cont.innerHTML = "";
    voclists.forEach(v => {
      const btn = document.createElement("button");
      btn.className = "menu-btn";
      btn.textContent = v.title;
      btn.addEventListener("click", () => this.loadVoclist(v.filename));
      cont.appendChild(btn);
    });
  },

  async loadVoclist(filename) {
    try {
      const url = `https://isaacjar.github.io/spanishapps/spanishvoc/voclists/${filename}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("No se pudo cargar el vocabulario");
      window.currentVoclist = await res.json();
      this.toast(`📚 Cargado set: ${filename}`);
      this.showMenu();
    } catch (e) {
      console.error(e);
      this.toast("⚠️ Error cargando lista");
    }
  },

  /* ===== Settings modal ===== */
  openSettings() { document.getElementById("settingsModal")?.classList.remove("hidden"); },
  closeSettings() { document.getElementById("settingsModal")?.classList.add("hidden"); Settings.save(); },

  /* ===== Barra superior ===== */
  updateGameStatus(state) {
    const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
    set("progress", `🌱 ${state.currentQ}/${Settings.data.questions}`);
    set("score",    `🏅 ${state.score}`);
    set("streak",   `🔥 ${state.streak}`);
    set("lives",    `❤️ ${state.lives}`);
  },

  /* ===== Toasts ===== */
  toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1900);
  },
  toastSuccess() {
    const msgs = ["🐼 ¡Genial!","🎉 ¡Correcto!","🌟 ¡Bien hecho!","💡 ¡Lo pillaste!","🥳 ¡Acertaste!","🐸 ¡Perfecto!","🚀 ¡Lo clavaste!","🍀 ¡De lujo!","🦄 ¡Fantástico!","🔥 ¡Imparable!"];
    this.toast(msgs[Math.floor(Math.random() * msgs.length)]);
  },
  toastFail() {
    const msgs = ["😅 Uy, casi...","❌ No pasa nada, ¡sigue!","🙈 ¡Fallaste!","🍂 ¡Inténtalo otra vez!","🤔 No era esa...","🌧️ Mala suerte...","🐌 ¡Se escapó esa!","🙃 Ups, ¡no!","🍄 ¡Otra oportunidad!","🐤 ¡Esa no era..."];
    this.toast(msgs[Math.floor(Math.random() * msgs.length)]);
  }
};
