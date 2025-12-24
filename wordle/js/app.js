// app.js
(async function(){
  const settings=Settings.load();
  let langData;
  try{langData=await fetch("lang.json").then(r=>r.json());}catch(e){console.error("Error cargando lang.json",e);return;}
  const t=langData[settings.lang]||langData.es;
  window.i18n=t;
  document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(t[key])el.textContent=t[key];});
  window.addEventListener("keydown",e=>{
    if(!window.Game||Game.finished)return;
    if(/^[a-zñ]$/i.test(e.key)){UI.handleInput(normalize(e.key));return;}
    if(e.key==="Backspace"){e.preventDefault();UI.handleInput("BACK");return;}
    if(e.key==="Enter"){UI.handleInput("ENTER");return;}
  });
  document.getElementById("btnNew")?.addEventListener("click",()=>{
    if(Game.row>0&&!Game.finished){UI.toast(t.confirmNew||"¿Desea terminar la partida actual?");return;}
    Game.reset();
    UI.renderBoard(Game.attempts,Game.numLetters);
    UI.updateBoard();
  });
  document.getElementById("btnSettings")?.addEventListener("click",()=>{UI.toast(t.settings||"⚙️ Settings");});
  if(settings.voclist){
    const direct=voclists.find(v=>v.filename===settings.voclist);
    if(direct){startGame(direct,settings);return;}
  }
  UI.showVocabPopup(voclists,selected=>{startGame(selected,settings);});
})();
async function startGame(voc,settings){
  let vocModule,valModule;
  try{
    vocModule=await import(`../data/${voc.filename}.js`);
    valModule=await import(`../data/${voc.val}.js`);
  }catch(e){console.error(e);UI.toast(window.i18n.vocabError||"❌ Error cargando vocabulario");return;}
  if(!vocModule.default?.length){UI.toast(window.i18n.vocabEmpty||"📭 Vocabulario vacío");return;}
  if(!valModule.default?.length){UI.toast(window.i18n.validationEmpty||"📭 Validación vacía");return;}
  Game.init(vocModule.default,valModule.default,Number(voc.num),Number(settings.numint));
  UI.renderBoard(Game.attempts,Game.numLetters);
  UI.renderKeyboard(settings.lang);
  UI.updateBoard();
}
