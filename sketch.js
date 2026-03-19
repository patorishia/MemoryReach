// ===============================
// UI STATE VARIABLES
// ===============================
let round = 1;
let startTime = 0;
let elapsedTime = 0;

// Gesture buttons
let btnStart = { x: 450, y: 430, w: 120, h: 40, label: "Start" };
let btnRepeat = { x: 320, y: 430, w: 120, h: 40, label: "Repeat" };
let btnStop = { x: 450, y: 430, w: 120, h: 40, label: "Stop" };

// ===============================
// SPEECH RECOGNITION
// ===============================
let recognition;


//for button activation delay
let lastActivation = 0;
let activationDelay = 800; // ms


// ===============================
// VIDEO + HANDPOSE
// ===============================
let video;
let handPose;
let predictions = [];
let fingerX = 0;
let fingerY = 0;

// ===============================
// GAME LOGIC
// ===============================
let circles = [];
let sequence = [];
let totalCircles = 3;
let minDist = 120;

let playerStep = 0;
let score = 0;

let gameState = "idle";
// idle, show, play, success, fail, pause

let showIndex = 0;
let showTimer = 0;
let showDelay = 60;

// ===============================
// SETUP
// ===============================
function setup() {
  createCanvas(640, 480);

  // Start webcam
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // Load Handpose model
  handPose = ml5.handpose(video, modelReady);
  handPose.on("predict", results => predictions = results);

  // Voice recognition only for starting the game
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = event => {
      let transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      lastVoiceCommand = transcript;

      if (gameState === "idle" && transcript.includes("start") && transcript.includes("game")) {
        startGame();
        recognition.stop(); // disable voice after starting
      }
    };

    recognition.start();
  }
}

function modelReady() {
  console.log("Handpose model loaded.");
}

// ===============================
// MAIN DRAW LOOP
// ===============================
function draw() {
  background(0);

  // Draw video without stretching (keeps hand detection accurate)
  if (gameState !== "idle") {
    image(video, 0, 0, video.width, video.height);
  }

  // State rendering
  if (gameState === "idle") drawStartScreen();
  if (gameState === "pause") drawPauseScreen();
  if (gameState === "success") drawSuccessScreen();
  if (gameState === "fail") drawFailScreen();
  if (gameState === "show") showSequence();

  if (gameState === "play") {
    updateFinger();
    drawCircles();
    checkTouch();
    elapsedTime = floor((millis() - startTime) / 1000);
  }

  drawBottomBar();
  drawFinger();

}

// ===============================
// INPUT HANDLING
// ===============================
function handleVoiceCommand(cmd) {
  if (gameState === "idle" && cmd.includes("start") && cmd.includes("game")) {
    startGame();
  }
  
}

// ===============================
// HAND TRACKING
// ===============================
function updateFinger() {
  if (predictions.length > 0) {
    let index = predictions[0].landmarks[8];
    fingerX = width - index[0];
    fingerY = index[1];
  }
}

function drawFinger() {
  fill(255, 0, 0);
  noStroke();
  circle(fingerX, fingerY, 20);
}

// ===============================
// GAME ELEMENTS
// ===============================
function createCircles() {
  circles = [];

  for (let i = 0; i < totalCircles; i++) {
    let valid = false;
    let x, y;

    while (!valid) {
      x = random(100, width - 100);
      y = random(100, height - 200); // prevents circles from entering bottom bar

      valid = true;
      for (let c of circles) {
        if (dist(x, y, c.x, c.y) < minDist) valid = false;
      }
    }

    circles.push({
      x: x,
      y: y,
      r: 40,
      color: [random(100, 255), random(100, 255), random(100, 255)],
      hit: false
    });
  }
}

function drawCircles() {
  for (let c of circles) {
    fill(c.hit ? [0, 255, 0] : c.color);
    noStroke();
    circle(c.x, c.y, c.r * 2);
  }
}

function generateSequence() {
  sequence = [];
  for (let i = 0; i < totalCircles; i++) sequence.push(i);
  shuffle(sequence, true);

  playerStep = 0;
  for (let c of circles) c.hit = false;
}

// ===============================
// GAMEPLAY LOGIC
// ===============================
function showSequence() {
  if (showIndex < sequence.length) {
    if (frameCount - showTimer < showDelay) {
      let c = circles[sequence[showIndex]];
      fill(c.color);
      noStroke();
      circle(c.x, c.y, c.r * 2);
    } else {
      showIndex++;
      showTimer = frameCount;
    }
  } else {
    showIndex = 0;
    gameState = "play";
  }
}

