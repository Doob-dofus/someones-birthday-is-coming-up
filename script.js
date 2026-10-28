/* ═══ Pour Elé ═══ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (REDUCED) document.documentElement.classList.add("rm");

  /* ─── Décompte → samedi 7 novembre 2026, 9h00 (Paris) ─── */
  var TARGET = new Date("2026-11-07T09:00:00+01:00").getTime();
  var cdD = document.getElementById("cd-d"), cdH = document.getElementById("cd-h"),
      cdM = document.getElementById("cd-m"), cdS = document.getElementById("cd-s");
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tick() {
    var diff = TARGET - Date.now();
    if (diff <= 0) {
      document.getElementById("countdown").innerHTML =
        '<p style="font-family:var(--serif);font-style:italic;font-size:1.4rem;color:var(--lilas-soft)">C\u2019est aujourd\u2019hui \u2665</p>';
      return;
    }
    cdD.textContent = Math.floor(diff / 864e5);
    cdH.textContent = pad(Math.floor(diff / 36e5) % 24);
    cdM.textContent = pad(Math.floor(diff / 6e4) % 60);
    cdS.textContent = pad(Math.floor(diff / 1e3) % 60);
    setTimeout(tick, 1000);
  }
  tick();

  /* ─── Flash appareil photo ─── */
  var flash = document.getElementById("flash");
  function fireFlash() {
    if (REDUCED) return;
    flash.classList.remove("on"); void flash.offsetWidth; flash.classList.add("on");
    sfx.shutter();
  }

  /* ─── Révélations simples (hors scènes) ─── */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("visible"); io.unobserve(e.target);
    });
  }, { threshold: 0.25 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ─── Particules du hero ─── */
  var canvas = document.getElementById("particles");
  var heroOn = true;
  new IntersectionObserver(function (e) { heroOn = e[0].isIntersecting; }).observe(document.getElementById("hero"));
  if (!REDUCED && canvas.getContext) {
    var ctx = canvas.getContext("2d"), W, H, parts = [];
    var resizeP = function () { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    window.addEventListener("resize", resizeP); resizeP();
    var COLORS = ["201,182,228", "201,168,106", "140,106,79"];
    for (var i = 0; i < 42; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.18, vy: -0.12 - Math.random() * 0.3, a: 0.15 + Math.random() * 0.45, c: COLORS[i % 3], ph: Math.random() * 6.28 });
    (function draw(t) {
      if (heroOn) {
        ctx.clearRect(0, 0, W, H);
        parts.forEach(function (p) {
          p.x += p.vx; p.y += p.vy;
          if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
          if (p.x < -8) p.x = W + 8; if (p.x > W + 8) p.x = -8;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
          ctx.fillStyle = "rgba(" + p.c + "," + (p.a * (0.6 + 0.4 * Math.sin(t / 900 + p.ph))) + ")"; ctx.fill();
        });
      }
      requestAnimationFrame(draw);
    })(0);
  }

  /* ═════════════ MOTEUR DE SCROLL ═════════════
     Chaque élément [data-k] décrit des images-clés :
     "u prop valeur…|u …"  (u = position dans la scène, en % d'écran)
     s=échelle · x/y=translation % · r/ry=rotation · o=opacité · c=cercle de découpe · d=tracé   */
  function parseK(str, tracks) {
    str.split("|").forEach(function (seg) {
      var t = seg.trim().split(/\s+/), u = parseFloat(t[0]);
      for (var i = 1; i < t.length; i++) {
        var m = t[i].match(/^([a-z]+)(-?[\d.]+)$/);
        if (m) (tracks[m[1]] = tracks[m[1]] || []).push([u, parseFloat(m[2])]);
      }
    });
    return tracks;
  }
  function val(tr, u, log) {
    var n = tr.length;
    if (u <= tr[0][0]) return tr[0][1];
    if (u >= tr[n - 1][0]) return tr[n - 1][1];
    for (var i = 1; i < n; i++) if (u < tr[i][0]) {
      var a = tr[i - 1], b = tr[i], t = (u - a[0]) / (b[0] - a[0]);
      if (log) return a[1] * Math.pow(b[1] / a[1], t);
      t = t * t * (3 - 2 * t);
      return a[1] + (b[1] - a[1]) * t;
    }
  }
  function Layer(el, scene) {
    var tr = parseK(el.getAttribute("data-k"), {});
    if (el.hasAttribute("data-k2")) parseK(el.getAttribute("data-k2"), tr);
    for (var k in tr) tr[k].sort(function (a, b) { return a[0] - b[0]; });
    this.el = el; this.tr = tr; this.scene = scene; this.last = "";
    this.dash = tr.d ? el.querySelectorAll(".dash") : null;
    if (this.dash) [].forEach.call(this.dash, function (p) { p.style.strokeDasharray = "1 1"; });
  }
  Layer.prototype.apply = function (u) {
    var tr = this.tr, s = "", v;
    if (tr.x || tr.y) s += "translate3d(" + (tr.x ? val(tr.x, u) : 0).toFixed(2) + "%," + (tr.y ? val(tr.y, u) : 0).toFixed(2) + "%,0) ";
    if (tr.ry) s += "perspective(1100px) rotateY(" + val(tr.ry, u).toFixed(1) + "deg) ";
    if (tr.r) s += "rotate(" + val(tr.r, u).toFixed(2) + "deg) ";
    if (tr.s) s += "scale(" + val(tr.s, u, true).toFixed(4) + ")";
    var o = tr.o ? val(tr.o, u) : 1, clip = "";
    if (tr.c) {
      v = val(tr.c, u);
      if (v < 149) {
        var g = this.scene.geo();
        clip = "circle(" + v.toFixed(2) + "vmax at " + g[0].toFixed(0) + "px " + g[1].toFixed(0) + "px)";
      } else clip = "none";
    }
    var key = s + "|" + o.toFixed(3) + "|" + clip;
    if (key === this.last) return;
    this.last = key;
    var st = this.el.style;
    st.transform = s; st.opacity = o.toFixed(3);
    if (tr.c) { st.clipPath = clip; st.webkitClipPath = clip; }
    if (this.dash) { var d = val(tr.d, u); [].forEach.call(this.dash, function (p) { p.style.strokeDashoffset = (1 - d).toFixed(4); }); }
  };

  function Scene(el) {
    this.el = el; this.a = +el.dataset.a; this.b = +el.dataset.b;
    this.rest = el.dataset.rest !== undefined ? +el.dataset.rest : null;
    this.clock = el.dataset.clock || null; this.ca = +el.dataset.ca || this.a;
    var o = (el.dataset.o || "500 500").split(" ");
    this.ox = +o[0]; this.oy = +o[1]; this.al = el.dataset.al || "c";
    this.ev = (el.dataset.ev || "").split(" ").filter(Boolean).map(function (e) { var p = e.split("@"); return { t: p[0], u: +p[1] }; });
    var self = this;
    this.layers = [].map.call(el.querySelectorAll("[data-k]"), function (n) { return new Layer(n, self); });
    if (el.hasAttribute("data-k")) this.layers.unshift(new Layer(el, self));
    this.canvas = el.querySelector(".streaks");
    this.on = false;
  }
  Scene.prototype.geo = function () {  /* centre de découpe en px écran */
    var W = this.el.clientWidth, H = this.el.clientHeight, S = Math.max(W, H);
    var top = this.al === "b" ? H - S : (H - S) / 2;
    return [(W - S) / 2 + this.ox * S / 1000, top + this.oy * S / 1000];
  };

  var VH = window.innerHeight, VW = window.innerWidth;
  var journeys = [].map.call(document.querySelectorAll(".journey"), function (sec) {
    return { sec: sec, len: +sec.dataset.len, scenes: [].map.call(sec.querySelectorAll(".scene"), function (s) { return new Scene(s); }), cur: -999, top: 0 };
  });
  var mapSec = document.querySelector(".mapsec");
  var MAP = mapSec ? initMap(mapSec) : null;

  function layout() {
    journeys.forEach(function (j) {
      if (!REDUCED) j.sec.style.height = (j.len * VH / 100 + VH) + "px";
      j.top = j.sec.getBoundingClientRect().top + window.scrollY;
    });
    if (MAP) {
      if (!REDUCED) MAP.sec.style.height = (MAP.len * VH / 100 + VH) + "px";
      MAP.top = MAP.sec.getBoundingClientRect().top + window.scrollY;
    }
  }
  window.addEventListener("resize", function () {
    var w = window.innerWidth, h = window.innerHeight;
    if (w !== VW || Math.abs(h - VH) > 140) { VW = w; VH = h; layout(); kick(); }
    journeys.forEach(function (j) { j.scenes.forEach(function (s) { s.layers.forEach(function (l) { l.last = ""; }); }); });
  });

  /* ─── Mode réduit : chaque scène figée à son moment clé ─── */
  if (REDUCED) {
    journeys.forEach(function (j) {
      j.scenes.forEach(function (s) {
        if (s.rest === null) { s.el.classList.add("skip"); return; }
        s.el.classList.add("on");
        s.layers.forEach(function (l) { l.apply(s.rest); });
        s.el.style.clipPath = "none"; s.el.style.transform = "none"; s.el.style.opacity = 1;
      });
    });
    if (MAP) MAP.render(1);
  }

  var clockEl = document.getElementById("clock"), clockTxt = clockEl.querySelector("span"), clockNow = "";
  var progEl = document.querySelector("#progress i");
  var smooth = REDUCED ? 1 : 0.14, raf = 0, lastU = {};

  function frame() {
    raf = 0;
    var y = window.scrollY, busy = false, clock = null, inJourney = false;
    var docH = document.documentElement.scrollHeight - VH;
    progEl.style.transform = "scaleX(" + Math.min(1, Math.max(0, y / docH)).toFixed(4) + ")";
    if (REDUCED) return;

    journeys.forEach(function (j, ji) {
      var target = (y - j.top) / VH * 100;
      if (target < -100 || target > j.len + 100) { if (j.cur !== -999) { j.scenes.forEach(function (s) { s.el.classList.remove("on"); s.on = false; }); j.cur = -999; } return; }
      if (j.cur === -999) j.cur = target;
      var prev = j.cur;
      j.cur += (target - j.cur) * smooth;
      if (Math.abs(target - j.cur) < 0.05) j.cur = target; else busy = true;
      var u = j.cur, vel = u - prev;
      if (target >= 0 && target <= j.len) inJourney = true;
      j.scenes.forEach(function (s) {
        var on = u >= s.a - 2 && u <= s.b + 2;
        if (on !== s.on) { s.on = on; s.el.classList.toggle("on", on); }
        if (!on) return;
        s.layers.forEach(function (l) { l.apply(u); });
        s.ev.forEach(function (e) { if (prev < e.u && u >= e.u) fire(e.t); });
        if (s.canvas) streaks(s.canvas, vel);
      });
      j.scenes.forEach(function (s) { if (s.clock && u >= s.ca) clock = s.clock; });
    });

    if (MAP) { if (MAP.update(y)) busy = true; if (MAP.active) { inJourney = true; clock = MAP.clock; } }

    clockEl.classList.toggle("on", inJourney && !!clock);
    if (clock && clock !== clockNow) { clockNow = clock; clockTxt.textContent = clock; }
    if (busy) kick();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function fire(t) {
    if (t === "flash") fireFlash();
    else if (t === "whoosh") sfx.whoosh();
    else if (t === "bubbles") sfx.bubbles();
    else if (t === "curtain") sfx.whoosh(0.9);
  }
  window.addEventListener("scroll", kick, { passive: true });

  /* ─── Traînées lumineuses (trajet de nuit) ─── */
  var stars3d = [];
  for (var si = 0; si < 260; si++) stars3d.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), c: si % 3 });
  var streakAnim = 0;
  function streaks(cv, vel) {
    if (cv.width !== cv.clientWidth) { cv.width = cv.clientWidth; cv.height = cv.clientHeight; }
    var c = cv.getContext("2d"), w = cv.width, h = cv.height, cx = w / 2, cy = h * 0.55, f = Math.max(w, h) * 0.5;
    var sp = 0.004 + Math.min(0.06, Math.abs(vel) * 0.004);
    c.fillStyle = "rgba(14,11,17,.35)"; c.fillRect(0, 0, w, h);
    var cols = ["243,223,168", "201,182,228", "255,170,110"];
    stars3d.forEach(function (p) {
      var zt = Math.min(1, p.z + 0.04 + sp * 5), x0 = cx + p.x / zt * f * 0.3, y0 = cy + p.y / zt * f * 0.18;
      p.z -= sp;
      if (p.z < 0.03) { p.z = 1; p.x = Math.random() * 2 - 1; p.y = Math.random() * 2 - 1; return; }
      var x1 = cx + p.x / p.z * f * 0.3, y1 = cy + p.y / p.z * f * 0.18;
      c.strokeStyle = "rgba(" + cols[p.c] + "," + Math.min(1, (1 - p.z) * 1.3).toFixed(2) + ")";
      c.lineWidth = (1 - p.z) * 3.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    });
    if (!streakAnim) streakAnim = requestAnimationFrame(function () { streakAnim = 0; var s = cv.closest(".scene"); if (s.classList.contains("on")) streaks(cv, 0); });
  }

  /* ═════════════ CARTE 3D ═════════════ */
  function initMap(sec) {
    var plane = sec.querySelector(".map-plane"), dot = sec.querySelector(".map-dot");
    var sat = [].slice.call(sec.querySelectorAll(".leg.sat")), sun = [].slice.call(sec.querySelectorAll(".leg.sun"));
    var pins = [].slice.call(sec.querySelectorAll(".pin:not(.tower)")), tower = sec.querySelector(".pin.tower");
    var sub = sec.querySelector(".map-caption");
    [].concat(sat, sun).forEach(function (p) { p.L = p.getTotalLength(); p.style.strokeDasharray = p.L + " " + p.L; p.style.strokeDashoffset = p.L; });
    var M = { sec: sec, len: +sec.dataset.len, top: 0, cur: -999, active: false, clock: "", lastKey: "" };
    function lerp(a, b, t) { return a + (b - a) * t; }
    function ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
    function drawLegs(legs, t) { /* t ∈ [0, legs.length] */
      var pt = null;
      legs.forEach(function (p, i) {
        var k = Math.max(0, Math.min(1, t - i));
        p.style.strokeDashoffset = (p.L * (1 - ease(k))).toFixed(1);
        if (t >= i && t <= i + 1) pt = p.getPointAtLength(p.L * ease(k));
      });
      if (!pt && t > legs.length) { var l = legs[legs.length - 1]; pt = l.getPointAtLength(l.L); }
      if (!pt && t <= 0) pt = legs[0].getPointAtLength(0);
      return pt;
    }
    M.render = function (p) {
      /* 0–.12 vue à plat · .12–.24 bascule 3D · .24–.58 samedi · .58–.88 dimanche · .88–1 vue d'ensemble */
      var tilt = lerp(0, 58, ease((p - 0.06) / 0.16)), rot = lerp(0, -32, ease((p - 0.06) / 0.18));
      var mobile = window.innerWidth < 760;
      var zIn = mobile ? 1.15 : 1.25, zOut = mobile ? 0.34 : 0.72;
      var z = lerp(zOut, zIn, ease((p - 0.08) / 0.16));
      z = lerp(z, zOut * 1.05, ease((p - 0.88) / 0.1));
      var ts = (p - 0.24) / 0.34 * sat.length, tu = (p - 0.6) / 0.28 * sun.length;
      var ps = drawLegs(sat, ts), pu = drawLegs(sun, tu);
      var pt = p < 0.59 ? ps : pu;
      var cx = 600, cy = 500, fx = pt.x, fy = pt.y;
      var follow = ease((p - 0.12) / 0.12) * (1 - ease((p - 0.88) / 0.1));
      var dx = lerp(cx, fx, follow) - cx, dy = lerp(cy, fy, follow) - cy;
      dot.setAttribute("cx", pt.x.toFixed(1)); dot.setAttribute("cy", pt.y.toFixed(1));
      dot.style.opacity = p > 0.2 && p < 0.9 ? 1 : 0;
      var key = [tilt, rot, z, dx, dy].map(function (v) { return v.toFixed(2); }).join();
      if (key !== M.lastKey) {
        M.lastKey = key;
        plane.style.transform = "rotateX(" + tilt.toFixed(2) + "deg) rotateZ(" + rot.toFixed(2) + "deg) scale(" + z.toFixed(3) + ") translate(" + (-dx).toFixed(1) + "px," + (-dy).toFixed(1) + "px)";
        var bill = "rotateZ(" + (-rot).toFixed(2) + "deg) rotateX(" + (-tilt).toFixed(2) + "deg) scale(" + (1 / Math.max(z, 0.6)).toFixed(3) + ")";
        pins.forEach(function (pn) { pn.style.transform = bill; });
        tower.style.transform = bill;
      }
      pins.forEach(function (pn) {
        var leg = +pn.dataset.leg, day = pn.classList.contains("sun") ? "sun" : pn.classList.contains("sat") ? "sat" : "both";
        var on = day === "both" ? p > 0.2 : day === "sat" ? ts >= leg + 1 : tu >= leg + 1;
        if (on !== pn.classList.contains("on")) { pn.classList.toggle("on", on); if (on && p < 1) sfx.pop(); }
      });
      plane.classList.toggle("overview", p > 0.9);
      M.clock = p < 0.59 ? "Samedi · l'itinéraire" : "Dimanche · l'itinéraire";
      if (sub) { sub.style.opacity = (1 - ease((p - 0.14) / 0.1)).toFixed(3); sub.style.transform = "translateY(" + (-30 * ease((p - 0.14) / 0.1)).toFixed(1) + "px)"; }
    };
    M.update = function (y) {
      var target = (y - M.top) / VH * 100;
      M.active = target >= 0 && target <= M.len;
      if (target < -100 || target > M.len + 100) return false;
      if (M.cur < -50) M.cur = target;
      M.cur += (target - M.cur) * smooth;
      var busy = Math.abs(target - M.cur) > 0.05;
      if (!busy) M.cur = target;
      M.render(Math.max(0, Math.min(1, M.cur / M.len)));
      return busy;
    };
    return M;
  }

  layout(); kick();
  window.addEventListener("load", function () { layout(); kick(); });

  /* ═════════════ SON : nappe + effets (WebAudio, aucun fichier) ═════════════ */
  var audioCtx = null, padNodes = null, soundOn = false;
  var toggle = document.getElementById("sound-toggle");
  function noiseBuf(sec) {
    var b = audioCtx.createBuffer(1, audioCtx.sampleRate * sec, audioCtx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  var sfx = {
    shutter: function () {
      if (!soundOn || !audioCtx) return;
      var t = audioCtx.currentTime, src = audioCtx.createBufferSource(); src.buffer = noiseBuf(0.08);
      var hp = audioCtx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1800;
      var g = audioCtx.createGain(); g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      src.connect(hp); hp.connect(g); g.connect(audioCtx.destination); src.start(t);
    },
    whoosh: function (len) {
      if (!soundOn || !audioCtx) return;
      len = len || 0.7;
      var t = audioCtx.currentTime, src = audioCtx.createBufferSource(); src.buffer = noiseBuf(len);
      var bp = audioCtx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2400, t + len * 0.6); bp.frequency.exponentialRampToValueAtTime(600, t + len);
      var g = audioCtx.createGain(); g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.16, t + len * 0.45); g.gain.exponentialRampToValueAtTime(0.001, t + len);
      src.connect(bp); bp.connect(g); g.connect(audioCtx.destination); src.start(t);
    },
    bubbles: function () {
      if (!soundOn || !audioCtx) return;
      for (var i = 0; i < 7; i++) {
        var t = audioCtx.currentTime + i * 0.11 + Math.random() * 0.05, o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(380 + Math.random() * 300, t); o.frequency.exponentialRampToValueAtTime(900 + Math.random() * 500, t + 0.08);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
        o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + 0.12);
      }
    },
    pop: function () {
      if (!soundOn || !audioCtx) return;
      var t = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "triangle"; o.frequency.setValueAtTime(660, t); o.frequency.exponentialRampToValueAtTime(990, t + 0.06);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g); g.connect(audioCtx.destination); o.start(t); o.stop(t + 0.3);
    }
  };
  function startPad() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    var master = audioCtx.createGain();
    master.gain.value = 0; master.gain.linearRampToValueAtTime(0.055, audioCtx.currentTime + 2.5);
    var filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 720; filter.Q.value = 0.4;
    filter.connect(master); master.connect(audioCtx.destination);
    var oscs = [220, 261.63, 329.63, 440].map(function (f, i) {
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = i < 2 ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 7;
      g.gain.value = i < 2 ? 0.5 : 0.22;
      var lfo = audioCtx.createOscillator(), lg = audioCtx.createGain();
      lfo.frequency.value = 0.07 + i * 0.03; lg.gain.value = 0.12;
      lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(filter); o.start(); lfo.start();
      return { o: o, lfo: lfo };
    });
    padNodes = { master: master, oscs: oscs };
  }
  function stopPad() {
    if (!padNodes) return;
    var p = padNodes; padNodes = null;
    p.master.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);
    setTimeout(function () { p.oscs.forEach(function (x) { try { x.o.stop(); x.lfo.stop(); } catch (e) {} }); }, 1400);
  }
  toggle.addEventListener("click", function () {
    soundOn = !soundOn;
    toggle.setAttribute("aria-pressed", String(soundOn));
    toggle.setAttribute("aria-label", soundOn ? "Couper le son" : "Activer le son");
    if (soundOn) { startPad(); if (audioCtx.state === "suspended") audioCtx.resume(); }
    else stopPad();
  });
})();
