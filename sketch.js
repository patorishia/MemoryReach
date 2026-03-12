let video;
let handPose;
let predictions = [];
let fingerX = 0;
let fingerY = 0;

let circles = [];
let sequence = [];
let totalCircles = 3;


let minDist = 120;



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


  //Draw circles and sequence
    for(let c of circles){
    fill(c.color);
    noStroke();
    circle(c.x,c.y,c.r*2);
  }


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
          break;
        }
      }
    }

   
    circles.push({
      x:x,
      y:y,
      r:40,
      color:[random(100,255),random(100,255),random(100,255)]
    });
  }
}

function generateSequence(){

  sequence=[];

  for(let i=0;i<totalCircles;i++){
    sequence.push(i);
  }

  shuffle(sequence,true);


}



