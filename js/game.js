(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const main = $("#main");
  const fx = $("#fx");
  const live = $("#live");

  const CN = ["", "一", "二", "三", "四", "五"];
  const CHEERS = ["好棒！", "哇！", "真厉害！", "太棒啦！"];
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
  const CONFETTI = ["#FF5C5C", "#FF8A3D", "#FFD23F", "#3CB86A", "#3D8BFF", "#8B6CFF", "#FF6B9D"];
  const BUBBLE_COLORS = [
    { name: "红色", hex: "#FF5C5C" },
    { name: "橙色", hex: "#FF8A3D" },
    { name: "黄色", hex: "#FFD23F" },
    { name: "绿色", hex: "#3CB86A" },
    { name: "蓝色", hex: "#3D8BFF" },
    { name: "紫色", hex: "#8B6CFF" },
    { name: "粉色", hex: "#FF6B9D" },
  ];
  const PAINTS = [
    { name: "红色", hex: "#FF5C5C" },
    { name: "橙色", hex: "#FF8A3D" },
    { name: "黄色", hex: "#FFD23F" },
    { name: "绿色", hex: "#3CB86A" },
    { name: "蓝色", hex: "#3D8BFF" },
    { name: "紫色", hex: "#8B6CFF" },
    { name: "粉色", hex: "#FF6B9D" },
    { name: "棕色", hex: "#B57A45" },
  ];

  const DAY = {
    sky: "#B7E4FF", sun: "#FFD23F", cloud1: "#FFFFFF", cloud2: "#FFFFFF",
    hill: "#8ED47C", trunk: "#C4844A", canopy: "#3EAE58", apple: "#FF5C5C",
    wall: "#FFE3B3", roof: "#F07167", chimney: "#E08A5A", door: "#D9894B",
    window: "#8FD0FF", stem: "#3EAE58", bloom: "#FF6B9D", heart: "#FFD23F", bird: "#5B7CFF",
  };
  const SUNSET = {
    sky: "#FFB085", sun: "#FF6B3D", cloud1: "#FFE0D0", cloud2: "#FFD0E2",
    hill: "#7BC56A", trunk: "#C4844A", canopy: "#3EA85A", apple: "#FF5C5C",
    wall: "#FFD0C4", roof: "#E25B4A", chimney: "#D17A52", door: "#C9844A",
    window: "#FFE7A0", stem: "#3EA85A", bloom: "#FF5C8A", heart: "#FFD23F", bird: "#7A63F0",
  };
  const NIGHT = {
    sky: "#24356B", sun: "#F6F1C6", cloud1: "#C9D4F2", cloud2: "#A9B7E0",
    hill: "#1F6B45", trunk: "#8A5A32", canopy: "#1B7342", apple: "#E85D4C",
    wall: "#F0D2A8", roof: "#7E3B4E", chimney: "#6E4A38", door: "#6B3E22",
    window: "#FFE08A", stem: "#1B7342", bloom: "#FF8FB8", heart: "#FFE08A", bird: "#D7DFF8",
  };
  const THEMES = [
    { speech: "晚霞", colors: SUNSET },
    { speech: "晚上啦", colors: NIGHT },
    { speech: "白天啦", colors: DAY },
  ];

  const ANIMALS = [
    { id: "cat", name: "小猫", say: "喵" },
    { id: "dog", name: "小狗", say: "汪" },
    { id: "rabbit", name: "小兔", say: "蹦蹦" },
    { id: "duck", name: "小鸭", say: "嘎" },
    { id: "pig", name: "小猪", say: "哼" },
    { id: "panda", name: "熊猫", say: "" },
    { id: "frog", name: "青蛙", say: "呱" },
    { id: "fox", name: "狐狸", say: "嘿嘿" },
  ];

  const COUNT_ITEMS = [
    { id: "duck", name: "小鸭", mw: "只" },
    { id: "apple", name: "苹果", mw: "个" },
    { id: "star", name: "星星", mw: "颗" },
    { id: "fish", name: "小鱼", mw: "条" },
    { id: "balloon", name: "气球", mw: "个" },
  ];

  const state = {
    screen: "",
    stars: loadInt("doudou-stars", 0),
    sound: loadSound(),
  };

  let token = 0;
  let leave = [];
  let noteI = 0;
  let lastSpeak = 0;
  let speakTimer = 0;

  const sfx = {
    ctx: null,
    master: null,
    unlock() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    tone(freq, dur = 0.15, type = "sine", gain = 0.08, delay = 0, slideTo = null) {
      if (!state.sound || !this.ctx) return;
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    },
    tap() { this.tone(520, 0.06, "triangle", 0.05); },
    pop() {
      this.tone(700, 0.12, "sine", 0.07, 0, 180);
      this.tone(340, 0.07, "triangle", 0.04);
    },
    note(freq) { this.tone(freq, 0.18, "sine", 0.06); },
    ok() {
      [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, "sine", 0.055, i * 0.08));
    },
    again() { this.tone(392, 0.12, "sine", 0.04); },
    magic() {
      [523, 659, 784, 988, 1175].forEach((f, i) => this.tone(f, 0.16, "triangle", 0.045, i * 0.06));
    },
    blip() { this.tone(760, 0.09, "sine", 0.055); },
  };

  function loadInt(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (v == null) return fallback;
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n >= 0 ? n : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function loadSound() {
    try {
      return localStorage.getItem("doudou-sound") !== "0";
    } catch (e) {
      return true;
    }
  }

  function save(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) { /* private mode */ }
  }

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function speak(text, force = false) {
    if (!state.sound || !text || !window.speechSynthesis) return;
    const now = performance.now();
    if (!force && now - lastSpeak < 700) return;
    lastSpeak = now;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.86;
    u.pitch = 1.12;
    const voices = speechSynthesis.getVoices();
    const voice = voices.find((v) => /zh[-_]CN/i.test(v.lang)) || voices.find((v) => /^zh/i.test(v.lang));
    if (voice) u.voice = voice;
    window.clearTimeout(speakTimer);
    speechSynthesis.cancel();
    speakTimer = window.setTimeout(() => {
      if (state.sound) speechSynthesis.speak(u);
    }, 50);
  }

  function announce(text) { live.textContent = text; }

  function starSVG() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2 15,9 22,9.2 16.6,14 18.5,21 12,17.2 5.5,21 7.4,14 2,9.2 9,9" fill="#FFB703"/></svg>`;
  }

  function addStars(n) {
    state.stars += n;
    save("doudou-stars", state.stars);
    const shown = state.stars > 999 ? "999+" : String(state.stars);
    $("#star-count").textContent = shown;
    $("#star-pill").setAttribute("aria-label", `星星 ${shown}`);
    const pill = $("#star-pill");
    pill.classList.remove("bump");
    void pill.offsetWidth;
    pill.classList.add("bump");
  }

  function earn(n, x, y) {
    addStars(n);
    if (x == null || reducedMotion()) return;
    const star = document.createElement("div");
    star.className = "fly-star";
    star.textContent = "⭐";
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    document.body.appendChild(star);
    const pill = $("#star-pill").getBoundingClientRect();
    const dx = pill.left + pill.width / 2 - x;
    const dy = pill.top + pill.height / 2 - y;
    const anim = star.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.35)`, opacity: 0.2 },
      ],
      { duration: 550, easing: "cubic-bezier(.2,.7,.2,1)", fill: "forwards" }
    );
    anim.onfinish = () => star.remove();
  }

  function burst(x, y, n = 14) {
    if (reducedMotion()) return;
    for (let i = 0; i < n; i++) {
      const bit = document.createElement("i");
      bit.className = "bit";
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const dist = 36 + Math.random() * 80;
      bit.style.left = `${x}px`;
      bit.style.top = `${y}px`;
      bit.style.background = CONFETTI[i % CONFETTI.length];
      bit.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
      bit.style.setProperty("--dy", `${Math.sin(ang) * dist - 20}px`);
      bit.style.setProperty("--rot", `${Math.random() * 180}deg`);
      const size = 7 + Math.random() * 7;
      bit.style.width = `${size}px`;
      bit.style.height = `${size}px`;
      bit.style.borderRadius = Math.random() > 0.5 ? "50%" : "3px";
      fx.appendChild(bit);
      window.setTimeout(() => bit.remove(), 800);
    }
  }

  function floatText(x, y, text) {
    const node = document.createElement("div");
    node.className = "float-text";
    node.textContent = text;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    fx.appendChild(node);
    window.setTimeout(() => node.remove(), 850);
  }

  function cheer(text) {
    const old = fx.querySelector(".cheer");
    if (old) old.remove();
    const node = document.createElement("div");
    node.className = "cheer";
    node.textContent = text;
    fx.appendChild(node);
    window.setTimeout(() => node.remove(), 1050);
    announce(text);
  }

  function centerOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
  }

  function buzz(ms) {
    try { navigator.vibrate?.(ms); } catch (e) { /* ignore */ }
  }

  function soundIcon(on) {
    if (on) {
      return `<svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 18h8l12-9v30L16 30H8z" fill="#4A3428"/>
        <path d="M34 16a12 12 0 0 1 0 16" fill="none" stroke="#4A3428" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M38.5 11a18 18 0 0 1 0 26" fill="none" stroke="#4A3428" stroke-width="3.5" stroke-linecap="round"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M8 18h8l12-9v30L16 30H8z" fill="#4A3428"/>
      <path d="M34 18l10 12M44 18L34 30" fill="none" stroke="#4A3428" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`;
  }

  function houseFace() {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M14 30 L8 12 L26 24Z" fill="#F27C38"/>
      <path d="M50 30 L56 12 L38 24Z" fill="#F27C38"/>
      <circle cx="32" cy="36" r="18" fill="#F27C38"/>
      <ellipse cx="32" cy="42" rx="10" ry="8" fill="#FFF3E4"/>
      <circle cx="25" cy="34" r="2.3" fill="#2B2420"/>
      <circle cx="39" cy="34" r="2.3" fill="#2B2420"/>
      <path d="M27 44 Q32 49 37 44" stroke="#2B2420" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  function handSVG() {
    return `<svg class="hand" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M30 8h10c2 0 4 2 4 5v24h4c4 0 8 4 8 9 0 8-7 14-18 14H24c-8 0-14-5-16-12L6 34c-1-3 1-6 4-6h6V18c0-3 2-5 5-5h3V13c0-3 2-5 6-5z" fill="#FFE3C4" stroke="#4A3428" stroke-width="3" stroke-linejoin="round"/>
    </svg>`;
  }

  function refreshSVG() {
    return `<svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M14 24a10 10 0 1 0 3-7" fill="none" stroke="#4A3428" stroke-width="4" stroke-linecap="round"/>
      <path d="M14 10v8h8" fill="none" stroke="#4A3428" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  function wandSVG() {
    return `<svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M10 38 L30 18" stroke="#4A3428" stroke-width="4" stroke-linecap="round"/>
      <path d="M30 10l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#FFD23F" stroke="#4A3428" stroke-width="2" stroke-linejoin="round"/>
    </svg>`;
  }

  function eraserSVG() {
    return `<svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M16 32l14-16a5 5 0 0 1 7 7L23 39H12l4-7z" fill="#FFB3C6" stroke="#4A3428" stroke-width="3" stroke-linejoin="round"/>
      <path d="M14 39h22" stroke="#4A3428" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  function updateSoundButton() {
    const btn = $("#btn-sound");
    btn.innerHTML = soundIcon(state.sound);
    btn.setAttribute("aria-pressed", state.sound ? "true" : "false");
    btn.setAttribute("aria-label", state.sound ? "声音开着" : "声音关着");
  }

  function toggleSound() {
    state.sound = !state.sound;
    save("doudou-sound", state.sound ? "1" : "0");
    updateSoundButton();
    if (!state.sound && window.speechSynthesis) speechSynthesis.cancel();
    else sfx.tap();
    announce(state.sound ? "声音开着" : "声音关着");
  }

  function renderChrome() {
    const left = $("#header-left");
    const center = $("#header-center");
    if (state.screen === "home") {
      left.innerHTML = "";
      center.innerHTML = "";
      return;
    }
    const titles = { bubbles: "吹泡泡", animals: "找动物", count: "数一数", paint: "涂颜色" };
    left.innerHTML = `<button type="button" class="icon-btn" id="btn-home" aria-label="回家">${houseFace()}</button>`;
    center.innerHTML = `<h2 class="screen-title">${titles[state.screen] || ""}</h2>`;
  }

  function go(screen) {
    if (screen === state.screen && screen === "home") return;
    leave.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
    leave = [];
    fx.replaceChildren();
    token += 1;
    state.screen = screen;
    document.body.dataset.screen = screen;
    renderChrome();
    const my = token;
    if (screen === "home") renderHome(my);
    else if (screen === "bubbles") renderBubbles(my);
    else if (screen === "animals") renderAnimals(my);
    else if (screen === "count") renderCount(my);
    else if (screen === "paint") renderPaint(my);
    main.focus({ preventScroll: true });
  }

  function onLeave(fn) { leave.push(fn); }

  function renderHome() {
    main.innerHTML = `
      <section class="home">
        <div class="home-intro">
          <button type="button" class="mascot" id="mascot" aria-label="豆豆">${mascotSVG()}</button>
          <div class="titles">
            <h1>豆豆乐园</h1>
            <p class="tagline">点一点，一起玩</p>
          </div>
        </div>
        <div class="play-grid">
          ${playCard("bubbles", "吹泡泡", bubbleArt())}
          ${playCard("animals", "找动物", animalArt())}
          ${playCard("count", "数一数", countArt())}
          ${playCard("paint", "涂颜色", paintArt())}
        </div>
        <p class="quiet">没有输赢，慢慢玩就好</p>
      </section>`;
    $("#mascot").addEventListener("click", () => {
      const node = $("#mascot");
      node.classList.remove("jump");
      void node.offsetWidth;
      node.classList.add("jump");
      sfx.pop();
      speak(pick(["嘿嘿，我是豆豆", "点一个游戏吧", "我们来玩吧"]), true);
    });
    main.querySelectorAll("[data-go]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sfx.tap();
        go(btn.dataset.go);
      });
    });
  }

  function playCard(id, label, art) {
    return `<button type="button" class="play-card card-${id}" data-go="${id}">
      <span class="card-art">${art}</span>
      <span class="card-label">${label}</span>
    </button>`;
  }

  function bubbleArt() {
    return `<span class="bubbles-art" aria-hidden="true">
      <i style="--c:#FF8A3D;--d:min(52cqh, 30cqw);left:8%;top:12%"></i>
      <i style="--c:#7EC8FF;--d:min(72cqh, 40cqw);left:28%;top:4%"></i>
      <i style="--c:#FF6B9D;--d:min(44cqh, 26cqw);left:60%;top:26%"></i>
    </span>`;
  }

  function animalArt() {
    return `<span class="row-art pair" aria-hidden="true">${animalSVG("cat")}${animalSVG("rabbit")}</span>`;
  }

  function countArt() {
    return `<span class="row-art trio" aria-hidden="true">${itemSVG("duck")}${itemSVG("duck")}${itemSVG("duck")}</span>`;
  }

  function paintArt() {
    return `<svg viewBox="0 0 120 80" aria-hidden="true">
      <circle cx="28" cy="40" r="16" fill="#FF5C5C"/>
      <circle cx="60" cy="28" r="16" fill="#FFD23F"/>
      <circle cx="92" cy="40" r="16" fill="#3D8BFF"/>
      <circle cx="60" cy="56" r="16" fill="#3CB86A"/>
    </svg>`;
  }

  function renderBubbles(my) {
    main.innerHTML = `
      <div class="playfield" id="field">
        <div class="pop-pill"><i class="mini-bubble"></i><b id="pop-total">0</b></div>
        ${handSVG()}
      </div>`;
    const field = $("#field");
    let pops = 0;
    const spawn = (initial) => {
      if (my !== token) return;
      if (field.querySelectorAll(".bubble").length >= 11) return;
      const star = !initial && Math.random() < 0.14;
      const color = star ? { name: "星星", hex: "#FFD23F" } : pick(BUBBLE_COLORS);
      const el = document.createElement("button");
      el.type = "button";
      el.className = "bubble";
      const size = 62 + Math.random() * 48;
      const dur = 9 + Math.random() * 5;
      el.style.setProperty("--s", `${size}px`);
      el.style.setProperty("--x", `${4 + Math.random() * 78}%`);
      el.style.setProperty("--d", `${dur}s`);
      el.style.setProperty("--c", color.hex);
      el.style.setProperty("--wobble", `${Math.random() * 36 - 18}px`);
      if (initial) el.style.setProperty("--delay", `${-Math.random() * dur * 0.72}s`);
      el.dataset.name = color.name;
      el.setAttribute("aria-label", color.name);
      if (star) {
        el.dataset.star = "1";
        el.innerHTML = starSVG();
      }
      el.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        popBubble(el);
      });
      el.addEventListener("animationend", (event) => {
        if (event.animationName === "rise") el.remove();
      });
      field.appendChild(el);
    };
    const popBubble = (el) => {
      if (my !== token || el.dataset.popped) return;
      el.dataset.popped = "1";
      const rect = el.getBoundingClientRect();
      const host = field.getBoundingClientRect();
      el.style.animation = "none";
      el.style.left = `${rect.left - host.left}px`;
      el.style.top = `${rect.top - host.top}px`;
      el.style.bottom = "auto";
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      void el.offsetWidth;
      el.classList.add("is-pop");
      const hand = field.querySelector(".hand");
      if (hand) hand.remove();
      const name = el.dataset.name;
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, el.dataset.star ? 20 : 12);
      floatText(rect.left + rect.width / 2, rect.top, name);
      sfx.pop();
      sfx.note(SCALE[noteI % SCALE.length]);
      noteI += 1;
      speak(name);
      buzz(10);
      pops += 1;
      $("#pop-total").textContent = String(pops);
      if (el.dataset.star === "1" || pops % 5 === 0) {
        earn(1, rect.left + rect.width / 2, rect.top);
      }
      window.setTimeout(() => el.remove(), 280);
    };
    for (let i = 0; i < 7; i++) spawn(true);
    const timer = window.setInterval(() => spawn(false), 850);
    onLeave(() => window.clearInterval(timer));
    window.setTimeout(() => speak("点破泡泡", true), 280);
  }

  function renderAnimals(my) {
    let round = 0;
    let locked = false;
    let wrongs = 0;
    let target = null;
    const timers = [];
    const later = (fn, ms) => {
      const id = window.setTimeout(() => {
        const idx = timers.indexOf(id);
        if (idx >= 0) timers.splice(idx, 1);
        if (my !== token) return;
        fn();
      }, ms);
      timers.push(id);
    };
    onLeave(() => timers.forEach((id) => window.clearTimeout(id)));

    const draw = () => {
      if (my !== token) return;
      locked = false;
      wrongs = 0;
      round += 1;
      target = round === 1 ? ANIMALS[0] : pick(ANIMALS);
      const extra = round > 3 ? 3 : 2;
      const options = shuffle([
        target,
        ...shuffle(ANIMALS.filter((a) => a.id !== target.id)).slice(0, extra),
      ]);
      main.innerHTML = `
        <section class="animal-screen">
          <div class="target-row">
            <p class="prompt">找一找</p>
            <div class="target-badge" id="target-animal" data-id="${target.id}">${animalSVG(target.id)}</div>
            <p class="target-name">${target.name}</p>
          </div>
          <div class="choices" data-n="${options.length}">
            ${options.map((a) => `<button type="button" class="choice" data-id="${a.id}" aria-label="${a.name}">
              ${animalSVG(a.id)}
              <span class="choice-name">${a.name}</span>
            </button>`).join("")}
          </div>
        </section>`;
      main.querySelectorAll(".choice").forEach((btn) => {
        btn.addEventListener("click", () => choose(btn));
      });
      later(() => speak(`找一找${target.name}`, true), 260);
    };

    const choose = (btn) => {
      if (locked || my !== token) return;
      const id = btn.dataset.id;
      if (id === target.id) {
        locked = true;
        main.querySelector(".choices").classList.add("is-locked");
        btn.classList.add("good");
        const spot = centerOf(btn);
        burst(spot.x, spot.y, 18);
        const line = pick(CHEERS);
        cheer(line);
        sfx.ok();
        const said = target.say ? `${target.name}，${target.say}` : target.name;
        speak(`${line}${said}`, true);
        earn(1, spot.x, spot.y);
        buzz(20);
        later(draw, 1100);
        return;
      }
      wrongs += 1;
      btn.classList.remove("bad");
      void btn.offsetWidth;
      btn.classList.add("bad");
      sfx.again();
      speak("再找找看", true);
      if (wrongs >= 2) {
        const right = main.querySelector(`.choice[data-id="${target.id}"]`);
        if (right) right.classList.add("hint");
        speak(target.name, true);
      }
    };

    draw();
  }

  function renderCount(my) {
    let round = 0;
    let locked = false;
    let guiding = false;
    let wrongs = 0;
    let counted = 0;
    let answer = 2;
    let item = COUNT_ITEMS[0];
    const order = [COUNT_ITEMS[0], ...shuffle(COUNT_ITEMS.slice(1))];
    const timers = [];
    const later = (fn, ms) => {
      const id = window.setTimeout(() => {
        const idx = timers.indexOf(id);
        if (idx >= 0) timers.splice(idx, 1);
        if (my !== token) return;
        fn();
      }, ms);
      timers.push(id);
    };
    const clearTimers = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers.length = 0;
    };
    onLeave(clearTimers);

    const clearMarks = () => {
      counted = 0;
      main.querySelectorAll(".toy").forEach((toy) => {
        toy.dataset.on = "";
        toy.classList.remove("lit");
        const tick = toy.querySelector(".tick");
        if (tick) tick.remove();
      });
      main.querySelectorAll(".num").forEach((btn) => btn.classList.remove("pulse", "bad", "good"));
    };

    const setBadge = (toy, n) => {
      let tick = toy.querySelector(".tick");
      if (!tick) {
        tick = document.createElement("span");
        tick.className = "tick";
        toy.appendChild(tick);
      }
      tick.textContent = String(n);
    };

    const guide = () => {
      if (guiding || locked) return;
      guiding = true;
      clearMarks();
      let i = 0;
      const step = () => {
        if (my !== token || locked) return;
        const toys = [...main.querySelectorAll(".toy")];
        if (i > 0) toys[i - 1].classList.remove("lit");
        if (i >= answer) {
          guiding = false;
          const btn = main.querySelector(`.num[data-n="${answer}"]`);
          if (btn) btn.classList.add("pulse");
          speak(`${CN[answer]}${item.mw}`, true);
          return;
        }
        toys[i].classList.add("lit");
        setBadge(toys[i], i + 1);
        toys[i].dataset.on = "1";
        counted = i + 1;
        speak(CN[i + 1], true);
        sfx.blip();
        i += 1;
        later(step, 680);
      };
      step();
    };

    const win = (btn) => {
      if (locked) return;
      locked = true;
      guiding = false;
      clearTimers();
      btn.classList.add("good");
      const spot = centerOf(btn);
      burst(spot.x, spot.y, 18);
      const line = pick(CHEERS);
      cheer(line);
      sfx.ok();
      speak(`${line}${CN[answer]}${item.mw}${item.name}`, true);
      earn(1, spot.x, spot.y);
      buzz(20);
      later(draw, 1200);
    };

    const draw = () => {
      if (my !== token) return;
      clearTimers();
      locked = false;
      guiding = false;
      wrongs = 0;
      counted = 0;
      round += 1;
      item = order[(round - 1) % order.length];
      if (round === 1) answer = 2;
      else if (round === 2) answer = 1 + Math.floor(Math.random() * 3);
      else answer = 1 + Math.floor(Math.random() * 5);
      const color = ["#FF5C5C", "#3D8BFF", "#FF8A3D", "#8B6CFF", "#3CB86A"][round % 5];
      const toys = Array.from({ length: answer }, (_, i) => (
        `<button type="button" class="toy" data-i="${i}" aria-label="${item.name}">${itemSVG(item.id, color)}</button>`
      )).join("");
      const nums = [1, 2, 3, 4, 5].map((n) => (
        `<button type="button" class="num" data-n="${n}" aria-label="${CN[n]}">
          <span class="ar">${n}</span><span class="cn">${CN[n]}</span>
        </button>`
      )).join("");
      main.innerHTML = `
        <section class="count-screen">
          <div class="q-row">
            <div class="q-icon" aria-hidden="true">${itemSVG(item.id, color)}</div>
            <p class="q-mark" id="count-stage" data-n="${answer}" data-item="${item.id}">?</p>
            <button type="button" class="recount" id="recount" aria-label="再数一次">${refreshSVG()}</button>
          </div>
          <div class="toy-wrap">${toys}</div>
          <div class="nums">${nums}</div>
        </section>`;
      main.querySelectorAll(".toy").forEach((toy) => {
        toy.addEventListener("click", () => {
          if (locked || guiding) return;
          if (toy.dataset.on) {
            toy.classList.remove("boop");
            void toy.offsetWidth;
            toy.classList.add("boop");
            return;
          }
          counted += 1;
          toy.dataset.on = "1";
          setBadge(toy, counted);
          toy.classList.add("lit");
          later(() => toy.classList.remove("lit"), 280);
          speak(CN[counted], true);
          sfx.blip();
          if (counted === answer) {
            const hint = main.querySelector(`.num[data-n="${answer}"]`);
            if (hint) hint.classList.add("pulse");
          }
        });
      });
      main.querySelectorAll(".num").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (locked) return;
          const guess = Number(btn.dataset.n);
          if (guess === answer) {
            win(btn);
            return;
          }
          btn.classList.remove("bad");
          void btn.offsetWidth;
          btn.classList.add("bad");
          sfx.again();
          wrongs += 1;
          if (guiding) return;
          if (wrongs >= 2) {
            speak("我们一起数", true);
            guide();
          } else {
            speak("再看看", true);
          }
        });
      });
      $("#recount").addEventListener("click", () => {
        if (locked) return;
        clearTimers();
        guiding = false;
        clearMarks();
        sfx.tap();
        speak("再数一次", true);
      });
      later(() => speak(`数一数，有几${item.mw}${item.name}？`, true), 280);
    };

    draw();
  }

  function renderPaint(my) {
    let selected = PAINTS[0].hex;
    let selectedName = PAINTS[0].name;
    let themeAt = 0;
    const painted = new Set();
    let praised = false;
    let magicStar = false;
    let painting = false;
    let lastPart = "";
    main.innerHTML = `
      <section class="paint">
        <div class="palette" id="palette">
          ${PAINTS.map((c, i) => `<button type="button" class="swatch" style="--c:${c.hex}" data-hex="${c.hex}" data-name="${c.name}" aria-label="${c.name}" aria-pressed="${i === 0 ? "true" : "false"}"></button>`).join("")}
        </div>
        <div class="canvas-wrap">${gardenSVG(DAY)}</div>
        <div class="tools">
          <button type="button" class="tool tool-magic" id="btn-magic">${wandSVG()}<span>变变变</span></button>
          <button type="button" class="tool" id="btn-reset">${eraserSVG()}<span>重新涂</span></button>
        </div>
      </section>`;
    const scene = $("#scene");

    const applyColor = (id, color) => {
      const group = scene.querySelector(`[data-part="${id}"]`);
      if (!group) return;
      group.querySelectorAll(".pigment").forEach((node) => node.setAttribute("fill", color));
      group.querySelectorAll(".pigment-stroke").forEach((node) => node.setAttribute("stroke", color));
    };
    const applyTheme = (colors) => {
      Object.entries(colors).forEach(([id, color]) => applyColor(id, color));
    };
    const select = (hex, name) => {
      selected = hex;
      selectedName = name;
      main.querySelectorAll(".swatch").forEach((btn) => {
        btn.setAttribute("aria-pressed", btn.dataset.hex === hex ? "true" : "false");
      });
    };
    const paintPart = (id) => {
      if (!id || my !== token) return;
      applyColor(id, selected);
      sfx.tone(560 + Math.random() * 220, 0.07, "triangle", 0.045);
      painted.add(id);
      if (!praised && painted.size >= 5) {
        praised = true;
        cheer("好漂亮");
        sfx.ok();
        speak("好漂亮", true);
        const box = scene.getBoundingClientRect();
        burst(box.left + box.width / 2, box.top + box.height / 2, 20);
        earn(1, box.left + box.width * 0.7, box.top + 40);
      }
    };

    main.querySelectorAll(".swatch").forEach((btn) => {
      btn.addEventListener("click", () => {
        select(btn.dataset.hex, btn.dataset.name);
        sfx.tap();
        speak(btn.dataset.name, true);
      });
    });
    scene.addEventListener("pointerdown", (event) => {
      painting = true;
      lastPart = "";
      const group = event.target.closest("[data-part]");
      if (!group) return;
      lastPart = group.dataset.part;
      paintPart(lastPart);
    });
    scene.addEventListener("pointermove", (event) => {
      if (!painting) return;
      const group = event.target.closest("[data-part]");
      if (!group || group.dataset.part === lastPart) return;
      lastPart = group.dataset.part;
      paintPart(lastPart);
    });
    const stopPaint = () => { painting = false; lastPart = ""; };
    window.addEventListener("pointerup", stopPaint);
    window.addEventListener("pointercancel", stopPaint);
    onLeave(() => {
      window.removeEventListener("pointerup", stopPaint);
      window.removeEventListener("pointercancel", stopPaint);
    });

    $("#btn-magic").addEventListener("click", () => {
      const theme = THEMES[themeAt % THEMES.length];
      themeAt += 1;
      applyTheme(theme.colors);
      sfx.magic();
      speak(theme.speech, true);
      cheer(theme.speech);
      const box = scene.getBoundingClientRect();
      burst(box.left + box.width / 2, box.top + box.height / 3, 22);
      if (!magicStar) {
        magicStar = true;
        earn(1, box.left + box.width / 2, box.top + 30);
      }
    });
    $("#btn-reset").addEventListener("click", () => {
      applyTheme(DAY);
      themeAt = 0;
      sfx.tap();
      speak("重新涂", true);
    });
    window.setTimeout(() => speak("选个颜色，涂一涂", true), 280);
    announce(`选中${selectedName}`);
  }

  function n(value) { return Math.round(value * 10) / 10; }

  function shape(tag, attrs, fill) {
    const list = Object.entries(attrs).map(([k, v]) => `${k}="${typeof v === "number" ? n(v) : v}"`).join(" ");
    return `<${tag} class="pigment" fill="${fill}" ${list}></${tag}><${tag} class="line" ${list}></${tag}>`;
  }

  function group(id, inner) { return `<g data-part="${id}">${inner}</g>`; }

  function sunRays(cx, cy, color) {
    let out = "";
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      const x1 = cx + Math.cos(a) * 46;
      const y1 = cy + Math.sin(a) * 46;
      const x2 = cx + Math.cos(a) * 62;
      const y2 = cy + Math.sin(a) * 62;
      out += `<line class="pigment-stroke" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="6" stroke-linecap="round"></line>`;
    }
    return out;
  }

  function cloudGroup(id, cx, cy, scale, color) {
    const bubble = (dx, dy, r) => shape("circle", { cx: cx + dx * scale, cy: cy + dy * scale, r: r * scale }, color);
    const puff = shape("rect", {
      x: cx - 38 * scale,
      y: cy + 6 * scale,
      width: 78 * scale,
      height: 20 * scale,
      rx: 10 * scale,
    }, color);
    return group(id, bubble(-26, 6, 16) + bubble(0, -2, 24) + bubble(28, 8, 16) + puff);
  }

  function gardenSVG(colors) {
    const petals = [];
    const cx = 58;
    const cy = 338;
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      petals.push(shape("circle", { cx: cx + Math.cos(a) * 18, cy: cy + Math.sin(a) * 18, r: 14 }, colors.bloom));
    }
    return `<svg id="scene" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid meet" role="img" aria-label="小花园">
      ${group("sky", shape("rect", { x: 0, y: 0, width: 400, height: 520 }, colors.sky))}
      ${group("sun", shape("circle", { cx: 328, cy: 74, r: 34 }, colors.sun) + sunRays(328, 74, colors.sun))}
      ${cloudGroup("cloud1", 92, 78, 1.05, colors.cloud1)}
      ${cloudGroup("cloud2", 210, 58, 0.78, colors.cloud2)}
      ${group("bird", shape("ellipse", { cx: 250, cy: 132, rx: 16, ry: 10 }, colors.bird) + shape("polygon", { points: "264,132 284,122 284,142" }, colors.bird) + `<circle cx="244" cy="130" r="2" fill="#2B2420"></circle>`)}
      ${group("hill", shape("ellipse", { cx: 200, cy: 520, rx: 290, ry: 150 }, colors.hill))}
      ${group("trunk", shape("rect", { x: 118, y: 300, width: 28, height: 118, rx: 8 }, colors.trunk))}
      ${group("canopy",
        shape("circle", { cx: 104, cy: 292, r: 38 }, colors.canopy) +
        shape("circle", { cx: 146, cy: 268, r: 46 }, colors.canopy) +
        shape("circle", { cx: 176, cy: 308, r: 32 }, colors.canopy)
      )}
      ${group("apple", shape("circle", { cx: 156, cy: 286, r: 13 }, colors.apple) + `<path d="M156 274c0-8 6-10 10-6" fill="none" stroke="#5A4034" stroke-width="3" stroke-linecap="round"></path>`)}
      ${group("chimney", shape("rect", { x: 248, y: 158, width: 24, height: 70, rx: 4 }, colors.chimney))}
      ${group("wall", shape("rect", { x: 196, y: 250, width: 156, height: 150, rx: 12 }, colors.wall))}
      ${group("roof", shape("polygon", { points: "182,258 274,168 366,258" }, colors.roof))}
      ${group("door", shape("rect", { x: 228, y: 316, width: 48, height: 84, rx: 8 }, colors.door) + `<circle cx="266" cy="362" r="4" fill="#5A4034"></circle>`)}
      ${group("window", shape("rect", { x: 292, y: 286, width: 42, height: 42, rx: 6 }, colors.window) + `<line class="line" x1="313" y1="286" x2="313" y2="328"></line><line class="line" x1="292" y1="307" x2="334" y2="307"></line>`)}
      ${group("stem", shape("rect", { x: 52, y: 348, width: 12, height: 86, rx: 6 }, colors.stem))}
      ${group("bloom", petals.join(""))}
      ${group("heart", shape("circle", { cx, cy, r: 10 }, colors.heart))}
    </svg>`;
  }

  function animalSVG(id) {
    const art = {
      cat: `<svg viewBox="0 0 120 120" aria-hidden="true">
        <path d="M34 52 L24 18 L52 44Z" fill="#F4A259"/>
        <path d="M86 52 L96 18 L68 44Z" fill="#F4A259"/>
        <path d="M36 50 L30 26 L50 44Z" fill="#F7C1D0"/>
        <path d="M84 50 L90 26 L70 44Z" fill="#F7C1D0"/>
        <circle cx="60" cy="68" r="32" fill="#F4A259"/>
        <ellipse cx="60" cy="80" rx="14" ry="11" fill="#FFE3C4"/>
        <circle cx="47" cy="64" r="4.4" fill="#2B2420"/>
        <circle cx="73" cy="64" r="4.4" fill="#2B2420"/>
        <circle cx="48.6" cy="62.4" r="1.5" fill="#fff"/>
        <circle cx="74.6" cy="62.4" r="1.5" fill="#fff"/>
        <path d="M60 74 l-3.2 5 h6.4z" fill="#E56B8A"/>
        <path d="M52 86 Q60 94 68 86" stroke="#2B2420" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M22 70h16M82 70h16M24 80h12M84 80h12" stroke="#2B2420" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      dog: `<svg viewBox="0 0 120 120" aria-hidden="true">
        <ellipse cx="30" cy="62" rx="16" ry="26" fill="#C9844A"/>
        <ellipse cx="90" cy="62" rx="16" ry="26" fill="#C9844A"/>
        <circle cx="60" cy="68" r="32" fill="#E0A36A"/>
        <ellipse cx="60" cy="82" rx="16" ry="13" fill="#F6E2C8"/>
        <ellipse cx="47" cy="64" rx="5" ry="6.2" fill="#2B2420"/>
        <ellipse cx="73" cy="64" rx="5" ry="6.2" fill="#2B2420"/>
        <circle cx="48.6" cy="62" r="1.6" fill="#fff"/>
        <circle cx="74.6" cy="62" r="1.6" fill="#fff"/>
        <ellipse cx="60" cy="76" rx="5.5" ry="4" fill="#2B2420"/>
        <path d="M60 78 Q68 90 60 92 Q52 90 60 78" fill="#F28B8B"/>
        <circle cx="40" cy="78" r="6" fill="#F4B6C4" opacity="0.85"/>
        <circle cx="80" cy="78" r="6" fill="#F4B6C4" opacity="0.85"/>
      </svg>`,
      rabbit: `<svg viewBox="0 0 120 120" aria-hidden="true">
        <ellipse cx="42" cy="36" rx="11" ry="28" fill="#F7F1EA"/>
        <ellipse cx="78" cy="36" rx="11" ry="28" fill="#F7F1EA"/>
        <ellipse cx="42" cy="38" rx="5.5" ry="18" fill="#F6B7C8"/>
        <ellipse cx="78" cy="38" rx="5.5" ry="18" fill="#F6B7C8"/>
        <circle cx="60" cy="74" r="30" fill="#F7F1EA"/>
        <circle cx="48" cy="70" r="4" fill="#2B2420"/>
        <circle cx="72" cy="70" r="4" fill="#2B2420"/>
        <circle cx="49.4" cy="68.6" r="1.4" fill="#fff"/>
        <circle cx="73.4" cy="68.6" r="1.4" fill="#fff"/>
        <ellipse cx="60" cy="80" rx="4" ry="3" fill="#F28B8B"/>
        <path d="M54 86h4v6h-4zM62 86h4v6h-4z" fill="#fff" stroke="#E7D7CC" stroke-width="1"/>
        <circle cx="40" cy="80" r="6" fill="#F6B7C8" opacity="0.8"/>
        <circle cx="80" cy="80" r="6" fill="#F6B7C8" opacity="0.8"/>
      </svg>`,
      duck: `<svg viewBox="0 0 120 120" aria-hidden="true">
        <ellipse cx="60" cy="74" rx="34" ry="26" fill="#FFD84A"/>
        <circle cx="78" cy="48" r="22" fill="#FFD84A"/>
        <ellipse cx="96" cy="52" rx="16" ry="8" fill="#F27C38"/>
        <circle cx="84" cy="44" r="3.4" fill="#2B2420"/>
        <circle cx="85.2" cy="42.8" r="1.2" fill="#fff"/>
        <ellipse cx="46" cy="78" rx="12" ry="7" fill="#FFE98A"/>
      </svg>`,
      pig: `<svg viewBox="0 0 120 120" aria-hidden="true">
        <ellipse cx="36" cy="58" rx="12" ry="10" fill="#F7A8BE"/>
        <ellipse cx="84" cy="58" rx="12" ry="10" fill="#F7A8BE"/>
        <circle cx="60" cy="70" r="32" fill="#FFB3C7"/>
        <ellipse cx="60" cy="80" rx="16" ry="12" fill="#F78AA6"/>
        <circle cx="54" cy="80" r="2.4" fill="#7A4456"/>
        <circle cx="66" cy="80" r="2.4" fill="#7A4456"/>
        <circle cx="48" cy="64" r="4" fill="#2B2420"/>
        <circle cx="72" cy="64" r="4" fill="#2B2420"/>
        <circle cx="49.3" cy="62.7" r="1.3" fill="#fff"/>
        <circle cx="73.3" cy="62.7" r="1.3" fill="#fff"/>
        <path d="M52 90 Q60 96 68 90" stroke="#7A4456" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      </svg>`,
      panda: `<svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="32" cy="36" r="16" fill="#2B2B2B"/>
        <circle cx="88" cy="36" r="16" fill="#2B2B2B"/>
        <circle cx="60" cy="68" r="34" fill="#F7F4EE"/>
        <ellipse cx="46" cy="64" rx="12" ry="14" fill="#2B2B2B"/>
        <ellipse cx="74" cy="64" rx="12" ry="14" fill="#2B2B2B"/>
        <circle cx="46" cy="64" r="4.2" fill="#F7F4EE"/>
        <circle cx="74" cy="64" r="4.2" fill="#F7F4EE"/>
        <circle cx="46" cy="64" r="2.3" fill="#2B2B2B"/>
        <circle cx="74" cy="64" r="2.3" fill="#2B2B2B"/>
        <ellipse cx="60" cy="80" rx="6" ry="4.2" fill="#2B2B2B"/>
        <path d="M52 88 Q60 96 68 88" stroke="#2B2B2B" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      </svg>`,
      frog: `<svg viewBox="0 0 120 120" aria-hidden="true">
        <ellipse cx="60" cy="78" rx="36" ry="26" fill="#67C15E"/>
        <circle cx="38" cy="46" r="16" fill="#67C15E"/>
        <circle cx="82" cy="46" r="16" fill="#67C15E"/>
        <circle cx="38" cy="46" r="8" fill="#F7F4EE"/>
        <circle cx="82" cy="46" r="8" fill="#F7F4EE"/>
        <circle cx="38" cy="46" r="4" fill="#2B2420"/>
        <circle cx="82" cy="46" r="4" fill="#2B2420"/>
        <circle cx="39.4" cy="44.6" r="1.4" fill="#fff"/>
        <circle cx="83.4" cy="44.6" r="1.4" fill="#fff"/>
        <path d="M48 84 Q60 96 72 84" stroke="#2A5A28" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="28" cy="78" r="6" fill="#FF8FAB" opacity="0.75"/>
        <circle cx="92" cy="78" r="6" fill="#FF8FAB" opacity="0.75"/>
      </svg>`,
      fox: `<svg viewBox="0 0 120 120" aria-hidden="true">
        <path d="M30 54 L16 16 L52 42Z" fill="#F27C38"/>
        <path d="M90 54 L104 16 L68 42Z" fill="#F27C38"/>
        <path d="M32 50 L24 26 L48 42Z" fill="#F6B7C8"/>
        <path d="M88 50 L96 26 L72 42Z" fill="#F6B7C8"/>
        <circle cx="60" cy="70" r="32" fill="#F27C38"/>
        <ellipse cx="60" cy="84" rx="18" ry="14" fill="#FFF3E4"/>
        <ellipse cx="47" cy="64" rx="4.5" ry="5.4" fill="#2B2420"/>
        <ellipse cx="73" cy="64" rx="4.5" ry="5.4" fill="#2B2420"/>
        <circle cx="48.4" cy="62.4" r="1.5" fill="#fff"/>
        <circle cx="74.4" cy="62.4" r="1.5" fill="#fff"/>
        <ellipse cx="60" cy="78" rx="4" ry="3" fill="#2B2420"/>
        <path d="M52 88 Q60 96 68 88" stroke="#2B2420" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      </svg>`,
    };
    return art[id] || art.cat;
  }

  function itemSVG(id, color = "#3D8BFF") {
    if (id === "duck") return animalSVG("duck");
    if (id === "apple") {
      return `<svg viewBox="0 0 100 100" aria-hidden="true">
        <ellipse cx="50" cy="58" rx="28" ry="26" fill="#FF5C5C"/>
        <ellipse cx="40" cy="48" rx="8" ry="10" fill="rgba(255,255,255,.4)"/>
        <path d="M50 36 C50 24 60 22 64 28" stroke="#6B3E22" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse cx="66" cy="30" rx="9" ry="5" fill="#3CB86A" transform="rotate(-28 66 30)"/>
      </svg>`;
    }
    if (id === "star") {
      return `<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,8 61,36 92,38 68,58 76,90 50,73 24,90 32,58 8,38 39,36" fill="#FFD23F"/></svg>`;
    }
    if (id === "fish") {
      return `<svg viewBox="0 0 100 100" aria-hidden="true">
        <polygon points="16,50 40,32 40,68" fill="${color}"/>
        <ellipse cx="58" cy="50" rx="28" ry="20" fill="${color}"/>
        <circle cx="70" cy="46" r="3.6" fill="#2B2420"/>
        <circle cx="71.2" cy="44.8" r="1.3" fill="#fff"/>
        <path d="M58 56 Q66 62 76 56" stroke="#2B2420" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="40" rx="26" ry="30" fill="${color}"/>
      <ellipse cx="40" cy="30" rx="8" ry="12" fill="rgba(255,255,255,.45)"/>
      <polygon points="50,68 43,80 57,80" fill="${color}"/>
      <path d="M50 80 C44 90 58 92 50 100" stroke="#5A4034" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  function mascotSVG() {
    return `<svg class="mascot-svg" viewBox="0 0 200 240" aria-hidden="true">
      <ellipse cx="100" cy="226" rx="54" ry="9" fill="rgba(90,60,40,.13)"/>
      <g class="tail">
        <path d="M136 148 C196 112 200 196 148 190 C178 170 172 146 142 156Z" fill="#F27C38"/>
        <ellipse cx="162" cy="178" rx="14" ry="11" fill="#FFF3E4"/>
      </g>
      <g class="arm arm-l">
        <rect x="34" y="134" width="22" height="50" rx="11" fill="#F27C38"/>
      </g>
      <ellipse cx="100" cy="164" rx="58" ry="48" fill="#F27C38"/>
      <ellipse cx="100" cy="176" rx="36" ry="30" fill="#FFE3C4"/>
      <ellipse cx="76" cy="206" rx="16" ry="11" fill="#E56A28"/>
      <ellipse cx="126" cy="206" rx="16" ry="11" fill="#E56A28"/>
      <g class="arm arm-r">
        <rect x="146" y="112" width="22" height="54" rx="11" fill="#F27C38"/>
        <circle cx="157" cy="166" r="12" fill="#FFE3C4"/>
      </g>
      <path d="M64 78 L46 24 L96 60Z" fill="#F27C38"/>
      <path d="M136 78 L154 24 L104 60Z" fill="#F27C38"/>
      <path d="M68 74 L56 38 L90 60Z" fill="#F6B7C8"/>
      <path d="M132 74 L144 38 L110 60Z" fill="#F6B7C8"/>
      <circle cx="100" cy="96" r="48" fill="#F27C38"/>
      <ellipse cx="100" cy="114" rx="26" ry="20" fill="#FFF3E4"/>
      <g class="eyes">
        <ellipse cx="82" cy="92" rx="6" ry="7.2" fill="#2B2420"/>
        <ellipse cx="118" cy="92" rx="6" ry="7.2" fill="#2B2420"/>
        <circle cx="84" cy="90" r="2" fill="#fff"/>
        <circle cx="120" cy="90" r="2" fill="#fff"/>
      </g>
      <ellipse cx="66" cy="106" rx="8" ry="5" fill="#F6B7C8"/>
      <ellipse cx="134" cy="106" rx="8" ry="5" fill="#F6B7C8"/>
      <ellipse cx="100" cy="110" rx="4.4" ry="3.2" fill="#2B2420"/>
      <path d="M86 120 Q100 134 114 120" stroke="#2B2420" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  $("#btn-sound").addEventListener("click", toggleSound);
  document.addEventListener("click", (event) => {
    if (event.target.closest("#btn-home")) {
      sfx.tap();
      go("home");
    }
  });
  document.addEventListener("pointerdown", () => sfx.unlock(), { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      go("home");
      return;
    }
    if (state.screen === "count" && /^[1-5]$/.test(event.key)) {
      const btn = main.querySelector(`.num[data-n="${event.key}"]`);
      if (btn) btn.click();
    }
  });

  if (window.speechSynthesis) {
    speechSynthesis.getVoices();
    speechSynthesis.addEventListener("voiceschanged", () => speechSynthesis.getVoices());
  }

  $("#star-ico").innerHTML = starSVG();
  addStars(0);
  updateSoundButton();
  go("home");
})();
