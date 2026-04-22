/**
 * Навигация между экранами + анимации появления/ухода.
 * Telegram WebApp: разворачиваем на весь экран, если доступно.
 */
(function () {
  var tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    try {
      tg.expand();
    } catch (e) {
      /* ignore */
    }
  }

  function render(screenFn) {
    var app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = "";
    if (typeof screenFn !== "function") return;
    screenFn();
    var newScreen = document.querySelector(".screen");
    if (newScreen) {
      requestAnimationFrame(function () {
        newScreen.classList.add("fade-in");
      });
    }
  }

  window.navigate = function (screenFn) {
    var app = document.getElementById("app");
    if (!app) return;
    var oldScreen = document.querySelector(".screen");
    if (oldScreen) {
      oldScreen.classList.add("fade-out");
      window.setTimeout(function () {
        render(screenFn);
      }, 200);
    } else {
      render(screenFn);
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    navigate(WelcomeScreen);
  });
})();
