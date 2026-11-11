/* wbig.gs — all the moving parts. No build step, no dependencies. */
(() => {
  "use strict";
  const S = window.SITE;
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  };

  const LANG = {
    JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", C: "#8a8a8a", Swift: "#F05138",
    CSS: "#663399", Rust: "#dea584", Java: "#b07219", Go: "#00ADD8", Svelte: "#ff3e00", PHP: "#4F5D95",
  };
  const fmtStars = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n));
  const ago = (iso) => {
    const d = (Date.now() - new Date(iso)) / 864e5;
    if (d < 1) return "today";
    if (d < 2) return "yesterday";
    if (d < 30) return `${Math.floor(d)}d ago`;
    if (d < 365) return `${Math.floor(d / 30)}mo ago`;
    return `${Math.floor(d / 365)}y ago`;
  };

  /* ───────── Render: marquee ───────── */
  const words = ["AI", "Commodore 64", "DSNP", "6502", "MLX", "Frequency", "PETSCII", "Verifiable Credentials",
    "SID chips", "Apple Silicon", "RASL", "did:web", "TeensyROM", "local LLMs", "breaking builds since 1985"];
  const half = words.map((w) => `<span>${esc(w)}</span><span>✦</span>`).join("");
  $("#marquee").innerHTML = half + half;

  /* ───────── Render: hero letters ───────── */
  // "wbig.gs" morphs into "Wes Biggs": w becomes W, "es " slides in, b becomes B, the dot bows out.
  (function nameMorph() {
    const h = $("#name");
    const ch = (c, i, extra = "") => `<span class="ch${extra}" style="--i:${i}">${c}</span>`;
    const flip = (lo, up, i) => `<span class="sw">${ch(lo, i)}${ch(up, i, " ch--up")}</span>`;
    h.innerHTML = `<span class="wobble" aria-hidden="true">${flip("w", "W", 0)}<span class="ins">${ch("e", 1)}${ch("s", 2)}<span class="gap"></span></span>` +
      `${flip("b", "B", 3)}${ch("i", 4)}${ch("g", 5)}<span class="dot">${ch(".", 6)}</span>${ch("g", 7)}${ch("s", 8)}</span>`;
    // Each flipping letter animates between its lowercase and uppercase widths
    const measure = () => $$(".sw", h).forEach((sw) => {
      const [lo, up] = sw.children;
      sw.style.setProperty("--wa", lo.offsetWidth + "px");
      sw.style.setProperty("--wb", up.offsetWidth + "px");
    });
    measure();
    document.fonts?.ready.then(measure);
    addEventListener("resize", measure);
    const set = (on) => h.classList.toggle("is-wes", on);
    if (finePointer) {
      h.addEventListener("pointerenter", () => set(true));
      h.addEventListener("pointerleave", () => set(false));
    } else {
      h.addEventListener("click", () => set(!h.classList.contains("is-wes")));
    }
  })();

  /* ───────── Render: worlds ───────── */
  const known = new Set();
  S.categories.forEach((c) => c.repos.forEach((r) => known.add(r.name.toLowerCase())));
  const skip = new Set(["wbig.gs", "wesbiggs", "wesbiggs.github.io"]);

  function card(r) {
    const url = `https://github.com/${S.github}/${r.name}`;
    const lang = r.lang ? `<span class="chip"><i style="--lc:${LANG[r.lang] || "#aaa"}"></i>${esc(r.lang)}</span>` : "";
    const tags = (r.tags || []).map((t) => `<span class="chip">#${esc(t)}</span>`).join("");
    const badge = r.crossover ? `<span class="badge">× ${esc(r.crossover)}</span>`
      : r.frozen ? `<span class="badge badge--frozen">❄ frozen</span>` : "";
    const up = r.upstream ? `<p class="upstream">⑂ from ${esc(r.upstream)}</p>` : "";
    const img = r.image ? `<div class="card__img"><img src="${esc(r.image)}" alt="Social preview for ${esc(r.name)}" loading="lazy" decoding="async"></div>` : "";
    return `<a class="card reveal${r.image ? " card--img" : ""}" href="${url}" data-repo="${esc(r.name.toLowerCase())}">
      ${badge}${img}
      <div class="card__top"><h3 class="card__name">${esc(r.name)}</h3><span class="card__stars" data-stars>${r.stars ? "★ " + fmtStars(r.stars) : ""}</span></div>
      ${up}
      <p class="card__desc">${esc(r.desc)}</p>
      <div class="card__meta">${lang}${tags}<span class="card__updated" data-updated></span></div>
    </a>`;
  }

  function world(c) {
    const cards = `<div class="cards">${c.repos.map(card).join("")}</div>`;
    const head = (eyebrow) => `<div class="world__head reveal">
        <p class="world__eyebrow">${eyebrow}</p>
        <h2 id="${c.id}-h" class="section-title"><span>${esc(c.portal)}</span> ${esc(c.title)}</h2>
        <p class="section-sub">${esc(c.blurb)}</p>
      </div>`;
    if (c.id === "c64") {
      return `<section class="world world--c64" id="${c.id}" aria-labelledby="${c.id}-h"><div class="c64-screen">
        <div class="raster-strip" aria-hidden="true"></div>
        ${head('LOAD "*",8,1')}
        ${cards}
        <p class="c64-ready" aria-hidden="true">READY.<br><span class="cur"></span></p>
      </div></section>`;
    }
    const eyebrow = { ai: "&gt; ollama run curiosity", dweb: "did:web:wbig.gs", fresh: "just pushed" }[c.id] || "";
    const bg = c.id === "ai" ? `<div class="blobs" aria-hidden="true"><b></b><b></b><b></b></div>`
      : c.id === "dweb" ? `<canvas class="world__bg" data-net aria-hidden="true"></canvas>` : "";
    return `<section class="world world--${c.id}" id="${c.id}" aria-labelledby="${c.id}-h">${bg}${head(eyebrow)}${cards}</section>`;
  }

  function portal(id, label, title, count) {
    return `<a class="portal portal--${id} reveal" href="#${id}"><span class="portal__count">${count}</span>
      <span class="portal__label">${esc(label)}</span><span class="portal__title">${esc(title)}</span></a>`;
  }

  const contribCount = S.contributions.reduce((n, g) => n + g.items.length, 0);
  function renderWorlds() {
    $("#worlds").innerHTML = S.categories.map(world).join("");
    $("#portalGrid").innerHTML =
      S.categories.map((c) => portal(c.id, c.portal, c.title, c.repos.length)).join("") +
      portal("contrib", "Elsewhere", "Open source contributions", contribCount);
  }
  renderWorlds();

  /* ───────── Render: contributions ───────── */
  const STICKER = { teal: ["#5eead4", "#a3e635", "#7dd3fc", "#bef264"], violet: ["#d8b4fe", "#f9a8d4", "#c4b5fd"], blue: ["#a5b4fc", "#7dd3fc"], orange: ["#fdba74", "#fde047"] };
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  $("#contribGroups").innerHTML = S.contributions.map((g) => {
    const pal = STICKER[g.color] || STICKER.teal;
    const items = g.items.map((it, i) => {
      const [owner, name] = it.repo.split("/");
      const stars = S.stars?.[it.repo] ?? 0;
      const size = Math.min(1, Math.log10(stars + 1) / 4.5).toFixed(2);
      const rot = ((rand() - 0.5) * 8).toFixed(1);
      return `<a class="sticker" href="https://github.com/${esc(it.repo)}" style="--bg:${pal[i % pal.length]};--rot:${rot}deg;--size:${size}">
        <span class="sticker__owner">${esc(owner)}/</span>
        <span class="sticker__name">${esc(name)}</span>
        ${it.note ? `<span class="sticker__note">${esc(it.note)}</span>` : ""}
        <span class="sticker__meta">${it.role ? `<span class="sticker__role">${esc(it.role)}</span>` : ""}${stars ? `★ ${fmtStars(stars)}` : ""}</span>
      </a>`;
    }).join("");
    return `<div class="contrib__group reveal"><h3>${esc(g.group)}</h3><div class="stickers">${items}</div></div>`;
  }).join("");
  $("#vintage").innerHTML = S.vintage.map((v) => `<li><b>${esc(v.name)}</b><em>${esc(v.role)}</em> ${esc(v.note)}</li>`).join("");

  /* ───────── Render: personal CHANGELOG (storage media through the ages) ───────── */
  const ART = {
    floppy525: `<span class="f525__hub"></span><span class="f525__index"></span><span class="f525__slot"></span>`,
    floppy35: `<span class="f35__shutter"><i></i></span>`,
    hdd: `<span class="hdd__platter"><i></i></span><span class="hdd__arm"></span>
      <span class="hdd__screw" style="top:8px;left:8px"></span><span class="hdd__screw" style="top:8px;right:8px"></span>`,
    cloud: `<svg viewBox="0 0 200 110" aria-hidden="true"><g class="cloud__puff">
        <path d="M52 92h104a26 26 0 0 0 2-52 38 38 0 0 0-72-10 28 28 0 0 0-36 26 13 13 0 0 0 2 36z"/></g>
        <g class="cloud__bits"><text x="64" y="74">0</text><text x="90" y="64">1</text><text x="116" y="78">1</text><text x="138" y="66">0</text></g></svg>`,
    chain: `<svg viewBox="0 0 200 110" aria-hidden="true">${[0, 1, 2].map((i) => `
        <g class="chain__block" style="--d:${i * 0.4}s"><rect x="${12 + i * 64}" y="34" width="48" height="42" rx="6"/>
        <text x="${36 + i * 64}" y="61">#${i + 1}</text></g>${i < 2 ? `<line x1="${60 + i * 64}" y1="55" x2="${76 + i * 64}" y2="55"/>` : ""}`).join("")}</svg>`,
    neural: (() => {
      const layers = [[30, 75], [20, 55, 90], [30, 75], [52]].map((ys, l) => ys.map((y) => [24 + l * 50, y + 5]));
      let lines = "", dots = "", k = 0;
      for (let l = 0; l < layers.length - 1; l++)
        for (const a of layers[l]) for (const b of layers[l + 1])
          lines += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" style="--d:${(k++ % 7) * 0.25}s"/>`;
      layers.flat().forEach(([x, y], i) => (dots += `<circle cx="${x}" cy="${y}" r="7" style="--d:${(i % 5) * 0.3}s"/>`));
      return `<svg viewBox="0 0 200 110" aria-hidden="true"><g class="nn__lines">${lines}</g><g class="nn__dots">${dots}</g></svg>`;
    })(),
  };
  const MEDIA_NAME = { floppy525: '5¼" floppy', floppy35: '3½" floppy', hdd: "hard drive", cloud: "the cloud", chain: "a blockchain", neural: "a neural net" };
  $("#changelogRow").innerHTML = S.changelog.map((s, i) => `
    <li class="media media--${s.media}" style="--label:${s.color}">
      <div class="media__art">${ART[s.media] || ""}</div>
      <div class="media__label">
        <div class="media__year"><span>## [${esc(s.year)}]</span><small>${MEDIA_NAME[s.media] || ""}</small></div>
        <p class="media__text"><b>${s.link ? `<a href="${esc(s.link)}">${esc(s.label)}</a>` : esc(s.label)}</b> · ${esc(s.text)}</p>
      </div>
    </li>`).join("");
  $("#yr").textContent = new Date().getFullYear();

  /* ───────── Live GitHub data ───────── */
  async function liveRepos() {
    const KEY = "wbig.repos.v1";
    let data;
    const cached = store.get(KEY);
    if (cached) {
      const { t, d } = JSON.parse(cached);
      if (Date.now() - t < 30 * 60e3) data = d;
    }
    if (!data) {
      const res = await fetch(`https://api.github.com/users/${S.github}/repos?per_page=100&type=owner&sort=pushed`);
      if (!res.ok) return;
      data = (await res.json()).map((r) => ({
        name: r.name, desc: r.description, lang: r.language, stars: r.stargazers_count,
        pushed: r.pushed_at, fork: r.fork, archived: r.archived, topics: r.topics,
      }));
      store.set(KEY, JSON.stringify({ t: Date.now(), d: data }));
    }
    // New repos I haven't sorted into a category yet
    const fresh = data.filter((r) => !r.fork && !r.archived && !known.has(r.name.toLowerCase()) && !skip.has(r.name.toLowerCase()));
    if (fresh.length) {
      S.categories.push({
        id: "fresh", portal: "Fresh from the lab", title: "Not yet filed",
        blurb: "Brand-new repos that haven't been sorted into a world yet. Handle with curiosity.",
        repos: fresh.map((r) => ({ name: r.name, desc: r.desc || "No description yet. Mysterious!", lang: r.lang || "", stars: r.stars, tags: (r.topics || []).slice(0, 3) })),
      });
      renderWorlds();
      wire();
    }
    for (const r of data) {
      const el = $(`.card[data-repo="${CSS.escape(r.name.toLowerCase())}"]`);
      if (!el) continue;
      if (r.stars) $("[data-stars]", el).textContent = "★ " + fmtStars(r.stars);
      $("[data-updated]", el).textContent = "pushed " + ago(r.pushed);
    }
  }

  /* ───────── Boot sequence: a C64 you can actually type into ───────── */
  const bootEl = $("#boot");
  const bootInput = $("#bootInput");
  const bootHint = $("#bootHint");
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let booting = false;
  let machine = null;
  let bootAbort = null;
  const howTo = (n) => `Type <kbd>LOAD"WES",8,1</kbd> then <kbd>RUN</kbd>` + (n ? ` · or wait ${n}s and I'll type it` : "");
  const setHint = (h) => { bootHint.innerHTML = h || howTo(); };

  function endBoot() {
    if (!booting) return;
    booting = false;
    bootAbort?.abort();
    machine?.destroy();
    machine = null;
    bootInput.blur();
    bootEl.classList.add("is-off");
    document.body.classList.remove("booting");
    setTimeout(() => { bootEl.classList.add("is-gone"); bootEl.classList.remove("is-off"); }, 950);
    store.set("wbig.booted", "1");
  }

  function boot() {
    if (booting) return;
    booting = true;
    bootAbort = new AbortController();
    const { signal } = bootAbort;
    bootEl.classList.remove("is-gone", "is-off");
    document.body.classList.add("booting");
    try { history.scrollRestoration = "manual"; } catch {}
    scrollTo({ top: 0, behavior: "instant" });
    machine = window.C64.create({
      screen: $("#bootText"), crt: $(".crt", bootEl), input: bootInput, form: $("#bootForm"),
      onLaunch: () => setTimeout(endBoot, 350),
      onHint: setHint,
    });
    bootInput.focus({ preventScroll: true });

    // Nobody typing? After 10 seconds, type the classic incantation for them.
    let userTyped = false, left = 10;
    setHint(howTo(left));
    const countdown = setInterval(() => {
      if (userTyped || !booting) return clearInterval(countdown);
      if (--left > 0) return setHint(howTo(left));
      clearInterval(countdown);
      autopilot();
    }, 1000);
    signal.addEventListener("abort", () => clearInterval(countdown));
    bootInput.addEventListener("input", () => {
      if (!userTyped) { userTyped = true; setHint(null); }
    }, { signal });
    // Typing while focus wandered off (e.g. after clicking Skip's neighbor) still lands on the screen
    addEventListener("keydown", (e) => {
      if (document.activeElement !== bootInput && e.key.length === 1 && !e.metaKey && !e.ctrlKey) bootInput.focus({ preventScroll: true });
    }, { signal });

    async function autopilot() {
      setHint("Typing it for you… (feel free to take over)");
      const typeOut = async (text) => {
        for (const ch of text) {
          if (userTyped || !booting) return false;
          machine.type(ch);
          await wait(60 + Math.random() * 70);
        }
        await wait(250);
        if (userTyped || !booting) return false;
        machine.submit();
        return true;
      };
      if (!(await typeOut('LOAD"WES",8,1'))) return;
      while (booting && machine?.busy()) await wait(80);
      await wait(350);
      await typeOut("RUN");
    }
  }

  $("#bootSkip").addEventListener("click", endBoot);

  if (reduced || store.get("wbig.booted")) {
    bootEl.classList.add("is-gone");
    document.body.classList.remove("booting");
  } else {
    boot();
  }
  $("#reboot").addEventListener("click", (e) => { e.stopPropagation(); scrollTo({ top: 0 }); setTimeout(boot, 50); });

  /* ───────── Role rotator ───────── */
  const roles = ["break builds", "build startups", "write protocols", "patch 6502 KERNALs", "run LLMs on my desk",
    "put coupons in your wallet", "make specs readable", "teach a C64 to chat", "fork things and fix them"];
  const roleEl = $("#role");
  if (!reduced) {
    let ri = 0;
    const cycle = async () => {
      ri = (ri + 1) % roles.length;
      let t = roleEl.textContent;
      while (t.length) { t = t.slice(0, -1); roleEl.textContent = t; await new Promise((r) => setTimeout(r, 28)); }
      for (const ch of roles[ri]) { t += ch; roleEl.textContent = t; await new Promise((r) => setTimeout(r, 55)); }
      setTimeout(cycle, 1900);
    };
    setTimeout(cycle, 2600);
  }

  /* ───────── Portrait: dither the photo into C64 multicolor, "load" the hi-res on demand ───────── */
  (function portrait() {
    const fig = $("#portrait");
    if (!fig) return;
    const btn = $(".portrait__disc", fig), img = $("img", fig), cv = $(".portrait__pixels", fig);
    // The 16 colors of the VIC-II (Pepto's palette)
    const PAL = ["000000", "ffffff", "68372b", "70a4b2", "6f3d86", "588d43", "352879", "b8c76f",
      "6f4f25", "433900", "9a6759", "444444", "6c6c6c", "9ad284", "6c5eb5", "959595"]
      .map((h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)));
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    function pixelate() {
      // Multicolor mode: pixels twice as wide as they are tall, like the real thing
      const W = 64, H = 128;
      cv.width = W; cv.height = H;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      // same framing as the CSS on the <img>: scale(1.3) translateY(4%)
      const n = img.naturalWidth, sw = n / 1.3, sx = (n - sw) / 2, sy = (n - sw) / 2 - n * 0.04 / 1.3;
      ctx.fillStyle = "#e9e9ee"; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, sx, sy, sw, sw, 0, 0, W, H);
      const im = ctx.getImageData(0, 0, W, H), d = im.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const t = (BAYER[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * 40;
        // punch up saturation and contrast so the 16 colors have something to grab, then dither
        const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
        const c = [0, 1, 2].map((k) => ((l + (d[i + k] - l) * 1.6) - 140) * 1.35 + 128 + t);
        let best = 0, bd = Infinity;
        PAL.forEach((p, j) => {
          const dr = c[0] - p[0], dg = c[1] - p[1], db = c[2] - p[2];
          const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
          if (dist < bd) { bd = dist; best = j; }
        });
        [d[i], d[i + 1], d[i + 2]] = PAL[best]; d[i + 3] = 255;
      }
      ctx.putImageData(im, 0, 0);
    }
    if (img.complete && img.naturalWidth) pixelate(); else img.addEventListener("load", pixelate, { once: true });

    let timer;
    function set(hires) {
      clearTimeout(timer);
      btn.setAttribute("aria-pressed", String(hires));
      if (hires) {
        fig.classList.add("is-loading", "is-hires");
        timer = setTimeout(() => fig.classList.remove("is-loading"), reduced ? 0 : 1100);
      } else {
        fig.classList.remove("is-loading", "is-hires");
      }
    }
    if (finePointer) {
      btn.addEventListener("pointerenter", () => set(true));
      btn.addEventListener("pointerleave", () => set(false));
    }
    btn.addEventListener("click", () => { if (!finePointer) set(!fig.classList.contains("is-hires")); });
    btn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); set(!fig.classList.contains("is-hires")); } });
  })();

  /* ───────── Canvas helpers ───────── */
  function fitCanvas(cv) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const { width, height } = cv.getBoundingClientRect();
    cv.width = Math.max(1, width * dpr); cv.height = Math.max(1, height * dpr);
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: width, h: height };
  }
  function whenVisible(el, onChange) {
    new IntersectionObserver(([e]) => onChange(e.isIntersecting)).observe(el);
  }

  /* Raster bars, demoscene-style */
  (function raster() {
    const cv = $("#raster");
    let { ctx, w, h } = fitCanvas(cv);
    const ramps = [
      ["#000", "#880000", "#ff7777", "#fff", "#ff7777", "#880000", "#000"],
      ["#000", "#664400", "#dd8855", "#eeee77", "#dd8855", "#664400", "#000"],
      ["#000", "#00aa55", "#aaff66", "#fff", "#aaff66", "#00aa55", "#000"],
      ["#000", "#3e31a2", "#7c70da", "#aaffee", "#7c70da", "#3e31a2", "#000"],
      ["#000", "#8b2c8b", "#cc44cc", "#ffaaff", "#cc44cc", "#8b2c8b", "#000"],
      ["#000", "#005588", "#0088ff", "#aaffee", "#0088ff", "#005588", "#000"],
    ];
    let mx = 0.5, run = true, t0 = performance.now();
    addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth; }, { passive: true });
    addEventListener("resize", () => ({ ctx, w, h } = fitCanvas(cv)));
    function draw(now) {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const bh = Math.max(26, h / 22);
      ramps.forEach((ramp, i) => {
        const y = h * 0.5 + Math.sin(t * 1.1 + i * 0.55 + mx * 2) * h * 0.36 - bh / 2;
        const g = ctx.createLinearGradient(0, y, 0, y + bh);
        ramp.forEach((c, j) => g.addColorStop(j / (ramp.length - 1), c));
        ctx.fillStyle = g;
        ctx.fillRect(0, y, w, bh);
      });
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(12,10,29,.35)";
      for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
      if (run && !reduced) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
    whenVisible(cv, (v) => { const was = run; run = v; if (v && !was) requestAnimationFrame(draw); });
  })();

  /* A little network that nobody owns */
  function nets() {
    $$("[data-net]").forEach((cv) => {
      if (cv.dataset.live) return;
      cv.dataset.live = 1;
      let { ctx, w, h } = fitCanvas(cv);
      const N = Math.min(70, Math.floor((w * h) / 16000));
      const nodes = Array.from({ length: N }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: 1.5 + Math.random() * 2.5 }));
      let px = -999, py = -999, run = false;
      cv.parentElement.addEventListener("pointermove", (e) => { const b = cv.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top; });
      cv.parentElement.addEventListener("pointerleave", () => { px = py = -999; });
      addEventListener("resize", () => ({ ctx, w, h } = fitCanvas(cv)));
      function draw() {
        ctx.clearRect(0, 0, w, h);
        for (const n of nodes) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
        }
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
          const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 150) { ctx.strokeStyle = `rgba(45,212,191,${(1 - d / 150) * .35})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        for (const n of nodes) {
          const d = Math.hypot(n.x - px, n.y - py);
          if (d < 180) { ctx.strokeStyle = `rgba(163,230,53,${(1 - d / 180) * .8})`; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(px, py); ctx.stroke(); }
          ctx.fillStyle = d < 180 ? "#a3e635" : "#2dd4bf";
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 7); ctx.fill();
        }
        if (run && !reduced) requestAnimationFrame(draw);
      }
      draw();
      whenVisible(cv, (v) => { const was = run; run = v; if (v && !was) requestAnimationFrame(draw); });
    });
  }

  /* ───────── Card tilt + spotlight, scroll reveals ───────── */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });

  function wire() {
    $$(".reveal:not(.is-in)").forEach((el, i) => { el.style.transitionDelay = `${(i % 6) * 60}ms`; io.observe(el); });
    nets();
    if (!finePointer || reduced) return;
    $$(".card").forEach((c) => {
      if (c.dataset.tilt) return;
      c.dataset.tilt = 1;
      c.addEventListener("pointermove", (e) => {
        const b = c.getBoundingClientRect();
        const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
        c.style.setProperty("--mx", `${x * 100}%`); c.style.setProperty("--my", `${y * 100}%`);
        c.style.transform = `rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg) translateZ(0)`;
      });
      c.addEventListener("pointerleave", () => { c.style.transform = ""; });
    });
  }
  wire();
  liveRepos().catch(() => {});

  /* ───────── Contact: copy button + St. Louis local time ───────── */
  $("#copyMail").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText("contact@wbig.gs"); b.textContent = "copied ✓"; }
    catch { b.textContent = "select & copy"; }
    setTimeout(() => (b.textContent = "copy"), 2000);
  });
  const stl = $("#stlTime");
  const tick = () => {
    try {
      stl.textContent = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }).format(new Date()) + " here right now";
    } catch {}
  };
  tick(); setInterval(tick, 30e3);

  /* ───────── Chiptune jingle (Web Audio square waves) ───────── */
  let actx;
  function jingle() {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const now = actx.currentTime + 0.05;
    const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1568]; // C major arpeggio, up we go
    const bass = [131, 131, 165, 196];
    const v = actx.createGain(); v.gain.value = 0.08; v.connect(actx.destination);
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = "square"; o.frequency.value = f;
      g.gain.setValueAtTime(1, now + i * 0.11); g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.11 + 0.1);
      o.connect(g).connect(v); o.start(now + i * 0.11); o.stop(now + i * 0.11 + 0.11);
    });
    bass.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(1.6, now + i * 0.22); g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.22 + 0.2);
      o.connect(g).connect(v); o.start(now + i * 0.22); o.stop(now + i * 0.22 + 0.22);
    });
  }
  $("#jingle").addEventListener("click", jingle);

  /* ───────── Konami code → 64 mode ───────── */
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  addEventListener("keydown", (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === code[pos] ? pos + 1 : k === code[0] ? 1 : 0;
    if (pos === code.length) {
      pos = 0;
      const on = document.body.classList.toggle("c64-mode");
      toast(on ? "64 mode on. Welcome home." : "64 mode off.");
      try { jingle(); } catch {}
    }
  });
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.append(t); setTimeout(() => t.remove(), 3200);
  }
})();
