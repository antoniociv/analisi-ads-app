/* Analisi Ads — Mini App Telegram. Vanilla JS, nessuna build.
   Tutti i dati arrivano dall'API e vanno nel DOM via textContent (mai innerHTML). */
(() => {
  "use strict";

  const tg = window.Telegram && window.Telegram.WebApp;
  const app = document.getElementById("app");
  const API = (window.API_BASE || "").replace(/\/$/, "");

  // Tema scelto dall'utente: giorno (default) o notte. Non segue il tema di Telegram.
  // Salvato nel CloudStorage Telegram dell'utente (vale su tutti i suoi dispositivi) + copia locale
  // per applicarlo subito all'apertura, prima che il CloudStorage risponda.
  const THEME_KEY = "theme";
  const cloud = tg && tg.CloudStorage && tg.isVersionAtLeast && tg.isVersionAtLeast("6.9") ? tg.CloudStorage : null;
  let theme = new URLSearchParams(location.search).get("theme")   // ?theme=dark per anteprime fuori da Telegram
    || localGet(THEME_KEY) || "light";

  function localGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function localSet(k, v) { try { localStorage.setItem(k, v); } catch (_) { /* storage bloccato */ } }

  function applyTheme() {
    const dark = theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#000000" : "#f2f2f7");
    if (tg && tg.isVersionAtLeast && tg.isVersionAtLeast("6.1")) {
      const bg = dark ? "#000000" : "#f2f2f7";
      try { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); } catch (_) { /* client vecchio */ }
    }
    document.querySelectorAll("[data-theme-toggle]").forEach(updateToggle);
  }

  function setTheme(t) {
    theme = t;
    localSet(THEME_KEY, t);
    if (cloud) { try { cloud.setItem(THEME_KEY, t); } catch (_) { /* niente */ } }
    applyTheme();
  }

  function updateToggle(btn) {
    const dark = theme === "dark";
    btn.replaceChildren(icon(dark ? "sun" : "moon", 19));
    btn.setAttribute("aria-label", dark ? "Passa alla modalità giorno" : "Passa alla modalità notte");
  }

  if (tg) {
    tg.ready();
    tg.expand();
    tg.BackButton.onClick(() => history.length > 1 ? history.back() : go("#/"));
  }
  applyTheme();
  if (cloud && !new URLSearchParams(location.search).get("theme")) {
    cloud.getItem(THEME_KEY, (err, v) => {
      if (!err && (v === "light" || v === "dark") && v !== theme) { theme = v; localSet(THEME_KEY, v); applyTheme(); }
    });
  }

  // ------------------------------------------------------------ helper DOM

  function h(tag, attrs, ...children) {
    const svg = tag.startsWith("svg:");
    const el = svg ? document.createElementNS("http://www.w3.org/2000/svg", tag.slice(4)) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }
  const S = (tag, attrs, ...c) => h("svg:" + tag, attrs, ...c);

  // Icone a tratto (stile SF Symbols / Lucide), viewBox 24.
  const ICONS = {
    megaphone: [["path", { d: "m3 11 18-5v12L3 14v-3z" }], ["path", { d: "M11.6 16.8a3 3 0 1 1-5.8-1.6" }]],
    link: [["path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }], ["path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }]],
    send: [["path", { d: "m22 2-7 20-4-9-9-4Z" }], ["path", { d: "M22 2 11 13" }]],
    users: [["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }], ["circle", { cx: 9, cy: 7, r: 4 }], ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }], ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }]],
    crown: [["path", { d: "m2 7 4.5 4L12 4l5.5 7L22 7l-2 11H4L2 7z" }], ["path", { d: "M5 21h14" }]],
    calendar: [["rect", { x: 3, y: 4, width: 18, height: 18, rx: 4 }], ["path", { d: "M16 2v4M8 2v4M3 10h18" }]],
    bolt: [["path", { d: "M13 2 3 14h9l-1 8 10-12h-9l1-8z" }]],
    chevron: [["path", { d: "m9 18 6-6-6-6" }]],
    plus: [["path", { d: "M12 5v14M5 12h14" }]],
    copy: [["rect", { x: 8, y: 8, width: 14, height: 14, rx: 3 }], ["path", { d: "M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" }]],
    refresh: [["path", { d: "M21 12a9 9 0 1 1-3-6.7L21 8" }], ["path", { d: "M21 3v5h-5" }]],
    tick: [["path", { d: "M20 6 9 17l-5-5" }]],
    close: [["path", { d: "M18 6 6 18M6 6l12 12" }]],
    alert: [["path", { d: "M12 8v5M12 16.5h.01" }], ["circle", { cx: 12, cy: 12, r: 10 }]],
    trend: [["path", { d: "m22 7-8.5 8.5-5-5L2 17" }], ["path", { d: "M16 7h6v6" }]],
    gear: [["path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }], ["circle", { cx: 12, cy: 12, r: 3 }]],
    sun: [["circle", { cx: 12, cy: 12, r: 4 }], ["path", { d: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" }]],
    moon: [["path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }]],
    book: [["path", { d: "M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" }], ["path", { d: "M8 7h6M8 11h8" }]],
    shield: [["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }]],
  };
  function icon(name, size = 18, stroke = 2.2) {
    return S("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
      "stroke-width": stroke, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
      (ICONS[name] || []).map(([t, a]) => S(t, a)));
  }

  const fmt = (n) => (n === null || n === undefined) ? "—" : Number(n).toLocaleString("it-IT");
  const pct = (n) => (n === null || n === undefined) ? "—" : `${String(n).replace(".", ",")}%`;
  // Colore fisso per campagna (segue l'id, non la posizione in lista).
  const campaignColor = (id) => id ? `var(--c${((id - 1) % 8) + 1})` : "var(--muted)";
  const initial = (s) => (String(s || "?").trim()[0] || "?").toUpperCase();

  function fmtDate(utc, withTime = true) {
    if (!utc) return "—";
    const d = new Date(utc.replace(" ", "T") + "Z");
    const opt = { day: "numeric", month: "short" };
    if (withTime) Object.assign(opt, { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleString("it-IT", opt);
  }

  function userLabel(u) {
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
    return name || (u.username ? `@${u.username}` : `Utente ${u.telegram_user_id}`);
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("on"), 2600);
  }

  function haptic(type = "success") {
    try { tg && tg.HapticFeedback.notificationOccurred(type); } catch (_) { /* fuori da Telegram */ }
  }
  function tapFeedback() {
    try { tg && tg.HapticFeedback.selectionChanged(); } catch (_) { /* fuori da Telegram */ }
  }

  function confirmBox(msg) {
    return new Promise((resolve) => {
      if (tg && tg.showConfirm && tg.isVersionAtLeast && tg.isVersionAtLeast("6.2")) tg.showConfirm(msg, resolve);
      else resolve(true);
    });
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Link copiato");
      haptic();
    } catch (_) {
      toast(text);
    }
  }

  const go = (hash) => { location.hash = hash; };

  // ------------------------------------------------------------ API

  function sessionGet(k) {
    try { return sessionStorage.getItem(k); } catch (_) { return null; }
  }
  // Fuori da Telegram, per test: ?devkey=XXX nell'URL (resta solo nella sessione del browser).
  (() => {
    const k = new URLSearchParams(location.search).get("devkey");
    if (k) { try { sessionStorage.setItem("devKey", k); } catch (_) { /* niente */ } }
  })();

  async function api(path, opts = {}) {
    const headers = { "Content-Type": "application/json" };
    if (tg && tg.initData) headers.Authorization = "tma " + tg.initData;
    const devKey = sessionGet("devKey");
    if (devKey) headers["X-Api-Key"] = devKey;
    let res;
    try {
      res = await fetch(API + path, { ...opts, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    } catch (_) {
      throw new Error("Server non raggiungibile");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Errore ${res.status}`);
    return data;
  }

  // Chi sta usando l'app (registra anche l'ultimo accesso). Una sola chiamata per sessione.
  let mePromise = null;
  const getMe = () => (mePromise = mePromise || api("/api/me").catch((e) => { mePromise = null; throw e; }));

  // ------------------------------------------------------------ router

  const routes = [
    [/^#?\/?$/, "overview", pageOverview],
    [/^#\/campaigns$/, "campaigns", pageCampaigns],
    [/^#\/campaigns\/new$/, "campaigns", pageNewCampaign],
    [/^#\/campaign\/(\d+)$/, "campaigns", pageCampaign],
    [/^#\/links$/, "links", pageLinks],
    [/^#\/links\/new(?:\?.*)?$/, "links", pageNewLink],
    [/^#\/channels$/, "channels", pageChannels],
    [/^#\/settings$/, "overview", pageSettings],
    [/^#\/guida(?:\?.*)?$/, "guide", pageGuide],
  ];

  async function render() {
    const hash = location.hash || "#/";
    for (const [re, tab, page] of routes) {
      const m = hash.match(re);
      if (!m) continue;
      document.querySelectorAll(".tabbar a").forEach((a) => a.classList.toggle("on", a.dataset.tab === tab));
      const isRoot = ["#/", "#/campaigns", "#/links", "#/channels", "#/guida", ""].includes(hash);
      if (tg) isRoot ? tg.BackButton.hide() : tg.BackButton.show();
      app.replaceChildren(h("div", { class: "skeleton", style: "height:56px;width:60%;border-radius:20px" }),
        h("div", { class: "skeleton", style: "height:240px" }), h("div", { class: "skeleton" }));
      try {
        const view = await page(...m.slice(1));
        app.replaceChildren(view, versionLine());
        setTimeout(animateIn, 60);
      } catch (e) {
        app.replaceChildren(notice(e.message));
      }
      window.scrollTo(0, 0);
      return;
    }
    go("#/");
  }
  window.addEventListener("hashchange", render);

  // Versione pubblicata, scritta in <body data-version> da setup/pubblica-webapp.sh.
  const versionLine = () => h("p", { class: "version" }, `Analisi Ads · ${document.body.dataset.version || "sviluppo"}`);

  // Anelli e barre partono da zero e si riempiono dopo il primo frame.
  function animateIn(root = app) {
    root.querySelectorAll("[data-offset]").forEach((el) => el.setAttribute("stroke-dashoffset", el.dataset.offset));
    root.querySelectorAll("[data-width]").forEach((el) => { el.style.width = el.dataset.width; });
  }

  // ------------------------------------------------------------ componenti

  function notice(text, href) {
    const inner = [h("div", { class: "ic" }, icon("alert", 18)), h("div", { class: "grow" }, text),
      href ? h("span", { class: "chev" }, icon("chevron", 16)) : null];
    return href ? h("a", { class: "notice fade-in", href }, inner) : h("div", { class: "notice fade-in" }, inner);
  }

  function header(eyebrow, title, action) {
    return h("div", { class: "row spread", style: "align-items:flex-end" },
      h("div", { class: "grow" }, eyebrow ? h("p", { class: "eyebrow" }, eyebrow) : null, h("h1", {}, title)),
      action ? h("div", { style: "margin-bottom:22px" }, action) : null);
  }

  function themeToggle() {
    const btn = h("button", { class: "btn tinted icon", type: "button", "data-theme-toggle": true, style: "width:40px;height:40px",
      onclick: () => { setTheme(theme === "dark" ? "light" : "dark"); tapFeedback(); } });
    updateToggle(btn);
    return btn;
  }

  function addButton(href, label) {
    return h("a", { class: "add-btn", href, "aria-label": label }, icon("plus", 20, 2.6));
  }

  // Anelli concentrici stile Fitness. list: [{value 0-100, color, gradTo}]
  let gradId = 0;
  function rings(list, size, width, centerTop, centerSub) {
    const defs = S("defs");
    const parts = [];
    list.forEach((r, i) => {
      const radius = (size - width) / 2 - i * (width + 4);
      const c = 2 * Math.PI * radius;
      const id = `g${++gradId}`;
      // L'arco parte in alto (svg ruotato di -90°): il gradiente segue il verso dell'arco.
      defs.append(S("linearGradient", { id, x1: "1", y1: "0.5", x2: "0", y2: "0.5" },
        S("stop", { offset: "0", "stop-color": r.color }), S("stop", { offset: "1", "stop-color": r.gradTo || r.color })));
      const val = Math.max(0, Math.min(100, r.value || 0));
      parts.push(S("circle", { cx: size / 2, cy: size / 2, r: radius, fill: "none", stroke: r.color, "stroke-opacity": .18, "stroke-width": width }));
      parts.push(S("circle", { class: "ring-arc", cx: size / 2, cy: size / 2, r: radius, fill: "none", stroke: `url(#${id})`,
        "stroke-width": width, "stroke-linecap": "round", "stroke-dasharray": c, "stroke-dashoffset": c,
        "data-offset": c * (1 - val / 100), visibility: val > 0 ? "visible" : "hidden" }));
    });
    return h("div", { class: "rings", style: `width:${size}px;height:${size}px` },
      S("svg", { viewBox: `0 0 ${size} ${size}` }, defs, parts),
      h("div", { class: "center" }, h("b", {}, centerTop), centerSub ? h("span", {}, centerSub) : null));
  }

  function miniRing(value, color) {
    const size = 62, width = 7, radius = (size - width) / 2, c = 2 * Math.PI * radius;
    const val = Math.max(0, Math.min(100, value || 0));
    return h("div", { class: "mini" },
      S("svg", { viewBox: `0 0 ${size} ${size}` },
        S("circle", { cx: size / 2, cy: size / 2, r: radius, fill: "none", stroke: color, "stroke-opacity": .18, "stroke-width": width }),
        S("circle", { class: "ring-arc", cx: size / 2, cy: size / 2, r: radius, fill: "none", stroke: color, "stroke-width": width,
          "stroke-linecap": "round", "stroke-dasharray": c, "stroke-dashoffset": c, "data-offset": c * (1 - val / 100),
          visibility: val > 0 ? "visible" : "hidden" })),
      h("b", {}, value === null || value === undefined ? "—" : `${Math.round(value)}%`));
  }

  // Riquadro principale: anelli (conversione VIP + presenti) e imbuto principale → VIP.
  function heroCard(f) {
    const presentPct = f.acquired ? (100 * f.present) / f.acquired : 0;
    const vipWidth = f.acquired ? Math.max(f.vip ? 14 : 0, (100 * f.vip) / f.acquired) : 0;
    return h("div", { class: "card fade-in", style: "padding:0" },
      h("div", { class: "hero" },
        rings([{ value: f.conversion_rate, color: "var(--pink)", gradTo: "var(--orange)" },
               { value: presentPct, color: "var(--blue)", gradTo: "var(--teal)" }],
              132, 14, pct(f.conversion_rate), "nel VIP"),
        h("div", { class: "legend-stack" },
          h("div", {}, h("div", { class: "lbl" }, h("span", { class: "dot", style: "background:var(--pink)" }), "Entrati nel VIP"),
            h("div", { class: "val" }, fmt(f.vip), h("small", {}, ` / ${fmt(f.acquired)}`))),
          h("div", {}, h("div", { class: "lbl" }, h("span", { class: "dot", style: "background:var(--blue)" }), "Ancora nel principale"),
            h("div", { class: "val" }, fmt(f.present), h("small", {}, ` · ${f.acquired ? Math.round(presentPct) : 0}%`))))),
      h("div", { class: "funnel" },
        h("div", { class: "bar" },
          h("i", { "data-width": f.acquired ? "100%" : "0%", style: "width:0;background:linear-gradient(90deg,var(--blue),var(--teal))" }),
          h("span", {}, h("span", {}, "Principale"), h("em", {}, fmt(f.acquired)))),
        h("div", { class: `bar${vipWidth < 45 ? " light" : ""}` },
          h("i", { "data-width": `${vipWidth}%`, style: "width:0;background:linear-gradient(90deg,var(--pink),var(--orange))" }),
          h("span", {}, h("span", {}, "VIP"), h("em", {}, fmt(f.vip))))));
  }

  function tile(value, label, iconName, color) {
    return h("div", { class: "tile fade-in" },
      h("div", { class: "ic", style: `background:${color}` }, icon(iconName, 18, 2.4)),
      h("div", { class: "v" }, value), h("div", { class: "l" }, label));
  }

  function campaignCell(c, href) {
    const color = campaignColor(c.id);
    const rate = c.conversion_rate || 0;
    return h("a", { class: "cell", href },
      h("div", { class: "avatar", style: `background:${color}` }, c.id ? initial(c.name) : icon("users", 18)),
      h("div", { class: "grow" },
        h("div", { class: "title ellipsis" }, c.name),
        h("div", { class: "sub num" }, `${fmt(c.acquired)} entrati · ${fmt(c.vip)} VIP`,
          c.status === "paused" ? " · in pausa" : "")),
      h("div", { class: "rate" },
        h("b", {}, pct(c.conversion_rate)),
        h("div", { class: "minibar" }, h("i", { "data-width": `${Math.min(100, rate)}%`, style: `width:0;background:${color}` }))),
      h("span", { class: "chev" }, icon("chevron", 16)));
  }

  function campaignGroup(t) {
    const cells = t.campaigns.map((c) => campaignCell(c, `#/campaign/${c.id}`));
    if (t.organic) cells.push(campaignCell({ ...t.organic, id: 0, name: "Organico / senza link" }, "#/campaign/0"));
    cells.push(h("div", { class: "cell" },
      h("div", { class: "avatar", style: "background:linear-gradient(135deg,var(--blue),var(--purple))" }, icon("trend", 18)),
      h("div", { class: "grow" }, h("div", { class: "title" }, "Totale"),
        h("div", { class: "sub num" }, `${fmt(t.total.acquired)} entrati · ${fmt(t.total.vip)} VIP`)),
      h("div", { class: "rate" }, h("b", {}, pct(t.total.conversion_rate))),
      h("span", { style: "width:16px" })));
    return [
      h("div", { class: "group fade-in" }, cells),
      t.vip_unknown_origin
        ? h("p", { class: "group-note" },
            `+ ${fmt(t.vip_unknown_origin)} ingressi nel VIP di utenti senza origine tracciata (erano nel principale prima del bot).`)
        : null,
    ];
  }

  function campaignsOrEmpty(t) {
    if (!t.campaigns.length && !t.organic) {
      return emptyState("megaphone", "Nessuna campagna", "Crea la prima campagna per generare il suo invite link.",
        h("a", { class: "btn small", href: "#/campaigns/new" }, icon("plus", 16, 2.6), "Nuova campagna"));
    }
    return campaignGroup(t);
  }

  function setupNotice(ov) {
    const msgs = [];
    if (!ov.channels) msgs.push("Aggiungi il bot come amministratore del canale principale e del VIP.");
    else {
      if (!ov.has_main) msgs.push("Nessun canale impostato come Principale.");
      if (!ov.has_vip) msgs.push("Nessun canale impostato come VIP.");
    }
    return msgs.length ? notice(`${msgs.join(" ")} Apri la guida passo passo.`, "#/guida") : null;
  }

  function emptyState(iconName, title, text, action) {
    return h("div", { class: "card empty fade-in" },
      h("div", { class: "big" }, icon(iconName, 26)),
      h("div", { style: "font-weight:700;color:var(--text);font-size:17px;margin-bottom:4px" }, title),
      h("div", { class: "small" }, text),
      action ? h("div", { style: "margin-top:16px" }, action) : null);
  }

  // ------------------------------------------------------------ pagine

  async function pageOverview() {
    const [ov, me] = await Promise.all([api("/api/overview"), getMe()]);
    const today = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
    return h("div", {},
      header(today, "Overview", h("div", { class: "row", style: "gap:8px" },
        themeToggle(),
        me.is_owner
          ? h("a", { class: "btn tinted icon", href: "#/settings", "aria-label": "Impostazioni", style: "width:40px;height:40px" }, icon("gear", 19))
          : null)),
      setupNotice(ov),
      heroCard(ov),
      h("div", { class: "tiles four" },
        tile(fmt(ov.today), "Nuovi oggi", "calendar", "var(--orange)"),
        tile(fmt(ov.week), "Questa settimana", "bolt", "var(--purple)"),
        tile(fmt(ov.active_campaigns), "Campagne attive", "megaphone", "var(--indigo)"),
        tile(fmt(ov.channels), "Canali monitorati", "send", "var(--teal)")),
      h("div", { class: "section-head" }, h("h2", {}, "Campagne"), h("a", { href: "#/campaigns", class: "small" }, "Vedi tutte")),
      campaignsOrEmpty(ov));
  }

  async function pageCampaigns() {
    const t = await api("/api/campaigns");
    return h("div", {},
      header("Analisi Ads", "Campagne", addButton("#/campaigns/new", "Nuova campagna")),
      campaignsOrEmpty(t));
  }

  // Blocco riusabile: crea / importa link, usato da "Nuova campagna" e "Nuovo link".
  function linkFields(channels) {
    const usable = channels.filter((c) => c.bot_is_admin);
    const state = { mode: "create" };
    const channelSel = h("select", {},
      usable.map((c) => h("option", { value: c.id, selected: c.role === "main" },
        `${c.name}${c.role !== "other" ? ` · ${c.role === "main" ? "principale" : "VIP"}` : ""}`)));
    const linkInput = h("input", { type: "url", placeholder: "https://t.me/+…", autocomplete: "off" });
    const expire = h("input", { type: "datetime-local" });
    const limit = h("input", { type: "number", min: "1", max: "99999", placeholder: "Nessuno", inputmode: "numeric" });

    const createBox = h("div", {},
      h("div", { class: "group" },
        h("label", { class: "form-cell" }, h("span", {}, "Scadenza"), expire),
        h("label", { class: "form-cell" }, h("span", {}, "Limite ingressi"), limit)),
      h("p", { class: "group-note" }, "Entrambi facoltativi."));
    const importBox = h("div", { hidden: true },
      h("div", { class: "group" }, h("label", { class: "form-cell" }, h("span", {}, "Link"), linkInput)),
      h("p", { class: "group-note" },
        "Gli ingressi già avvenuti con questo link (dopo l'arrivo del bot) vengono riattribuiti in automatico. Si revoca da Telegram, non da qui."));

    function setMode(m) {
      state.mode = m;
      createBox.hidden = m !== "create";
      importBox.hidden = m !== "import";
    }
    const choice = (value, title, desc) => h("label", { class: "choice cell" },
      h("input", { type: "radio", name: "lmode", value, checked: value === state.mode, onchange: () => { setMode(value); tapFeedback(); } }),
      h("span", { class: "check" }, icon("tick", 13, 3.2)),
      h("div", { class: "grow" }, h("div", { class: "title" }, title), h("div", { class: "sub" }, desc)));

    const el = h("div", {},
      h("div", { class: "group" }, h("label", { class: "form-cell" }, h("span", {}, "Canale"), channelSel)),
      h("div", { class: "group" },
        choice("create", "Crea un link nuovo", "Lo genera il bot: tracciamento esatto, revocabile da qui."),
        choice("import", "Importa un link esistente", "Un link creato a mano: viene abbinato per prefisso.")),
      createBox, importBox);
    setMode(state.mode);

    return {
      el,
      value: () => ({
        mode: state.mode,
        channel_id: Number(channelSel.value),
        invite_link: linkInput.value.trim() || null,
        expire_date: state.mode === "create" && expire.value ? expire.value : null,
        member_limit: state.mode === "create" && limit.value ? Number(limit.value) : null,
      }),
      empty: !usable.length,
    };
  }

  const noChannelsNotice = () => notice("Il bot non è ancora amministratore di nessun canale.", "#/channels");

  async function submitWith(btn, fn) {
    btn.disabled = true;
    try { await fn(); } catch (e) { haptic("error"); toast(e.message); btn.disabled = false; }
  }

  async function pageNewCampaign() {
    const { channels } = await api("/api/channels");
    const name = h("input", { type: "text", placeholder: "Instagram Reel 01", maxlength: "120" });
    const source = h("input", { type: "text", placeholder: "instagram" });
    const medium = h("input", { type: "text", placeholder: "reel, story, ads" });
    const campaign = h("input", { type: "text", placeholder: "lancio_ottobre" });
    const lf = linkFields(channels);
    const btn = h("button", { class: "btn block", type: "submit", disabled: lf.empty }, "Crea campagna");

    const form = h("form", {
      onsubmit: (ev) => {
        ev.preventDefault();
        if (!name.value.trim()) { toast("Il nome è obbligatorio"); name.focus(); return; }
        submitWith(btn, async () => {
          const r = await api("/api/campaigns", { method: "POST", body: {
            name: name.value.trim(), source: source.value.trim(), medium: medium.value.trim(),
            campaign: campaign.value.trim(), link: { ...lf.value(), name: name.value.trim() } } });
          haptic();
          toast(r.link && r.link.backfilled ? `Campagna creata · ${r.link.backfilled} ingressi riattribuiti` : "Campagna creata");
          history.replaceState(null, "", `#/campaign/${r.id}`);
          render();
        });
      },
    },
      h("div", { class: "group" },
        h("label", { class: "form-cell" }, h("span", {}, "Nome"), name),
        h("label", { class: "form-cell" }, h("span", {}, "Source"), source),
        h("label", { class: "form-cell" }, h("span", {}, "Medium"), medium),
        h("label", { class: "form-cell" }, h("span", {}, "Campaign"), campaign)),
      h("h2", {}, "Invite link"),
      lf.empty ? noChannelsNotice() : lf.el,
      h("div", { style: "margin-top:20px" }, btn));
    return h("div", {}, header(null, "Nuova campagna"), form);
  }

  async function pageCampaign(id) {
    id = Number(id);
    const d = await api(`/api/campaigns/${id}`);
    const c = d.campaign;
    const color = campaignColor(id);
    const tags = [c.source, c.medium, c.campaign].filter(Boolean);

    async function setStatus(status) {
      try {
        await api(`/api/campaigns/${id}`, { method: "PATCH", body: { status } });
        haptic();
        status === "archived" ? go("#/campaigns") : render();
      } catch (e) { toast(e.message); }
    }

    const head = h("div", { class: "row fade-in", style: "margin:8px 0 18px" },
      h("div", { class: "avatar", style: `background:${color};width:58px;height:58px;border-radius:22px;font-size:24px` },
        id ? initial(c.name) : icon("users", 24)),
      h("div", { class: "grow" },
        h("h1", { style: "margin:0;font-size:28px" }, c.name),
        h("div", { class: "row wrap", style: "gap:6px;margin-top:6px" },
          id === 0 ? h("span", { class: "pill" }, "entrati senza link di campagna") : null,
          c.status === "paused" ? h("span", { class: "pill orange" }, "In pausa") : id ? h("span", { class: "pill green" }, "Attiva") : null,
          tags.map((t) => h("span", { class: "pill" }, t)))));

    const actions = id === 0 ? null : h("div", { class: "row", style: "gap:8px;margin-bottom:14px" },
      h("button", { class: "btn tinted small", onclick: () => setStatus(c.status === "paused" ? "active" : "paused") },
        c.status === "paused" ? "Riattiva" : "Metti in pausa"),
      h("button", { class: "btn destructive small", onclick: async () => {
        if (await confirmBox(`Archiviare “${c.name}”? Sparirà dagli elenchi, i dati restano.`)) setStatus("archived");
      } }, "Archivia"));

    const retColors = ["var(--teal)", "var(--blue)", "var(--indigo)", "var(--purple)"];
    const ret = h("div", { class: "card fade-in" }, h("div", { class: "ret" }, d.retention.map((r, i) =>
      h("div", {}, miniRing(r.pct, retColors[i]),
        h("div", { class: "lbl" }, r.days === 1 ? "24 ore" : `${r.days} giorni`),
        h("div", { class: "of" }, r.eligible ? `su ${fmt(r.eligible)}` : "in attesa")))));

    const links = id === 0 ? null : [
      h("div", { class: "section-head" }, h("h2", {}, "Invite link"),
        h("a", { class: "small", href: `#/links/new?campaign=${id}` }, "Aggiungi")),
      h("div", { class: "group fade-in" },
        d.links.length ? d.links.map(linkCell) : h("div", { class: "empty" }, "Nessun link")),
    ];

    return h("div", {},
      head, actions,
      heroCard(d.funnel),
      h("h2", {}, "Ultimi 30 giorni"),
      h("div", { class: "card fade-in" }, lineChart(d.timeseries)),
      h("h2", {}, "Retention nel principale"),
      ret,
      links,
      h("h2", {}, "Utenti"),
      await usersList(id));
  }

  function linkCell(l) {
    const inactive = !l.is_active;
    const vip = l.channel_role === "vip";
    return h("div", { class: "cell", style: "align-items:flex-start" },
      h("div", { class: "avatar round", style: `background:${vip ? "var(--pink)" : "var(--blue)"};margin-top:2px` }, icon("link", 16)),
      h("div", { class: "grow" },
        h("div", { class: "row wrap", style: "gap:6px" },
          h("span", { class: "title ellipsis" }, l.name || l.campaign_name || "Link"),
          inactive ? h("span", { class: "pill red off" }, "revocato") : null),
        h("div", { class: "mono", style: "margin:3px 0 7px" }, l.telegram_invite_link),
        h("div", { class: "row wrap", style: "gap:6px" },
          l.channel_name ? h("span", { class: `pill ${vip ? "pink" : "blue"}` }, l.channel_name) : null,
          l.campaign_name && l.name !== l.campaign_name ? h("span", { class: "pill" }, l.campaign_name) : null,
          h("span", { class: "pill" }, l.origin === "bot" ? "dal bot" : "importato"),
          h("span", { class: "pill num" }, `${fmt(l.joins || 0)} ingressi`),
          l.expires_at ? h("span", { class: "pill" }, `scade ${fmtDate(l.expires_at)}`) : null,
          l.member_limit ? h("span", { class: "pill" }, `max ${fmt(l.member_limit)}`) : null)),
      h("div", { class: "row", style: "gap:6px;flex:none" },
        h("button", { class: "btn tinted icon", "aria-label": "Copia link", onclick: () => copy(l.telegram_invite_link) }, icon("copy", 16)),
        inactive ? null : h("button", { class: "btn destructive icon", "aria-label": "Revoca link", onclick: () => revoke(l) }, icon("close", 16, 2.6))));
  }

  async function revoke(l) {
    const msg = l.origin === "bot"
      ? "Revocare il link? Nessuno potrà più entrare con questo link."
      : "Disattivare il link? È importato: va revocato a mano anche su Telegram.";
    if (!(await confirmBox(msg))) return;
    try {
      await api(`/api/links/${l.id}/revoke`, { method: "POST" });
      haptic();
      toast("Link revocato");
      render();
    } catch (e) { toast(e.message); }
  }

  async function usersList(campaignId) {
    const state = { filter: "all", offset: 0 };
    const list = h("div", { class: "users" });
    const counter = h("div", { class: "small muted", style: "margin:12px 2px 4px" });
    const more = h("button", { class: "btn tinted small", hidden: true, onclick: () => load(false) }, "Mostra altri");
    const seg = h("div", { class: "seg" });
    for (const [k, v] of Object.entries({ all: "Tutti", vip: "VIP", nonvip: "Non VIP" })) {
      seg.append(h("button", { type: "button", class: k === state.filter ? "on" : "", onclick: (ev) => {
        state.filter = k;
        seg.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === ev.currentTarget));
        tapFeedback();
        load(true);
      } }, v));
    }

    async function load(reset) {
      if (reset) { state.offset = 0; list.replaceChildren(); }
      const r = await api(`/api/campaigns/${campaignId}/users?filter=${state.filter}&limit=100&offset=${state.offset}`);
      for (const u of r.users) {
        const label = userLabel(u);
        list.append(h("div", { class: "cell", style: "padding-left:0;padding-right:0" },
          h("div", { class: "avatar round", style: `background:var(--c${(u.telegram_user_id % 8) + 1})` }, initial(label)),
          h("div", { class: "grow" },
            h("div", { class: "title ellipsis" }, label),
            h("div", { class: "sub ellipsis" },
              u.username && label !== `@${u.username}` ? `@${u.username} · ` : "", `entrato ${fmtDate(u.joined_at)}`)),
          h("div", { class: "row", style: "gap:6px;flex:none" },
            u.in_main ? null : h("span", { class: "pill red" }, "uscito"),
            u.vip_at ? h("span", { class: "pill pink" }, icon("crown", 12, 2.4), fmtDate(u.vip_at, false)) : null)));
      }
      state.offset += r.users.length;
      counter.textContent = `${fmt(r.count)} utenti${state.offset < r.count ? ` · mostrati ${fmt(state.offset)}` : ""}`;
      more.hidden = state.offset >= r.count;
      if (!r.count) list.append(h("div", { class: "empty" }, "Nessun utente"));
    }
    await load(true);

    return h("div", { class: "card fade-in" }, seg, counter, list, h("div", { style: "margin-top:10px;text-align:center" }, more));
  }

  async function pageLinks() {
    const { links } = await api("/api/links");
    return h("div", {},
      header("Analisi Ads", "Invite link", addButton("#/links/new", "Nuovo link")),
      links.length
        ? h("div", { class: "group fade-in" }, links.map(linkCell))
        : emptyState("link", "Nessun link", "Creane uno da una campagna o con il +."),
      h("p", { class: "group-note", style: "margin-top:12px" },
        "I link del VIP possono stare senza campagna: servono a sapere da quale post arriva la conversione. " +
        "La conversione resta attribuita alla campagna con cui l'utente è entrato nel principale."));
  }

  async function pageNewLink() {
    const params = new URLSearchParams(location.hash.split("?")[1] || "");
    const presetCampaign = Number(params.get("campaign")) || null;
    const [{ channels }, t] = await Promise.all([api("/api/channels"), api("/api/campaigns")]);
    const campaignSel = h("select", {},
      h("option", { value: "" }, "Nessuna (link VIP)"),
      t.campaigns.map((c) => h("option", { value: c.id, selected: c.id === presetCampaign }, c.name)));
    const name = h("input", { type: "text", placeholder: "Post VIP 12 ottobre", maxlength: "32" });
    const lf = linkFields(channels);
    const btn = h("button", { class: "btn block", type: "submit", disabled: lf.empty }, "Salva link");

    const form = h("form", {
      onsubmit: (ev) => {
        ev.preventDefault();
        submitWith(btn, async () => {
          const r = await api("/api/links", { method: "POST", body: {
            ...lf.value(), campaign_id: campaignSel.value ? Number(campaignSel.value) : null, name: name.value.trim() || null } });
          haptic();
          toast(r.backfilled ? `Link salvato · ${r.backfilled} ingressi riattribuiti` : "Link salvato");
          history.replaceState(null, "", presetCampaign ? `#/campaign/${presetCampaign}` : "#/links");
          render();
        });
      },
    },
      h("div", { class: "group" },
        h("label", { class: "form-cell" }, h("span", {}, "Campagna"), campaignSel),
        h("label", { class: "form-cell" }, h("span", {}, "Nome"), name)),
      lf.empty ? noChannelsNotice() : lf.el,
      h("div", { style: "margin-top:20px" }, btn));
    return h("div", {}, header(null, "Nuovo link"), form);
  }

  async function pageChannels() {
    const { channels } = await api("/api/channels");
    const roles = [["main", "Principale"], ["vip", "VIP"], ["other", "Non usato"]];
    const roleColor = { main: "var(--blue)", vip: "var(--pink)", other: "var(--muted)" };

    const cards = channels.map((c) => {
      const seg = h("div", { class: "seg" }, roles.map(([k, v]) => h("button", {
        type: "button", class: k === c.role ? "on" : "",
        onclick: async () => {
          if (k === c.role) return;
          const msg = k === "main"
            ? "Impostare come canale principale? Le attribuzioni verranno ricalcolate."
            : "Cambiare il ruolo del canale? Le attribuzioni verranno ricalcolate.";
          if (!(await confirmBox(msg))) return;
          try {
            await api(`/api/channels/${c.id}`, { method: "PATCH", body: { role: k } });
            haptic();
            render();
          } catch (e) { toast(e.message); }
        },
      }, v)));

      return h("div", { class: "card fade-in" },
        h("div", { class: "row", style: "margin-bottom:12px" },
          h("div", { class: "avatar", style: `background:${roleColor[c.role]}` }, c.role === "vip" ? icon("crown", 18) : icon("send", 18)),
          h("div", { class: "grow" },
            h("div", { class: "title ellipsis", style: "font-weight:700" }, c.name),
            h("div", { class: "sub num" }, c.username ? `@${c.username} · ` : "", `id ${c.telegram_chat_id}`)),
          h("button", { class: "btn tinted icon", "aria-label": "Aggiorna da Telegram", onclick: async (ev) => {
            const b = ev.currentTarget;
            b.disabled = true;
            try { await api(`/api/channels/${c.id}/refresh`, { method: "POST" }); toast("Aggiornato"); render(); }
            catch (e) { toast(e.message); b.disabled = false; }
          } }, icon("refresh", 16))),
        h("div", { class: "row wrap", style: "gap:6px;margin-bottom:14px" },
          c.bot_is_admin ? h("span", { class: "pill green" }, icon("tick", 12, 3), "Bot admin") : h("span", { class: "pill red" }, "Bot non admin"),
          c.bot_is_admin && !c.can_invite_users ? h("span", { class: "pill red" }, "Manca “Invita utenti”") : null,
          h("span", { class: "pill num" }, `${fmt(c.tracked_members)} presenti`),
          h("span", { class: "pill num" }, `${fmt(c.tracked_joins)} ingressi`)),
        seg);
    });

    const steps = [
      "Nel canale: Amministratori → Aggiungi amministratore → cerca il bot.",
      "Attiva il permesso “Invita utenti tramite link”.",
      "Il canale compare qui da solo: scegli Principale o VIP.",
    ];
    return h("div", {},
      header("Analisi Ads", "Canali"),
      cards,
      h("h2", {}, "Collegare un canale"),
      h("div", { class: "group fade-in" }, steps.map((s, i) => h("div", { class: "cell" },
        h("div", { class: "avatar round", style: `background:${["var(--blue)", "var(--purple)", "var(--pink)"][i]}` }, String(i + 1)),
        h("div", { class: "grow", style: "font-size:15px" }, s)))),
      h("p", { class: "group-note" }, "Si tracciano solo gli ingressi avvenuti dopo che il bot è diventato admin."));
  }

  async function pageSettings() {
    const me = await getMe();
    if (!me.is_owner) return h("div", {}, header(null, "Impostazioni"), notice("Solo il proprietario può gestire gli utenti."));
    const { admins } = await api("/api/admins");

    const rows = admins.map((a) => {
      const name = [a.first_name, a.last_name].filter(Boolean).join(" ");
      const title = name || (a.username ? `@${a.username}` : `Utente ${a.telegram_user_id}`);
      return h("div", { class: "cell" },
        h("div", { class: "avatar round", style: `background:${a.is_owner ? "linear-gradient(135deg,var(--blue),var(--purple))" : `var(--c${(a.telegram_user_id % 8) + 1})`}` },
          a.is_owner ? icon("shield", 16) : initial(title)),
        h("div", { class: "grow" },
          h("div", { class: "row", style: "gap:6px" },
            h("span", { class: "title ellipsis" }, title),
            a.is_owner ? h("span", { class: "pill blue" }, "Proprietario") : null,
            a.label ? h("span", { class: "pill" }, a.label) : null),
          h("div", { class: "sub ellipsis num" },
            a.username && title !== `@${a.username}` ? `@${a.username} · ` : "",
            `id ${a.telegram_user_id} · `,
            a.last_seen_at ? `ultimo accesso ${fmtDate(a.last_seen_at)}` : "mai entrato")),
        a.is_owner ? null : h("button", { class: "btn destructive icon", "aria-label": "Rimuovi", onclick: async () => {
          if (!(await confirmBox(`Togliere l'accesso a ${title}? Lo perde subito.`))) return;
          try {
            await api(`/api/admins/${a.telegram_user_id}`, { method: "DELETE" });
            haptic();
            toast("Accesso rimosso");
            render();
          } catch (e) { toast(e.message); }
        } }, icon("close", 16, 2.6)));
    });

    const uid = h("input", { type: "text", inputmode: "numeric", pattern: "[0-9]*", placeholder: "es. 246776108", autocomplete: "off" });
    const label = h("input", { type: "text", placeholder: "Socio, Agenzia…", maxlength: "40" });
    const btn = h("button", { class: "btn block", type: "submit" }, icon("plus", 16, 2.6), "Aggiungi utente");
    const form = h("form", {
      onsubmit: (ev) => {
        ev.preventDefault();
        const v = uid.value.replace(/\D/g, "");
        if (!v) { toast("Inserisci lo user_id"); uid.focus(); return; }
        submitWith(btn, async () => {
          await api("/api/admins", { method: "POST", body: { telegram_user_id: v, label: label.value.trim() } });
          haptic();
          toast("Utente aggiunto");
          render();
        });
      },
    },
      h("div", { class: "group" },
        h("label", { class: "form-cell" }, h("span", {}, "User ID"), uid),
        h("label", { class: "form-cell" }, h("span", {}, "Etichetta"), label)),
      h("p", { class: "group-note" },
        "Lo user_id è un numero: la persona lo trova scrivendo a @userinfobot. Nome e @username compaiono qui la prima volta che apre l'app."),
      btn);

    return h("div", {},
      header("Analisi Ads", "Impostazioni"),
      h("h2", { style: "margin-top:4px" }, "Utenti autorizzati"),
      h("div", { class: "group fade-in" }, rows),
      h("p", { class: "group-note" }, "Possono vedere i dati e creare campagne e link. Solo il proprietario gestisce questa lista."),
      h("h2", {}, "Aggiungi"),
      form);
  }

  // ------------------------------------------------------------ guida

  // Testo con **grassetto**: spezza la stringa e mette i pezzi in <b> (sempre textContent, mai HTML).
  function rich(text) {
    return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? h("b", {}, part) : part));
  }

  const GUIDE = [
    { id: "bot-principale", color: "var(--blue)", icon: "send", title: "Metti il bot nel canale principale", steps: [
      "Apri su Telegram il tuo **canale principale** (quello dove arrivano le persone dalle campagne).",
      "Tocca il **nome del canale** in alto, poi **Amministratori**.",
      "Tocca **Aggiungi amministratore** e cerca **AnalisiAdsBot**.",
      "Spegni tutti i permessi e lascia acceso solo **Invita utenti tramite link** (su alcuni telefoni si chiama **Aggiungi iscritti**).",
      "Tocca **Salva** (o la spunta in alto).",
    ], note: "Il bot non può scrivere, cancellare o cambiare niente nel canale: serve solo a vedere chi entra e da quale link." },
    { id: "bot-vip", color: "var(--pink)", icon: "crown", title: "Fai lo stesso nel canale VIP", steps: [
      "Apri il **canale VIP** e ripeti gli stessi passaggi: **Amministratori → Aggiungi amministratore → AnalisiAdsBot**.",
      "Anche qui lascia acceso solo **Invita utenti tramite link** e salva.",
    ] },
    { id: "ruoli", color: "var(--purple)", icon: "users", title: "Dì alla dashboard qual è il principale e qual è il VIP", steps: [
      "Qui nella dashboard apri **Canali** (in basso).",
      "Trovi i due canali comparsi da soli. Se non ci sono, chiudi e riapri la dashboard dopo qualche secondo.",
      "Sul canale principale tocca **Principale**, sul canale VIP tocca **VIP**.",
    ] },
    { id: "campagna", color: "var(--orange)", icon: "megaphone", title: "Crea la prima campagna", steps: [
      "Apri **Campagne** e tocca il **+** in alto a destra.",
      "Scrivi un **nome** che ti faccia capire da dove arrivano le persone, ad esempio **Instagram Reel 01** o **TikTok Ottobre**. Gli altri campi sono facoltativi.",
      "Lascia scelto **Crea un link nuovo** e tocca **Crea campagna**.",
      "Nella pagina della campagna, sotto **Invite link**, tocca **Copia**.",
    ], note: "Ogni campagna ha il suo link. Più link diversi usi, più capisci cosa funziona: uno per la bio, uno per ogni reel, uno per ogni collaborazione." },
    { id: "usa-link", color: "var(--teal)", icon: "link", title: "Usa il link nei tuoi contenuti", steps: [
      "Incolla il link copiato dove vuoi: **bio**, **post**, **storia**, **descrizione di un video**, messaggio a un partner.",
      "Chi lo apre entra direttamente nel canale: **non deve fare niente di speciale** e non vede nessun bot.",
      "Da quel momento ogni ingresso compare nella campagna giusta.",
    ] },
    { id: "link-vip", color: "var(--pink)", icon: "crown", title: "Il link per entrare nel VIP", steps: [
      "Apri **Link** e tocca il **+**.",
      "Come campagna scegli **Nessuna**, come canale scegli il **canale VIP**, dagli un nome (ad esempio **Post VIP ottobre**) e salva.",
      "Copia il link e pubblicalo **nel canale principale**, nel messaggio che invita a entrare nel VIP.",
    ], note: "Quando qualcuno entra nel VIP, la dashboard ricorda da quale campagna era arrivato all'inizio: è così che vedi quale campagna porta più persone nel VIP." },
  ];

  const FAQ = [
    ["Come leggo la pagina Overview?",
     "L'**anello rosa** è la percentuale di persone entrate nel VIP sul totale arrivate dalle campagne. L'**anello blu** mostra quante sono ancora nel canale principale. Sotto trovi ogni campagna con la sua percentuale: più è alta, meglio funziona."],
    ["Cos'è la retention?",
     "Dice quante persone sono **rimaste nel canale** dopo 24 ore, 7, 30 e 90 giorni. Se una campagna porta tanta gente ma la retention è bassa, quelle persone escono presto."],
    ["Ho già dei link che uso da tempo, posso tenerli?",
     "Sì. Quando crei la campagna scegli **Importa un link esistente** e incollalo. Da quel momento gli ingressi con quel link vengono contati nella campagna."],
    ["Perché non vedo gli iscritti che c'erano già?",
     "Telegram non permette di sapere da dove sono arrivate le persone **prima** che il bot diventasse amministratore. Si conta da quando lo aggiungi in poi."],
    ["Cosa vuol dire «Organico / senza link»?",
     "Sono persone entrate **senza usare un link di campagna**: ad esempio cercando il canale per nome o con un link che non hai registrato."],
    ["Il bot scrive ai miei iscritti?",
     "**No.** Non manda messaggi a nessuno e gli iscritti non si accorgono di niente: lavora in silenzio."],
    ["Posso far vedere la dashboard a un collaboratore?",
     "Sì, ma lo decide il proprietario: deve aggiungerlo da **Impostazioni** (l'ingranaggio nella Overview) con il suo numero utente Telegram, che il collaboratore trova scrivendo a **@userinfobot**."],
    ["Non vedo le ultime novità",
     "Chiudi e riapri la dashboard. In fondo a ogni pagina c'è il numero di versione: se non cambia, chiudi del tutto Telegram e riaprilo."],
  ];

  async function pageGuide() {
    const [ov, { channels }] = await Promise.all([api("/api/overview"), api("/api/channels")]);
    const main = channels.find((c) => c.role === "main");
    const vip = channels.find((c) => c.role === "vip");
    const anyLink = ov.campaigns.some((c) => c.links.length);
    const checks = [
      ["Bot nel canale principale", channels.some((c) => c.bot_is_admin && c.can_invite_users), "bot-principale"],
      ["Bot nel canale VIP", (vip && vip.bot_is_admin) || channels.filter((c) => c.bot_is_admin).length >= 2, "bot-vip"],
      ["Principale e VIP scelti", !!(main && vip), "ruoli"],
      ["Prima campagna con il suo link", anyLink, "campagna"],
      ["Prima persona entrata da una campagna", ov.campaigns.some((c) => c.acquired > 0), "usa-link"],
    ];
    const done = checks.filter((c) => c[1]).length;

    const openSection = (id) => {
      const el = document.getElementById(`guida-${id}`);
      if (!el) return;
      el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      tapFeedback();
    };

    const progress = h("div", { class: "card fade-in" },
      h("div", { class: "row spread", style: "margin-bottom:10px" },
        h("div", { class: "title", style: "font-size:17px" }, done === checks.length ? "Tutto pronto 🎉" : "A che punto sei"),
        h("span", { class: `pill ${done === checks.length ? "green" : "blue"} num` }, `${done} di ${checks.length}`)),
      h("div", { class: "minibar", style: "width:100%;height:8px;margin:0 0 6px" },
        h("i", { "data-width": `${(100 * done) / checks.length}%`, style: "width:0;background:linear-gradient(90deg,var(--blue),var(--pink))" })),
      checks.map(([label, ok, id]) => h("div", { class: "row", style: "padding:9px 0" },
        h("span", { class: "check-dot", style: `background:${ok ? "var(--green)" : "var(--fill)"};color:${ok ? "#fff" : "var(--muted)"}` },
          ok ? icon("tick", 13, 3.2) : null),
        h("span", { class: "grow", style: ok ? "color:var(--muted)" : "font-weight:600" }, label),
        ok ? null : h("button", { class: "btn tinted small", type: "button", onclick: () => openSection(id) }, "Come fare"))));

    const sections = GUIDE.map((g, n) => h("details", { class: "guide-step fade-in", id: `guida-${g.id}` },
      h("summary", {},
        h("span", { class: "avatar", style: `background:${g.color}` }, icon(g.icon, 18)),
        h("span", { class: "grow" }, h("span", { class: "sub" }, `Passo ${n + 1}`), h("span", { class: "title", style: "display:block" }, g.title)),
        h("span", { class: "chev" }, icon("chevron", 16))),
      h("ol", {}, g.steps.map((st) => h("li", {}, rich(st)))),
      g.note ? h("p", { class: "guide-note" }, rich(g.note)) : null));

    const faq = FAQ.map(([q, a]) => h("details", { class: "guide-step faq" },
      h("summary", {}, h("span", { class: "grow title" }, q), h("span", { class: "chev" }, icon("chevron", 16))),
      h("p", {}, rich(a))));

    return h("div", {},
      header("Analisi Ads", "Guida"),
      h("p", { class: "fade-in", style: "margin:-8px 2px 18px;color:var(--text-2)" },
        "Con questa dashboard scopri ", h("b", {}, "da quale campagna"), " arrivano le persone nel tuo canale e ",
        h("b", {}, "quante poi entrano nel VIP"), ". Bastano pochi minuti per configurarla: segui i passi qui sotto."),
      progress,
      h("h2", {}, "Configurazione"),
      h("div", { class: "group fade-in" }, sections),
      h("h2", {}, "Domande frequenti"),
      h("div", { class: "group fade-in" }, faq));
  }

  // ------------------------------------------------------------ grafico ad area (2 serie, stessa scala)

  function lineChart(series) {
    // Larghezza reale del contenitore: così il testo dell'asse resta a 11px veri.
    const W = Math.max(280, Math.min(680, app.clientWidth - 32)), H = 210, P = { t: 12, r: 8, b: 26, l: 28 };
    const iw = W - P.l - P.r, ih = H - P.t - P.b;
    const max = Math.max(1, ...series.map((d) => Math.max(d.joins, d.vip)));
    const step = niceStep(max);
    const top = Math.ceil(max / step) * step;
    const x = (i) => P.l + (series.length < 2 ? iw / 2 : (i * iw) / (series.length - 1));
    const y = (v) => P.t + ih - (v / top) * ih;
    const id = ++gradId;

    const grid = [];
    for (let v = 0; v <= top; v += step) {
      grid.push(S("line", { class: "gridline", x1: P.l, x2: W - P.r, y1: y(v), y2: y(v) }));
      grid.push(S("text", { class: "axis", x: P.l - 8, y: y(v) + 4, "text-anchor": "end" }, fmt(v)));
    }
    const xlabels = series.map((d, i) => ((i % 7 === 0 && series.length - 1 - i >= 4) || i === series.length - 1)
      ? S("text", { class: "axis", x: x(i), y: H - 6, "text-anchor": i === 0 ? "start" : i === series.length - 1 ? "end" : "middle" },
        shortDate(d.date)) : null);
    const line = (key) => smoothPath(series.map((d, i) => [x(i), y(d[key])]));
    const area = (key) => `${line(key)}L${x(series.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
    const grad = (gid, color) => S("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 },
      S("stop", { offset: "0", "stop-color": color, "stop-opacity": .28 }), S("stop", { offset: "1", "stop-color": color, "stop-opacity": 0 }));

    const cross = S("line", { class: "crosshair", y1: P.t, y2: P.t + ih, visibility: "hidden" });
    const dots = ["--c-main", "--c-vip"].map((v) =>
      S("circle", { r: 5, fill: `var(${v})`, stroke: "var(--card)", "stroke-width": 2.5, visibility: "hidden" }));
    const hit = S("rect", { x: P.l, y: P.t, width: iw, height: ih, fill: "transparent", style: "cursor:crosshair" });

    const svg = S("svg", { viewBox: `0 0 ${W} ${H}`, role: "img",
      "aria-label": "Ingressi giornalieri nel canale principale e nel VIP, ultimi 30 giorni" },
      S("defs", {}, grad(`am${id}`, "var(--c-main)"), grad(`av${id}`, "var(--c-vip)")),
      grid, xlabels,
      S("path", { d: area("joins"), fill: `url(#am${id})` }),
      S("path", { d: area("vip"), fill: `url(#av${id})` }),
      S("path", { class: "series", d: line("joins"), stroke: "var(--c-main)" }),
      S("path", { class: "series", d: line("vip"), stroke: "var(--c-vip)" }),
      cross, dots, hit);

    const tip = h("div", { class: "tip" });
    const totJ = series.reduce((s, d) => s + d.joins, 0), totV = series.reduce((s, d) => s + d.vip, 0);
    const wrap = h("div", { class: "chart" },
      h("div", { class: "legend" },
        h("span", {}, h("i", { style: "background:var(--c-main)" }), `Principale · ${fmt(totJ)}`),
        h("span", {}, h("i", { style: "background:var(--c-vip)" }), `VIP · ${fmt(totV)}`)),
      svg, tip);

    function show(ev) {
      const rect = svg.getBoundingClientRect();
      const px = ((ev.clientX - rect.left) / rect.width) * W;
      const i = Math.max(0, Math.min(series.length - 1, Math.round(((px - P.l) / iw) * (series.length - 1))));
      const d = series[i];
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      [d.joins, d.vip].forEach((v, n) => {
        dots[n].setAttribute("cx", x(i)); dots[n].setAttribute("cy", y(v)); dots[n].setAttribute("visibility", "visible");
      });
      tip.replaceChildren(
        h("div", { class: "muted", style: "margin-bottom:3px" }, longDate(d.date)),
        h("div", {}, h("i", { style: "background:var(--c-main)" }), h("b", {}, fmt(d.joins)), " principale"),
        h("div", {}, h("i", { style: "background:var(--c-vip)" }), h("b", {}, fmt(d.vip)), " VIP"));
      tip.style.display = "block";
      const sx = (x(i) / W) * rect.width;
      const left = sx + 14 + tip.offsetWidth > rect.width ? sx - tip.offsetWidth - 14 : sx + 14;
      tip.style.left = `${left}px`;
      tip.style.top = `${svg.offsetTop + 6}px`;
    }
    function hide() {
      cross.setAttribute("visibility", "hidden");
      dots.forEach((d) => d.setAttribute("visibility", "hidden"));
      tip.style.display = "none";
    }
    hit.addEventListener("pointermove", show);
    hit.addEventListener("pointerdown", show);
    hit.addEventListener("pointerleave", hide);
    return wrap;
  }

  // Interpolazione monotona (Fritsch–Carlson): curva morbida che non scende sotto lo zero.
  function smoothPath(pts) {
    const n = pts.length;
    if (n < 2) return n ? `M${pts[0][0]},${pts[0][1]}` : "";
    const dx = [], m = [];
    for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
    const t = [m[0]];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    t[n - 1] = m[n - 2];
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n - 1; i++) {
      const h3 = dx[i] / 3;
      d += `C${(pts[i][0] + h3).toFixed(1)},${(pts[i][1] + t[i] * h3).toFixed(1)} ${(pts[i + 1][0] - h3).toFixed(1)},${(pts[i + 1][1] - t[i + 1] * h3).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
    }
    return d;
  }

  function niceStep(max) {
    const raw = max / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 5, 10]) if (raw <= m * mag) return Math.max(1, m * mag);
    return Math.max(1, 10 * mag);
  }
  const shortDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  const longDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  render();
})();
