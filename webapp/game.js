/**
 * Состояние и логика мини-игр (без разметки экранов).
 * Экраны живут в ui.js, навигация в app.js.
 */
var GameState = {
  round: 1,
  totalRounds: 4,
  skills: {
    sharp: 0,
    focus: 0,
  },
  /** запомнить для раунда «острота» */
  memoryWord: "ШБМКН",
};

function resetGameState() {
  GameState.round = 1;
  GameState.skills.sharp = 0;
  GameState.skills.focus = 0;
  GameState.memoryWord = ["ШБМКН", "ОКЗРЧ", "АИУЕЯ"][Math.floor(Math.random() * 3)];
}

function startGame() {
  resetGameState();
  if (typeof navigate === "function") {
    navigate(sharpMemorizeScreen);
  }
}

function progressPercent() {
  return Math.min(100, Math.round((GameState.round / GameState.totalRounds) * 100));
}

function answerSharp(correct) {
  GameState.skills.sharp = correct ? 1 : 0;
  if (typeof navigate === "function") {
    navigate(focusTapScreen);
  }
}

function answerFocus(correct) {
  GameState.skills.focus = correct ? 1 : 0;
  GameState.round = GameState.totalRounds;
  if (typeof navigate === "function") {
    navigate(showResultScreen);
  }
}

/** Заглушки действий с кнопок финала */
function sendLead() {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.showAlert("Здесь — ссылка на запись или отправка заявки в бот.");
  } else {
    window.alert("Здесь откроется форма записи к офтальмологу.");
  }
}

function sendResultLater() {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.close();
  } else {
    if (typeof navigate === "function") {
      navigate(WelcomeScreen);
    }
  }
}
