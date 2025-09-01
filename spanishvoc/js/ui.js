const UI = {
  currentScreen: null,
  pendingAction: null,
  
  init() {
    // Botones menú
    const byId = id => document.getElementById(id);
    byId("btnVoclists")?.addEventListener("click", () => this.showVoclists());
    byId("btnGame1")?.addEventListener("click", () => this.startGame("es2lang"));
    byId("btnGame2")?.addEventListener("click", () => this.startGame("lang2es"));
    byId("btnStats")?.addEventListener("click", () => this.showStats());
    byId("btnReview")?.addEventListener("click", () => this.showReview());

    // Settings
    document.getElementById("settingsBtn")?.addEventListener("click", () => this.openSettings());

    // 🔥 Logo vuelve al menú principal (y detiene el juego si está en curso)
    document.querySelector(".logo")?.addEventListener("click", () => {
      if (typeof Game !== "undefined" && typeof Game.stop === "function") {
        Game.stop();
      }
      this.showMenu();
    });

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
      /*this.toast("⚠️ Primero carga una lista de vocabulario");*/
      this.pendingAction = "review";
      this.showVoclists();
      return;
    }
    // Título con nombre del listado
    /*const title = document.getElementById("reviewTitle");
    if (title && window.currentVoclistName) {
      title.textContent = `📖 ${window.currentVoclistName}`;
    }*/
    // Contenido
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
  /* ===== Settings ===== */
  openSettings() {
    document.getElementById("settingsModal")?.classList.remove("hidden");
  },
  closeSettings() {
    document.getElementById("settingsModal")?.classList.add("hidden");
  },
  
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
      // 🔹 Guardar también el título del listado
      const list = voclists.find(v => v.filename === filename);
      window.currentVoclistName = list ? list.title : filename;

      // 🆕 Actualizar etiqueta en MENU
      const label = document.getElementById("currentListLabel");
      if (label) {
        label.textContent = window.currentVoclistName 
          ? "📖 " + window.currentVoclistName 
          : "";
      }
        
      if (this.pendingAction) {
        if (this.pendingAction === "review") {
          this.showReview();
        } else if (Array.isArray(this.pendingAction) && this.pendingAction[0] === "game") {
          Game.start(this.pendingAction[1]);
        }
        this.pendingAction = null;
      } else {
        this.showMenu(); // comportamiento normal
      }
    } catch (e) {
      console.error(e);
      this.toast("⚠️ Error cargando lista");
    }
  },

  /* ==== Settings Modal ==== */
  showSettings() {
    document.getElementById("settingsModal")?.classList.remove("hidden");
  },
  
  closeSettings() {
    document.getElementById("settingsModal")?.classList.add("hidden");
  },

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
  },
  startGame(mode) {
    if (!window.currentVoclist || !window.currentVoclist.length) {
      this.pendingAction = ["game", mode];
      this.showVoclists();
      return;
    }
    Game.start(mode);
  }
};
