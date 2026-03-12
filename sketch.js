let video;
let handPose;
let predictions = [];
let fingerX = 0;
let fingerY = 0;



function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  handPose = ml5.handpose(video, modelReady);

  handPose.on("predict", results => {
    predictions = results;
  });
}

function modelReady() {
  console.log("Model is ready!");
}

function draw() {
  // Draw the video feed
  image(video, 0, 0);

  
  //update finger position based on predictions
  if (predictions.length > 0) {
    let indexFinger = predictions[0].landmarks[8]; // ponta do indicador
    fingerX = width - indexFinger[0]; // espelho
    fingerY = indexFinger[1];
  }

  //Draw Finger Tips
  fill(255, 0, 0);
  noStroke();
  circle(fingerX, fingerY, 20);
}

