let video;
let handPose;
let predictions = [];
let fingerX = 0;
let fingerY = 0;

let circles = [];
let sequence = [];
let totalCircles = 3;


let minDist = 120;

let playerStep = 0;
let score = 0;



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
}

function modelReady() {
  console.log("Model is ready!");
}

function draw() {
  // Draw the video feed
  image(video, 0, 0);

  updateFinger();
  drawFinger();

  drawCircles();

  checkTouch();


}

function updateFinger(){
  if(predictions.length>0){
    let index = predictions[0].landmarks[8];
    fingerX = width - index[0];
    fingerY = index[1];
  }
}

function drawFinger(){
  fill(255,0,0);
  noStroke();
  circle(fingerX,fingerY,20);
}

function createCircles(){

  circles=[];

  for(let i=0;i<totalCircles;i++){

    let valid=false;
    let x,y;

    while(!valid){

      x=random(100,width-100);
      y=random(100,height-100);

      valid=true;

      for(let c of circles){
        if(dist(x,y,c.x,c.y)<minDist){
          valid=false;
        }
      }
    }

    circles.push({
      x:x,
      y:y,
      r:40,
      color:[random(100,255),random(100,255),random(100,255)],
      hit:false
    });
  }
}

function drawCircles(){

  for(let c of circles){

    if(c.hit){
      fill(0,255,0);
    }else{
      fill(c.color);
    }

    noStroke();
    circle(c.x,c.y,c.r*2);
  }
}

function generateSequence(){

  sequence=[];

  for(let i=0;i<totalCircles;i++){
    sequence.push(i);
  }

  shuffle(sequence,true);

  playerStep=0;

  for(let c of circles){
    c.hit=false;
  }

}



function checkTouch(){

  if(predictions.length==0) return;

  let current = sequence[playerStep];
  let c = circles[current];

  let d = dist(fingerX,fingerY,c.x,c.y);

  if(d < c.r){

    c.hit=true;
    playerStep++;
    score++;

    if(playerStep >= sequence.length){

      createCircles();
      generateSequence();
    }
  }
}



