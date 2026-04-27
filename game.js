(function () {
  "use strict";

  var CONFIG = {
    bookUrl: "#запись",
    phone: "tel:+70000000000",
  };

  var SOUND_KEY = "eyequest-sound-on";

  var DIRECTIONS = [
    { id: "up", arrow: "↑", deg: 0 },
    { id: "right", arrow: "→", deg: 90 },
    { id: "down", arrow: "↓", deg: 180 },
    { id: "left", arrow: "←", deg: 270 },
  ];

  var PHASES = [];

  var PAIRS_KIDS = [
    ["🍎", "🍊"],
    ["🐶", "🐱"],
    ["⭐", "✨"],
  ];

  /** Буквы для «таблицы» взрослым (кириллица, без латиницы) */
  var CHART_POOL = "ШБМНКЗОИЕПВДРЯЧГХЮЦФЩЪЫЭЙ".split("");

  var MICRO_WORDS = ["ЗРЕНИЕ", "СВЕТ", "ЭКРАН", "ФОКУС", "БУКВЫ", "ОКНО"];

  var PHASE_ICON = {
    rocket: "🚀",
    stars: "⭐",
    microtext: "🔤",
    chart: "АБ",
    odd: "🔍",
    color: "🎨",
  };

  var state = {
    phaseIndex: 0,
    roundInPhase: 0,
    score: 0,
    isKids: true,
    soundOn: false,
    answerId: null,
    colorAnswerIndex: null,
    microWord: "",
  };

  var audioCtx = null;
  var musicMasterGain = null;

  /** Спокойная пентатоническая мелодия (до-мажор), частота Гц / длительность мс */
  var MUSIC_PATTERN = [
    { f: 523.25, d: 950 },
    { f: 659.25, d: 950 },
    { f: 587.33, d: 950 },
    { f: 392.0, d: 1200 },
    { f: 440.0, d: 950 },
    { f: 523.25, d: 950 },
    { f: 587.33, d: 950 },
    { f: 659.25, d: 1400 },
    { f: 392.0, d: 950 },
    { f: 440.0, d: 950 },
    { f: 392.0, d: 950 },
    { f: 329.63, d: 1700 }
  ];

  var music = {
    active: false,
    timeoutId: null,
    patternIndex: 0
  };

  var el = {
    app: document.getElementById("app-root"),
    welcome: document.getElementById("screen-welcome"),
    game: document.getElementById("screen-game"),
    result: document.getElementById("screen-result"),
    btnKids: document.getElementById("btn-kids"),
    btnAdult: document.getElementById("btn-adult"),
    btnReplay: document.getElementById("btn-replay"),
    btnSound: document.getElementById("btn-sound"),
    btnBack: document.getElementById("btn-back"),
    progressFill: document.getElementById("progress-fill"),
    progressLabel: document.getElementById("progress-label"),
    levelTitle: document.getElementById("game-level-title"),
    hint: document.getElementById("game-hint"),
    body: document.getElementById("game-body"),
    actions: document.getElementById("game-actions"),
    resultBadge: document.getElementById("result-badge"),
    resultHeading: document.getElementById("result-heading"),
    resultStars: document.getElementById("result-stars"),
    resultTier: document.getElementById("result-tier"),
    resultText: document.getElementById("result-text"),
    ctaBook: document.getElementById("cta-book"),
    ctaTel: document.getElementById("cta-tel"),
  };

  function ensureAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    return audioCtx;
  }

  function playClick() {
    if (!state.soundOn) return;
    var ctx = ensureAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 920;
    o.connect(g);
    g.connect(ctx.destination);
    var t0 = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
    o.start(t0);
    o.stop(t0 + 0.075);
  }

  function ensureMusicBus() {
    if (!audioCtx) return null;
    if (!musicMasterGain) {
      musicMasterGain = audioCtx.createGain();
      musicMasterGain.gain.value = 0.55;
      musicMasterGain.connect(audioCtx.destination);
    }
    return musicMasterGain;
  }

  function playMusicNote(freq) {
    var ctx = audioCtx;
    var bus = ensureMusicBus();
    if (!ctx || !bus) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    o.connect(g);
    g.connect(bus);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.start(t);
    o.stop(t + 1.7);

    var oh = ctx.createOscillator();
    var gh = ctx.createGain();
    oh.type = "sine";
    oh.frequency.value = freq * 2;
    oh.connect(gh);
    gh.connect(bus);
    gh.gain.setValueAtTime(0.0001, t);
    gh.gain.exponentialRampToValueAtTime(0.012, t + 0.4);
    gh.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    oh.start(t);
    oh.stop(t + 1.5);
  }

  function scheduleNextMusicNote() {
    if (!music.active || !state.soundOn) return;
    var step = MUSIC_PATTERN[music.patternIndex % MUSIC_PATTERN.length];
    music.patternIndex++;
    playMusicNote(step.f);
    music.timeoutId = setTimeout(scheduleNextMusicNote, step.d);
  }

  function startMusic() {
    if (!state.soundOn) return;
    var ctx = ensureAudio();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    if (music.active) return;
    music.active = true;
    music.patternIndex = 0;
    if (musicMasterGain) {
      var t = ctx.currentTime;
      musicMasterGain.gain.cancelScheduledValues(t);
      musicMasterGain.gain.setValueAtTime(0.0001, t);
      musicMasterGain.gain.exponentialRampToValueAtTime(0.55, t + 1.2);
    }
    scheduleNextMusicNote();
  }

  function stopMusic() {
    music.active = false;
    if (music.timeoutId) {
      clearTimeout(music.timeoutId);
      music.timeoutId = null;
    }
    if (audioCtx && musicMasterGain) {
      var t = audioCtx.currentTime;
      musicMasterGain.gain.cancelScheduledValues(t);
      musicMasterGain.gain.setValueAtTime(musicMasterGain.gain.value, t);
      musicMasterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    }
  }

  function loadSoundPref() {
    try {
      state.soundOn = window.localStorage.getItem(SOUND_KEY) === "1";
    } catch (e) {
      state.soundOn = false;
    }
    updateSoundBtn();
  }

  function updateSoundBtn() {
    if (!el.btnSound) return;
    el.btnSound.textContent = state.soundOn ? "🔊" : "🔇";
    el.btnSound.setAttribute("aria-pressed", state.soundOn ? "true" : "false");
    el.btnSound.setAttribute("title", state.soundOn ? "Звук и музыка включены" : "Включить звук и музыку");
  }

  function buildPhases() {
    if (state.isKids) {
      PHASES = [
        { id: "rocket", rounds: 6 },
        { id: "stars", rounds: 3 },
        { id: "odd", rounds: 3 },
        { id: "color", rounds: 2 },
      ];
    } else {
      PHASES = [
        { id: "rocket", rounds: 6 },
        { id: "microtext", rounds: 3 },
        { id: "chart", rounds: 4 },
        { id: "color", rounds: 2 },
      ];
    }
  }

  function showScreen(name) {
    el.welcome.hidden = name !== "welcome";
    el.game.hidden = name !== "game";
    el.result.hidden = name !== "result";
    el.welcome.classList.toggle("screen--active", name === "welcome");
  }

  function totalRounds() {
    return PHASES.reduce(function (s, p) {
      return s + p.rounds;
    }, 0);
  }

  function setProgress() {
    var max = totalRounds();
    var done = 0;
    for (var i = 0; i < state.phaseIndex; i++) {
      done += PHASES[i].rounds;
    }
    done += state.roundInPhase;
    el.progressFill.style.width = Math.round((done / max) * 100) + "%";
    var id = PHASES[state.phaseIndex].id;
    var ico = PHASE_ICON[id] || "·";
    el.progressLabel.textContent = ico + " " + (state.roundInPhase + 1) + "/" + PHASES[state.phaseIndex].rounds;
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function copyForPhase() {
    var id = PHASES[state.phaseIndex].id;
    var k = state.isKids;
    if (id === "stars") {
      return { title: "⭐", hint: k ? "Самая яркая звезда" : "Самая контрастная" };
    }
    if (id === "microtext") {
      return { title: "🔤", hint: "Три строки — одно слово. Какое?" };
    }
    if (id === "rocket") {
      return {
        title: k ? "🚀" : "C",
        hint: k ? "Куда нос ракеты? Стрелка." : "Куда зазор у C? Стрелка.",
      };
    }
    if (id === "chart") {
      return {
        title: "АБ",
        hint: "Можно без очков. Все строки одинаковые — кроме одной. Нажми строку с другой буквой.",
      };
    }
    if (id === "odd") {
      return {
        title: "🔍",
        hint: "Один другой — нажми его",
      };
    }
    return {
      title: "🎨",
      hint: k ? "Такой же цвет, как круг сверху" : "Тот же оттенок, что эталон",
    };
  }

  function phaseStars() {
    var copy = copyForPhase();
    el.levelTitle.textContent = copy.title;
    el.hint.textContent = copy.hint;
    el.body.className = "game__body";
    el.body.innerHTML = "";
    var sky = document.createElement("p");
    sky.style.margin = "0";
    sky.style.fontSize = "2.2rem";
    sky.style.opacity = "0.35";
    sky.setAttribute("aria-hidden", "true");
    sky.textContent = "✨";
    el.body.appendChild(sky);

    var dim = state.isKids ? 0.24 : 0.34;
    var brightIdx = randomInt(0, 5);
    state.answerId = "star-" + brightIdx;

    el.actions.innerHTML = "";
    el.actions.className = "game__actions game__actions--stars";
    for (var i = 0; i < 6; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn--star";
      b.textContent = "⭐";
      b.setAttribute("aria-label", "Звезда");
      var isBright = i === brightIdx;
      b.style.opacity = isBright ? "1" : String(dim);
      b.style.filter = isBright ? "drop-shadow(0 0 14px rgba(255,214,102,0.9))" : "grayscale(0.35) brightness(0.82)";
      b.style.transform = isBright ? "scale(1.08)" : "scale(1)";
      (function (idx) {
        b.addEventListener("click", function () {
          onStarPick(idx === brightIdx);
        });
      })(i);
      el.actions.appendChild(b);
    }
  }

  function onStarPick(ok) {
    if (ok) state.score++;
    showFeedback(ok, nextRound);
  }

  /** Взрослые: мелкий текст 3 строки + выбор слова */
  function phaseMicrotext() {
    var copy = copyForPhase();
    el.levelTitle.textContent = copy.title;
    el.hint.textContent = copy.hint;

    var w = MICRO_WORDS[state.roundInPhase % MICRO_WORDS.length];
    state.microWord = w;

    el.body.className = "game__body";
    el.body.innerHTML = "";
    var block = document.createElement("div");
    block.className = "microtext-block";
    for (var line = 0; line < 3; line++) {
      var row = document.createElement("div");
      row.className = "microtext-line microtext-line--" + line;
      row.textContent = w;
      block.appendChild(row);
    }
    el.body.appendChild(block);

    var pool = MICRO_WORDS.filter(function (x) {
      return x !== w;
    });
    shuffle(pool);
    var wrong1 = pool[0] || "ЧИТАТЬ";
    var wrong2 = pool[1] || "СВЕТ";
    var opts = shuffle([w, wrong1, wrong2]);

    el.actions.innerHTML = "";
    el.actions.className = "game__actions game__actions--col";
    for (var j = 0; j < opts.length; j++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn--micro";
      b.textContent = opts[j];
      (function (word) {
        b.addEventListener("click", function () {
          var ok = word === w;
          if (ok) state.score++;
          showFeedback(ok, nextRound);
        });
      })(opts[j]);
      el.actions.appendChild(b);
    }
  }

  function appendArrowCheatsheet(container) {
    var sheet = document.createElement("div");
    sheet.className = "arrow-cheatsheet";
    sheet.setAttribute("aria-hidden", "true");
    DIRECTIONS.forEach(function (d) {
      var s = document.createElement("span");
      s.textContent = d.arrow;
      sheet.appendChild(s);
    });
    container.appendChild(sheet);
  }

  function phaseRocket() {
    var copy = copyForPhase();
    el.levelTitle.textContent = copy.title;
    el.hint.textContent = copy.hint;
    var gap = DIRECTIONS[randomInt(0, DIRECTIONS.length - 1)];
    state.answerId = gap.id;

    var sizesKids = [5.8, 5.1, 4.4, 3.7, 3.1, 2.7].map(function (v) {
      return v + "rem";
    });
    var sizesAdult = [4.2, 3.4, 2.75, 2.2, 1.75, 1.45].map(function (v) {
      return v + "rem";
    });
    var sizes = state.isKids ? sizesKids : sizesAdult;
    var idx = Math.min(state.roundInPhase, sizes.length - 1);
    var fontSize = sizes[idx];

    el.body.className = "game__body";
    el.body.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = state.isKids ? "rocket-bay" : "rocket-wrap";

    var r = document.createElement("span");
    if (state.isKids) {
      var floater = document.createElement("span");
      floater.className = "rocket-floater";
      r.className = "rocket";
      r.textContent = "🚀";
      r.style.fontSize = fontSize;
      r.style.transform = "rotate(" + gap.deg + "deg)";
      r.setAttribute("role", "img");
      r.setAttribute("aria-label", "Ракета");
      floater.appendChild(r);
      wrap.appendChild(floater);
    } else {
      r.className = "rocket rocket--landolt";
      r.textContent = "C";
      r.style.fontSize = fontSize;
      r.style.transform = "rotate(" + gap.deg + "deg)";
      r.setAttribute("role", "img");
      r.setAttribute("aria-label", "Кольцо C");
      wrap.appendChild(r);
    }

    if (state.isKids) {
      var pad = document.createElement("span");
      pad.className = "rocket-bay__pad";
      pad.setAttribute("aria-hidden", "true");
      wrap.appendChild(pad);
    }

    el.body.appendChild(wrap);

    el.actions.innerHTML = "";
    el.actions.className = "game__actions game__actions--col";
    appendArrowCheatsheet(el.actions);

    var grid = document.createElement("div");
    grid.className = "game__actions--grid-2";
    DIRECTIONS.forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn--dir";
      b.setAttribute("aria-label", d.id);
      b.textContent = d.arrow;
      b.addEventListener("click", function () {
        var ok = d.id === state.answerId;
        if (ok) state.score++;
        showFeedback(ok, nextRound);
      });
      grid.appendChild(b);
    });
    el.actions.appendChild(grid);
  }

  function randomChartLine(len) {
    var s = "";
    for (var i = 0; i < len; i++) {
      s += CHART_POOL[randomInt(0, CHART_POOL.length - 1)];
    }
    return s;
  }

  /** Взрослые: мини-таблица как у окулиста — от крупного к очень мелкому */
  function phaseChart() {
    var copy = copyForPhase();
    el.levelTitle.textContent = copy.title;
    el.hint.textContent = copy.hint;

    var lineLen = 7;
    var base = randomChartLine(lineLen);
    var badRow = randomInt(0, 4);
    var badPos = randomInt(0, lineLen - 1);
    var orig = base.charAt(badPos);
    var candidates = CHART_POOL.filter(function (c) {
      return c !== orig;
    });
    var wrong =
      candidates.length > 0 ? candidates[randomInt(0, candidates.length - 1)] : "Х";

    el.body.innerHTML = "";
    el.body.className = "game__body game__body--snellen";

    var chart = document.createElement("div");
    chart.className = "vision-chart";

    for (var r = 0; r < 5; r++) {
      var rowText = r === badRow ? base.slice(0, badPos) + wrong + base.slice(badPos + 1) : base;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vision-chart__row vision-chart__row--" + r;
      btn.setAttribute("aria-label", "Строка " + (r + 1));
      var inner = document.createElement("span");
      inner.className = "vision-chart__letters";
      inner.textContent = rowText.split("").join(" ");
      btn.appendChild(inner);
      (function (rowIndex) {
        btn.addEventListener("click", function () {
          var ok = rowIndex === badRow;
          if (ok) state.score++;
          showFeedback(ok, nextRound);
        });
      })(r);
      chart.appendChild(btn);
    }

    el.body.appendChild(chart);

    el.actions.innerHTML = "";
    el.actions.className = "game__actions";
  }

  function phaseOdd() {
    var copy = copyForPhase();
    el.levelTitle.textContent = copy.title;
    el.hint.textContent = copy.hint;

    el.body.className = "game__body";
    var pairs = PAIRS_KIDS;
    var pr = pairs[state.roundInPhase % pairs.length];
    var common = pr[0];
    var odd = pr[1];
    if (Math.random() < 0.5) {
      var t = common;
      common = odd;
      odd = t;
    }
    var oddIdx = randomInt(0, 5);
    state.answerId = oddIdx;

    el.body.innerHTML = "";
    var hintIcon = document.createElement("div");
    hintIcon.className = "odd-hint";
    hintIcon.setAttribute("aria-hidden", "true");
    hintIcon.textContent = "👆";
    el.body.appendChild(hintIcon);

    el.actions.innerHTML = "";
    el.actions.className = "game__actions game__actions--emoji";
    for (var i = 0; i < 6; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn--emoji-cell";
      b.textContent = i === oddIdx ? odd : common;
      b.setAttribute("aria-label", "Клетка");
      (function (idx) {
        b.addEventListener("click", function () {
          var ok = idx === oddIdx;
          if (ok) state.score++;
          showFeedback(ok, nextRound);
        });
      })(i);
      el.actions.appendChild(b);
    }
  }

  function phaseColor() {
    var copy = copyForPhase();
    el.levelTitle.textContent = copy.title;
    el.hint.textContent = copy.hint;

    var h = randomInt(0, 359);
    var s = randomInt(62, 88);
    var l = randomInt(44, 58);
    var ref = "hsl(" + h + ", " + s + "%, " + l + "%)";

    var dh = state.isKids ? randomInt(22, 34) : randomInt(7, 14);
    var c0 = "hsl(" + ((h + dh) % 360) + ", " + s + "%, " + l + "%)";
    var c1 = "hsl(" + ((h - dh + 360) % 360) + ", " + s + "%, " + l + "%)";
    var c2 = ref;

    var choices = shuffle([{ bg: c0 }, { bg: c1 }, { bg: c2 }]);
    var correctIndex = -1;
    for (var i = 0; i < choices.length; i++) {
      if (choices[i].bg === ref) correctIndex = i;
    }
    state.colorAnswerIndex = correctIndex;

    el.body.className = "game__body";
    el.body.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.className = "ref-color-wrap";
    var cap = document.createElement("p");
    cap.textContent = state.isKids ? "Образец:" : "Эталон:";
    var circle = document.createElement("div");
    circle.className = "ref-color";
    circle.style.background = ref;
    wrap.appendChild(cap);
    wrap.appendChild(circle);
    el.body.appendChild(wrap);

    el.actions.innerHTML = "";
    el.actions.className = "game__actions game__actions--colors";
    for (var j = 0; j < choices.length; j++) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--color btn--xl";
      btn.style.background = choices[j].bg;
      btn.setAttribute("aria-label", "Цвет");
      (function (idx) {
        btn.addEventListener("click", function () {
          var ok = idx === state.colorAnswerIndex;
          if (ok) state.score++;
          showFeedback(ok, nextRound);
        });
      })(j);
      el.actions.appendChild(btn);
    }
  }

  function pickFeedback(ok) {
    if (ok) {
      return state.isKids
        ? ["Ура!", "Класс!", "Супер!", "Есть!"][randomInt(0, 3)]
        : ["Верно.", "Так.", "Ок.", "Точно."][randomInt(0, 3)];
    }
    return state.isKids
      ? ["Ещё разок.", "Почти.", "Ок, дальше."][randomInt(0, 2)]
      : ["Мимо.", "Сложно.", "Дальше."][randomInt(0, 2)];
  }

  function showFeedback(ok, then) {
    if (ok) {
      playClick();
    }
    el.actions.innerHTML = "";
    el.actions.className = "game__actions";
    var f = document.createElement("p");
    f.className = "feedback " + (ok ? "feedback--ok" : "feedback--bad");
    f.textContent = pickFeedback(ok);
    el.actions.appendChild(f);
    setTimeout(then, ok ? 520 : 720);
  }

  function renderPhase() {
    setProgress();
    var id = PHASES[state.phaseIndex].id;
    if (id === "stars") phaseStars();
    else if (id === "microtext") phaseMicrotext();
    else if (id === "rocket") phaseRocket();
    else if (id === "chart") phaseChart();
    else if (id === "odd") phaseOdd();
    else phaseColor();
  }

  function nextRound() {
    var p = PHASES[state.phaseIndex];
    state.roundInPhase++;
    if (state.roundInPhase >= p.rounds) {
      state.phaseIndex++;
      state.roundInPhase = 0;
      if (state.phaseIndex >= PHASES.length) {
        finishGame();
        return;
      }
    }
    renderPhase();
  }

  function finishGame() {
    el.progressFill.style.width = "100%";
    var max = totalRounds();
    var ratio = state.score / max;

    var stars;
    var badge;
    var tier;
    var body;

    if (ratio >= 0.85) {
      stars = "⭐⭐⭐";
      badge = "🏆";
      tier = state.isKids ? "Супер-пилот!" : "Отлично для экрана";
      body = state.isKids
        ? "Если в школе не видит доску — покажи врачу."
        : "Плановый осмотр раз в год — всё равно полезен.";
    } else if (ratio >= 0.55) {
      stars = "⭐⭐";
      badge = "🎖️";
      tier = state.isKids ? "Молодец!" : "Нормально";
      body = state.isKids ? "Отдохни от экрана и попробуй позже." : "Усталость и экран — частая причина промахов.";
    } else {
      stars = "⭐";
      badge = "💪";
      tier = state.isKids ? "Ничего страшного" : "Стоит проверить зрение";
      body = "Игра ≠ диагноз. Запись — если что-то беспокоит.";
    }

    el.resultBadge.textContent = badge;
    el.resultStars.textContent = stars;
    el.resultHeading.textContent = state.score + " / " + max;
    el.resultTier.textContent = tier;
    el.resultText.textContent = body;

    el.ctaBook.href = CONFIG.bookUrl;
    el.ctaTel.href = CONFIG.phone;

    stopMusic();
    showScreen("result");
  }

  function startGame(isKids) {
    state.isKids = !!isKids;
    buildPhases();
    loadSoundPref();
    el.app.classList.toggle("app--kids", state.isKids);
    el.app.classList.toggle("app--adult", !state.isKids);
    state.phaseIndex = 0;
    state.roundInPhase = 0;
    state.score = 0;
    el.progressFill.style.width = "0%";
    showScreen("game");
    renderPhase();
    if (state.soundOn) startMusic();
  }

  function backToWelcome() {
    stopMusic();
    el.app.classList.remove("app--kids", "app--adult");
    showScreen("welcome");
  }

  el.btnKids.addEventListener("click", function () {
    startGame(true);
  });
  el.btnAdult.addEventListener("click", function () {
    startGame(false);
  });
  el.btnReplay.addEventListener("click", function () {
    backToWelcome();
  });

  if (el.btnBack) {
    el.btnBack.addEventListener("click", function () {
      backToWelcome();
    });
  }

  if (el.btnSound) {
    el.btnSound.addEventListener("click", function () {
      state.soundOn = !state.soundOn;
      try {
        window.localStorage.setItem(SOUND_KEY, state.soundOn ? "1" : "0");
      } catch (e) {
        /* ignore */
      }
      updateSoundBtn();
      if (state.soundOn) {
        ensureAudio();
        playClick();
        if (!el.game.hidden) startMusic();
      } else {
        stopMusic();
      }
    });
  }

  loadSoundPref();
  el.ctaBook.href = CONFIG.bookUrl;
  el.ctaTel.href = CONFIG.phone;
})();