function checkTouch() {
  if (predictions.length === 0) return;

  let current = sequence[playerStep];
  let c = circles[current];
  let d = dist(fingerX, fingerY, c.x, c.y);

  // Correct circle
  if (d < c.r) {
    c.hit = true;
    playerStep++;

    if (playerStep >= sequence.length) {
      score++;
      gameState = "success";
      setTimeout(startNewRound, 1000);
    }
    return;
  }

  // Wrong circle
  for (let i = 0; i < circles.length; i++) {
    if (i === current || circles[i].hit) continue;

    let d2 = dist(fingerX, fingerY, circles[i].x, circles[i].y);
    if (d2 < circles[i].r) {
      gameState = "fail";
      setTimeout(startNewRound, 1500);
      return;
    }
  }
}

// ===============================
// UI SCREENS
// ===============================
function drawStartScreen() {
  background(0);
  fill(255);
  textAlign(CENTER, CENTER);

  textSize(48);
  text("MemoryReach", width / 2, height / 2 - 60);

  textSize(22);
  text('Say: "start game"', width / 2, height / 2);

}

function drawSuccessScreen() {
  fill(0, 200, 0, 150);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("Good job!", width / 2, height / 2);
}

function drawFailScreen() {
  background(200, 0, 0, 150);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("Wrong circle!", width / 2, height / 2);
}

function drawPauseScreen() {
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("Game Paused", width / 2, height / 2 - 40);

  textSize(20);
  text("Touch Start to continue", width / 2, height / 2 + 10);


}

// ===============================
// BOTTOM BAR UI
// ===============================
function drawBottomBar() {
  if (gameState === "idle") return;

  let barHeight = 150;
  let barY = height - barHeight;

  fill(0, 0, 0, 180);
  rect(0, barY, width, barHeight);

  fill(255);
  textSize(24);
  textAlign(CENTER, TOP);

  let spacing = width / 3;
  text("Score: " + score, spacing * 0.5, barY + 10);
  text("Round: " + round, spacing * 1.5, barY + 10);
  text("Time: " + elapsedTime + "s", spacing * 2.5, barY + 10);



  let buttonY = barY + 70;

  btnRepeat.x = width / 2 - 150;
  btnRepeat.y = buttonY;

  btnStart.x = width / 2 + 20;
  btnStart.y = buttonY;

  btnStop.x = width / 2 + 20;
  btnStop.y = buttonY;

  if (gameState === "show" || gameState === "play") {
    drawButton(btnRepeat);
    checkButtonHover(btnRepeat, "repeat");

    drawButton(btnStop);
    checkButtonHover(btnStop, "stop");
  }

  if (gameState === "pause" || gameState === "success" || gameState === "fail") {
    drawButton(btnRepeat);
    checkButtonHover(btnRepeat, "repeat");

    drawButton(btnStart);
    checkButtonHover(btnStart, "start");
  }

  if (gameState === "show") {
    textAlign(CENTER, TOP);
    textSize(28);
    fill(255);
    text("Memorize the sequence", width / 2, 20);
  }

  if (gameState === "play") {
    textAlign(CENTER, TOP);
    textSize(28);
    fill(255);
    text("Your turn", width / 2, 20);
  }



}

// ===============================
// BUTTONS
// ===============================
function drawButton(btn) {
  let hovering =
    fingerX > btn.x && fingerX < btn.x + btn.w &&
    fingerY > btn.y && fingerY < btn.y + btn.h;

  fill(hovering ? 200 : 255);
  rect(btn.x, btn.y, btn.w, btn.h, 10);

  fill(0);
  textAlign(CENTER, CENTER);
  textSize(18);
  text(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
}

function checkButtonHover(btn, action) {
  if (predictions.length === 0) return;

  let hovering =
    fingerX > btn.x && fingerX < btn.x + btn.w &&
    fingerY > btn.y && fingerY < btn.y + btn.h;

  if (hovering && millis() - lastActivation > activationDelay) {
    lastActivation = millis();

    if (action === "start") startGame();
    if (action === "repeat") repeatGame();
    if (action === "stop") stopGame();
  }
}

// ===============================
// GAME STATE CONTROL
// ===============================
function startGame() {
  if (recognition) recognition.stop();

  if (gameState === "pause") {
    startTime = millis() - elapsedTime * 1000;
    gameState = "play";
    return;
  }

  score = 0;
  round = 1;
  startTime = millis();

  createCircles();
  generateSequence();

  showIndex = 0;
  showTimer = frameCount;

  gameState = "show";
}

function repeatGame() {
  startTime = millis();
  playerStep = 0;

  for (let c of circles) c.hit = false;

  showIndex = 0;
  showTimer = frameCount;

  gameState = "show";
}

function stopGame() {
  gameState = "pause";
}

function startNewRound() {
  round++;
  playerStep = 0;

  createCircles();
  generateSequence();

  showIndex = 0;
  showTimer = frameCount;

  startTime = millis();
  gameState = "show";
}
