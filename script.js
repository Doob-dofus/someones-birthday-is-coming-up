/* ═══ Pour Elé ═══ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─── Décompte → samedi 7 novembre 2026, 9h00 (Paris) ─── */
  var TARGET = new Date("2026-11-07T09:00:00+01:00").getTime();
  var cdD = document.getElementById("cd-d"),
      cdH = document.getElementById("cd-h"),
      cdM = document.getElementById("cd-m"),
      cdS = document.getElementById("cd-s");
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
    flash.classList.remove("on");
    void flash.offsetWidth; /* relance l'animation */
    flash.classList.add("on");
    shutterSound();
  }

  /* ─── Révélations au scroll (+ flash sur les photos) ─── */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("visible");
      if (e.target.classList.contains("flash-photo")) fireFlash();
      io.unobserve(e.target);
    });
  }, { threshold: 0.25 });
  document.querySelectorAll(".reveal, .flash-photo").forEach(function (el) { io.observe(el); });

  /* ─── Particules du hero ─── */
  var canvas = document.getElementById("particles");
  if (!REDUCED && canvas.getContext) {
    var ctx = canvas.getContext("2d"), W, H, parts = [];
    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    window.addEventListener("resize", resize);
    resize();
    var COLORS = ["201,182,228", "201,168,106", "140,106,79"];
    for (var i = 0; i < 42; i++) {
      parts.push({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.8 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 0.18,
        vy: -0.12 - Math.random() * 0.3,
        a: 0.15 + Math.random() * 0.45,
        c: COLORS[i % 3],
        ph: Math.random() * Math.PI * 2
      });
    }
    (function draw(t) {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
        if (p.x < -8) p.x = W + 8;
        if (p.x > W + 8) p.x = -8;
        var tw = 0.6 + 0.4 * Math.sin(t / 900 + p.ph);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + p.c + "," + (p.a * tw) + ")";
        ctx.fill();
      });
      requestAnimationFrame(draw);
    })(0);
  }

  /* ─── Ambiance sonore (WebAudio, aucun fichier) ─── */
  var audioCtx = null, padNodes = null, soundOn = false;
  var toggle = document.getElementById("sound-toggle");

  function startPad() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    var master = audioCtx.createGain();
    master.gain.value = 0;
    master.gain.linearRampToValueAtTime(0.055, audioCtx.currentTime + 2.5);
    var filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass"; filter.frequency.value = 720; filter.Q.value = 0.4;
    filter.connect(master); master.connect(audioCtx.destination);
    /* nappe douce : la - do - mi (La mineur) */
    var freqs = [220, 261.63, 329.63, 440];
    var oscs = freqs.map(function (f, i) {
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = i < 2 ? "sine" : "triangle";
      o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 7;
      g.gain.value = i < 2 ? 0.5 : 0.22;
      var lfo = audioCtx.createOscillator(), lg = audioCtx.createGain();
      lfo.frequency.value = 0.07 + i * 0.03; lg.gain.value = 0.12;
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(filter);
      o.start(); lfo.start();
      return { o: o, lfo: lfo };
    });
    padNodes = { master: master, oscs: oscs };
  }
  function stopPad() {
    if (!padNodes) return;
    var p = padNodes; padNodes = null;
    p.master.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);
    setTimeout(function () {
      p.oscs.forEach(function (x) { try { x.o.stop(); x.lfo.stop(); } catch (e) {} });
    }, 1400);
  }
  function shutterSound() {
    if (!soundOn || !audioCtx) return;
    var t = audioCtx.currentTime;
    var buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.08, audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2.2);
    var src = audioCtx.createBufferSource(); src.buffer = buf;
    var hp = audioCtx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1800;
    var g = audioCtx.createGain(); g.gain.value = 0.18;
    src.connect(hp); hp.connect(g); g.connect(audioCtx.destination);
    src.start(t);
  }
  toggle.addEventListener("click", function () {
    soundOn = !soundOn;
    toggle.setAttribute("aria-pressed", String(soundOn));
    toggle.setAttribute("aria-label", soundOn ? "Couper le son" : "Activer le son");
    if (soundOn) { if (audioCtx && audioCtx.state === "suspended") audioCtx.resume(); startPad(); }
    else stopPad();
  });
})();
