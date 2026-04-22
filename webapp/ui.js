/**
 * Экраны: каждая функция рисует один .screen внутри #app.
 * Вызываются через navigate(ИмяФункции) из app.js.
 */
/* global GameState, navigate, progressPercent, answerSharp, answerFocus, sendLead, sendResultLater */

function renderHUD() {
  var pct = typeof progressPercent === "function" ? progressPercent() : 25;
  return (
    '<div class="progress">' +
    '<div class="progress-bar" style="width:' +
    pct +
    '%"></div>' +
    "</div>" +
    '<p class="hud-meta">Шаг ' +
    GameState.round +
    " из " +
    GameState.totalRounds +
    "</p>"
  );
}

function WelcomeScreen() {
  var app = document.getElementById("app");
  app.innerHTML =
    '<div class="screen">' +
    "<h1>👁️ EyeQuest</h1>" +
    '<p class="tagline">Проверь зрение за минуту — в игровой форме</p>' +
    '<p class="doctor">Офтальмолог <strong>Алина Рустемовна</strong></p>' +
    '<div class="card">' +
    "<p>Короткий квест в Telegram или браузере. Крупные кнопки — удобно с телефона.</p>" +
    '<button type="button" class="primary" onclick="navigate(Onboarding1Screen)">Начать</button>' +
    "</div>" +
    '<p class="footer-note">Демо-вёрстка по вашей структуре webapp/</p>' +
    "</div>";
}

function Onboarding1Screen() {
  var app = document.getElementById("app");
  app.innerHTML =
    '<div class="screen">' +
    "<h2>Дисклеймер</h2>" +
    '<div class="card">' +
    "<p>Это <strong>не</strong> медицинская диагностика и не замена приёма врача.</p>" +
    '<button type="button" class="primary" onclick="navigate(Onboarding2Screen)">Понятно, далее</button>' +
    "</div>" +
    "</div>";
}

function Onboarding2Screen() {
  var app = document.getElementById("app");
  app.innerHTML =
    '<div class="screen">' +
    "<h2>Почти всё</h2>" +
    '<div class="card">' +
    "<p>Займёт меньше минуты: запомни буквы и ответь на пару вопросов.</p>" +
    '<button type="button" class="primary" onclick="startGame()">Поехали</button>' +
    "</div>" +
    "</div>";
}

/** Раунд 1: показать строку, затем вопрос */
function sharpMemorizeScreen() {
  var app = document.getElementById("app");
  GameState.round = 1;
  var word = GameState.memoryWord;
  app.innerHTML =
    '<div class="screen">' +
    renderHUD() +
    '<div class="card">' +
    "<h3>Запомни порядок букв</h3>" +
    '<div class="letters-display" aria-live="polite">' +
    word +
    "</div>" +
    "</div>" +
    "</div>";

  window.setTimeout(function () {
    navigate(sharpQuestionScreen);
  }, 1200);
}

function sharpQuestionScreen() {
  var app = document.getElementById("app");
  GameState.round = 2;
  var word = GameState.memoryWord;
  var wrong = word.split("").reverse().join("");
  if (wrong === word) {
    wrong = word.slice(1) + word.charAt(0);
  }
  var buttons =
    '<button type="button" class="primary" onclick="answerSharp(true)">«' +
    word +
    "»</button>" +
    '<button type="button" class="secondary" onclick="answerSharp(false)">«' +
    wrong +
    "»</button>";

  app.innerHTML =
    '<div class="screen">' +
    renderHUD() +
    '<div class="card">' +
    "<h3>Что было на экране?</h3>" +
    "<p>Выбери правильную последовательность.</p>" +
    buttons +
    "</div>" +
    "</div>";
}

/** Раунд 2: простой «фокус» — для демо HUD 50% → 100% */
function focusTapScreen() {
  var app = document.getElementById("app");
  GameState.round = 3;
  app.innerHTML =
    '<div class="screen">' +
    renderHUD() +
    '<div class="card">' +
    "<h3>Фокус</h3>" +
    "<p>Нажми кнопку «Цель», а не «Ловушка».</p>" +
    '<button type="button" class="secondary" onclick="answerFocus(false)">Ловушка</button>' +
    '<button type="button" class="primary" onclick="answerFocus(true)">Цель</button>' +
    "</div>" +
    "</div>";
}

function showResultScreen() {
  var app = document.getElementById("app");
  var ok = GameState.skills.sharp + GameState.skills.focus >= 1;
  var emoji = ok ? "🟢" : "🟡";
  var title = ok ? "Хорошая реакция" : "Есть нюансы";

  app.innerHTML =
    '<div class="screen">' +
    '<p class="result-badge" aria-hidden="true">' +
    emoji +
    "</p>" +
    "<h2>" +
    title +
    "</h2>" +
    '<div class="card">' +
    '<p class="skills-line">👁️ Острота памяти: ' +
    GameState.skills.sharp +
    "/1<br>" +
    "🎯 Фокус: " +
    GameState.skills.focus +
    "/1</p>" +
    "</div>" +
    '<button type="button" class="primary" onclick="navigate(showInsightScreen)">Понять результат</button>' +
    "</div>";
}

function showInsightScreen() {
  var app = document.getElementById("app");
  app.innerHTML =
    '<div class="screen">' +
    "<h2>Что дальше</h2>" +
    '<div class="card">' +
    "<p>Такие результаты в быстрой игре часто связаны с усталостью и нагрузкой на глаза. Точная оценка — на оборудовании у офтальмолога.</p>" +
    "</div>" +
    '<div class="card">' +
    "<p><b>Проверка за 30 минут</b><br />Без суеты и с рекомендациями врача.</p>" +
    "</div>" +
    '<button type="button" class="primary" onclick="sendLead()">📅 Записаться к Алине Рустемовне</button>' +
    '<button type="button" class="secondary" onclick="sendResultLater()">Позже</button>' +
    '<p class="footer-note">В Telegram-режиме «Позже» может закрыть WebApp.</p>' +
    "</div>";
}
