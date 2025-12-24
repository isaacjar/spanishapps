// app.js

(async function () {
  const settings = Settings.load();
  const langData = await fetch("lang.json").then(r => r.json());
  const t = langData[settings.lang];

  document.querySelectorAll("[data-i18n]").forEach(el =>
    el.textContent = t[el.dataset.i18n]
  );

  if (!settings.voclist) {
    UI.toast(t.selectList);
    return;
  }

  const voc = await import(`./data/${settings.voclist}.js`);
  const val = await import(`./data/${voc.val}.js`);

  Game.init(voc.default, val.default, voc.num, settings.numint);
  UI.renderBoard(settings.numint, voc.num);
})();
