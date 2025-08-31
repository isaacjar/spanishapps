const UI = {
  init() {
    $("#btnVoclists").on("click", ()=> this.showVoclists());
    $("#btnGame1").on("click", ()=> Game.start("es2lang"));
    $("#btnGame2").on("click", ()=> Game.start("lang2es"));
    $("#btnStats").on("click", ()=> this.showStats());
    $("#settingsBtn").on("click", ()=> this.openSettings());
  },

  showMenu() {
    $("section").addClass("hidden");
    $("#menuScreen").removeClass("hidden");
    $("#settingsBtn").show();
    $("#gameStatus").hide();
  },

  showVoclists() {
    $("section").addClass("hidden");
    $("#voclistScreen").removeClass("hidden");
    // cargar voclists dinámicamente aquí
  },

  showGame() {
    $("section").addClass("hidden");
    $("#gameScreen").removeClass("hidden");
    $("#settingsBtn").hide();
    $("#gameStatus").show();
  },

  showStats() {
    $("section").addClass("hidden");
    $("#statsScreen").removeClass("hidden");
    Stats.show();
  },

  updateGameStatus(state) {
    $("#progress").text(`🌱 ${state.currentQ}/${Settings.data.questions}`);
    $("#score").text(`🏅 ${state.score}`);
    $("#streak").text(`🔥 ${state.streak}`);
    $("#lives").text(`❤️ ${state.lives}`);
  },

  openSettings() { $("#settingsModal").removeClass("hidden"); },
  closeSettings() { $("#settingsModal").addClass("hidden"); Settings.save(); },

  // ✅ Toasts
  toast(msg) {
    const t = $("<div>").addClass("toast").text(msg).appendTo("body");
    setTimeout(()=>t.fadeOut(500,()=>t.remove()),1500);
  },

  toastSuccess() {
    const msgs = ["🐼 ¡Genial!","🎉 ¡Correcto!","🌟 ¡Bien hecho!","💡 ¡Lo pillaste!","🥳 ¡Acertaste!","🐸 ¡Perfecto!","🚀 ¡Lo clavaste!","🍀 ¡De lujo!","🦄 ¡Fantástico!","🔥 ¡Imparable!"];
    this.toast(msgs[Math.floor(Math.random()*msgs.length)]);
  },

  toastFail() {
    const msgs = ["😅 Uy, casi...","❌ No pasa nada, ¡sigue!","🙈 ¡Fallaste!","🍂 ¡Inténtalo otra vez!","🤔 No era esa...","🌧️ Mala suerte...","🐌 ¡Se escapó esa!","🙃 Ups, ¡no!","🍄 ¡Otra oportunidad!","🐤 ¡Esa no era..."];
    this.toast(msgs[Math.floor(Math.random()*msgs.length)]);
  }
};
