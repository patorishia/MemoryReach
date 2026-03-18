let video;
let handPose;
let predictions = []; // Store hand pose predictions
let fingerX = 0; // Track index finger position
let fingerY = 0; // Track index finger position

let circles = []; // Store circle positions and colors
let sequence = []; // Store the order of circles to touch
let totalCircles = 3; // Number of circles in the game


let minDist = 120;// Minimum distance between circles

let playerStep = 0; // Track player's progress in the sequence
let score = 0;

let gameState = "idle"; // "idle", "show", "play"
let showIndex = 0; // Track which circle is currently being shown in the sequence
let showTimer = 0; // Timer to control how long each circle is shown
let showDelay = 60; // Frames to show each circle in the sequence

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  handPose = ml5.handpose(video, modelReady);

  handPose.on("predict", results => {
    predictions = results;
  });

  // Initialize circles and sequence
  createCircles();
  generateSequence();

  showTimer = frameCount;

}

function modelReady() {
  console.log("Model is ready!");
}

function draw() {
  background(0);

  
  if (gameState !== "idle") {
    image(video, 0, 0, width, height);
  }

  drawUI();

  if (gameState === "idle") {
    drawStartScreen();
    return;
  }

  if (gameState === "success") {
    drawSuccessScreen(); 
    return;
  }

  if (gameState === "fail") {
    drawFailScreen(); 
    return;
  }

  if (gameState === "show") {
    showSequence();
    return;
  }

  if (gameState === "play") {
    updateFinger();
    drawFinger();
    drawCircles();
    checkTouch();
    return;
  }
}



// Update the index finger position based on hand pose predictions
function updateFinger() {
  if (predictions.length > 0) {
    let index = predictions[0].landmarks[8];
    fingerX = width - index[0];
    fingerY = index[1];
  }
}

// Draw a red circle at the index finger position
function drawFinger() {
  fill(255, 0, 0);
  noStroke();
  circle(fingerX, fingerY, 20);
}

// Create circles at random positions, ensuring they are not too close to each other
function createCircles() {

  circles = [];

  for (let i = 0; i < totalCircles; i++) {

    let valid = false;
    let x, y;

    while (!valid) {

      x = random(100, width - 100);
      y = random(100, height - 100);

      valid = true;

      for (let c of circles) {
        if (dist(x, y, c.x, c.y) < minDist) {
          valid = false;
        }
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

// Draw circles on the screen, highlighting those that have been correctly touched
function drawCircles() {

  for (let c of circles) {

    if (c.hit) {
      fill(0, 255, 0);
    } else {
      fill(c.color);
    }

    noStroke();
    circle(c.x, c.y, c.r * 2);
  }
}

// Generate a random sequence of circle indices for the player to follow
function generateSequence() {

  sequence = [];

  // Create a sequence of circle indices
  for (let i = 0; i < totalCircles; i++) {
    sequence.push(i);
  }

  shuffle(sequence, true);

  // Reset player progress
  playerStep = 0;

  // Reset hit status of circles
  for (let c of circles) {
    c.hit = false;
  }
}

// Show the sequence of circles to the player by highlighting them one by one
function showSequence() {


  if (showIndex < sequence.length) {

    // Show current circle in the sequence
    if (frameCount - showTimer < showDelay) {

      let c = circles[sequence[showIndex]];

      fill(c.color);
      noStroke();
      circle(c.x, c.y, c.r * 2);

    } else {

      // Move to the next circle in the sequence
      showIndex++;
      showTimer = frameCount;
    }

  } else {

    // Sequence has been shown, start the game
    showIndex = 0;
    gameState = "play";
  }
}



// Check if the player is touching the correct circle in the sequence
function checkTouch() {

  if (predictions.length == 0) return;

  let current = sequence[playerStep];
  let c = circles[current];

  let d = dist(fingerX, fingerY, c.x, c.y);

  // Player touched the correct circle
  if (d < c.r) {

    c.hit = true;
    playerStep++;
    score++;

    if (playerStep >= sequence.length) {
      gameState = "success";
      setTimeout(startNewRound, 1000);
    }

    return; //  Don't check other circles if the correct one is touched
  }

  //  Player touched the wrong circle, check if they are touching any other circle
  for (let i = 0; i < circles.length; i++) {
    if (i === current) continue;
    if (circles[i].hit) continue; // <--- Don't check circles that have already been hit 
    let d2 = dist(fingerX, fingerY, circles[i].x, circles[i].y);

    // If player is touching a wrong circle, end the game
    if (d2 < circles[i].r) {
      gameState = "fail";
      setTimeout(startNewRound, 1500);
      return;
    }
  }
}



// Draw score and game state on the screen
function drawUI() {
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);

  textAlign(RIGHT, TOP);
  text("State: " + gameState, width - 20, 20);
}

// Show start screen with game title and instructions
function drawStartScreen() {
  background(0);
  fill(255);
  textAlign(CENTER, CENTER);

  textSize(48);
  text("MemoryReach", width / 2, height / 2 - 60);

  textSize(22);
  text("Touch the circles in the correct order", width / 2, height / 2);

  textSize(18);
  text("Press SPACE to start", width / 2, height / 2 + 60);
}

// Show success screen
function drawSuccessScreen() {
  fill(0, 200, 0, 150);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("Good job!", width / 2, height / 2);
}


// Show fail screen when player touches the wrong circle
function drawFailScreen() {
  background(200, 0, 0, 150); // Semi-transparent red overlay

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("Wrong circle!", width/2, height/2);
}


// Start a new round by resetting variables and generating new circles and sequence
function startNewRound() {
  playerStep = 0;
  createCircles();
  generateSequence();
  showTimer = frameCount;
  gameState = "show";
}

// Handle spacebar to start the game
function keyPressed() {
  if (gameState === "idle" && key === " ") {
    score = 0;
    generateSequence();
    showTimer = frameCount;
    gameState = "show";
  }
}

function highlightCircle(index) {
  let c = circles[index];
  stroke(255);
  strokeWeight(6);
  noFill();
  circle(c.x, c.y, c.r * 2 + 20);
}

