// Jaren Kawai
// jkawai@ucsc.edu

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

let g_mouseX = 0;
let g_mouseY = 0;



function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_Size
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix){
    console.log('Failed to get the storage location of u_ModelMatrix')
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix){
    console.log('Failed to get the storage location of u_ModelMatrix')
    return;
  }

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related to UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSegments = 10;
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let rainbowMode = false;
let g_yellowAngle = 0;
let g_pawAngle = 0;
let g_yellowAnimation = false;
let g_extraAnimation = false;
let g_bodyAngle = 0;
let g_tailAngle = 0;
let g_animalMatrix = new Matrix4();
let g_animalSpin = 0;
let g_cameraAngle = 0;
let g_sliderAngle = 0;

g_animalMatrix.translate(-.1,-.2,0);

function addActionsFromUI(){

  //Button information
  document.getElementById('yellowON').onclick = function() { g_yellowAnimation = true; };
  document.getElementById('yellowOFF').onclick = function() { g_yellowAnimation = false; };

  document.getElementById('magentaON').onclick = function() { g_extraAnimation = true; };
  document.getElementById('magentaOFF').onclick = function() { g_extraAnimation = false; };

  //Slider information
  document.getElementById('angleSlide').addEventListener('mousemove', function() { g_cameraAngle = this.value, renderAllShapes()});
  document.getElementById('yellowSlide').addEventListener('mousemove', function() { g_yellowAngle = this.value; renderAllShapes(); });
  document.getElementById('magentaSlide').addEventListener('mousemove', function() { g_sliderAngle = this.value; renderAllShapes(); });

}



function main() {

  setupWebGL();

  connectVariablesToGLSL();

  addActionsFromUI();

  //canvas.onmousedown = click;
  // Register function (event handler) to be called on a mouse press

  // Specify the color for clearing <canvas>
  gl.clearColor(0.678, 0.847, 0.902, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);

  requestAnimationFrame(tick);

  canvas.onmousedown = function (ev) {
    if(ev.shiftKey)
    {
      g_extraAnimation = true;
    }
    g_mouseX = ev.clientX;
    g_mouseY = ev.clientY;
  
    canvas.onmousemove = function (ev) {
        let deltaX = ev.clientX - g_mouseX;
        let deltaY = ev.clientY - g_mouseY;
  
        g_globalAngleX += deltaX * 0.5; // Adjust sensitivity
        g_globalAngleY += deltaY * 0.5;

        renderAllShapes();
  
        g_mouseX = ev.clientX;
        g_mouseY = ev.clientY;
    };
  
    canvas.onmouseup = function () {
        canvas.onmousemove = null;
    };

  };
}



var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;

  updateAnimationAngles();

  renderAllShapes();

  requestAnimationFrame(tick);
}

function updateAnimationAngles(){
  if (g_yellowAnimation){
    g_yellowAngle = (15*Math.sin(g_seconds));
    g_bodyAngle = (5*Math.sin(g_seconds));
  }
  if (g_extraAnimation){
    g_pawAngle = (10*Math.sin(g_seconds));
    g_tailAngle = (15*Math.sin(g_seconds));
    g_animalSpin = (5*(g_seconds));
  }
}


function convertCoordinatesEventToGL(ev){
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  animalMatrix.translate(-.5,-.5,0);

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x,y]);
}

function renderAllShapes(){

  var startTime = performance.now();
  var totalRotationX = -g_globalAngleX + parseFloat(-g_cameraAngle);

  var globalRotMat = new Matrix4().rotate(totalRotationX, 0, 1, 0).rotate(-g_globalAngleY, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);


  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  
  var body = new Cube();
  body.matrix = new Matrix4(g_animalMatrix);
  body.color = [1.0, 0.7, 0.0, 1.0];
  body.matrix.translate(-.25, -.3, 0.0);
  body.matrix.rotate(-5,1,0,0);
  body.matrix.rotate( g_bodyAngle, 0, 0, 1);
  var bodyMatrix = new Matrix4(body.matrix);
  body.matrix.scale(0.6, .6, 0.5);
  body.render();

  var head = new Cube();
  head.color = [1.0, 0.7, 0.0, 1.0];
  head.matrix = bodyMatrix;
  head.matrix.translate(0, .6, -.1);
  head.matrix.rotate(0,1,0,0);
  head.matrix.scale(.6, .4, .6);
  head.render();

  var body2 = new Cube();
  body2.matrix = new Matrix4(g_animalMatrix);
  body2.color = [1.0, 1.0, 1.0, 1.0];
  body2.matrix.translate(-.15, -.3, -0.05);
  body2.matrix.rotate(-5,1,0,0);
  body2.matrix.rotate( g_bodyAngle, 0, 0, 1);
  body2.matrix.scale(.4, .5, 0.05);
  body2.render();
  
  var stripe = new Cube();
  stripe.color = [0.0, 0.0, 0.0, 1.0];
  stripe.matrix.rotate(-5,1,0,0);
  stripe.matrix = bodyMatrix;
  stripe.matrix.scale(0.05, .15, 0.8);
  stripe.matrix.translate(-.9, -9.5, .2);
  stripe.render();

  var stripe2 = new Cube();
  stripe2.color = [0.0, 0.0, 0.0, 1.0];
  stripe2.matrix.rotate(-5,1,0,0);
  stripe2.matrix = bodyMatrix;
  stripe2.matrix.translate(0, 4, 0);
  stripe2.render();

  var stripe3 = new Cube();
  stripe3.color = [0.0, 0.0, 0.0, 1.0];
  stripe3.matrix.rotate(-5,1,0,0);
  stripe3.matrix = bodyMatrix;
  stripe3.matrix.translate(21, 0, 0);
  stripe3.render();

  var stripe4 = new Cube();
  stripe4.color = [0.0, 0.0, 0.0, 1.0];
  stripe4.matrix.rotate(-5,1,0,0);
  stripe4.matrix = bodyMatrix;
  stripe4.matrix.translate(0, -4, 0);
  stripe4.render();


  var leftArm = new Cube();
  leftArm.matrix = new Matrix4(g_animalMatrix);
  leftArm.color = [1.0, 0.7, 0.0, 1.0];
  leftArm.matrix.rotate(-5,1,0,0);
  leftArm.matrix.rotate( g_yellowAngle, 0, 0, 1);
  leftArm.matrix.scale(0.5, .2, .3);
  leftArm.matrix.translate(.2,.4,-.1);
  leftArm.render();

  var leftforearm = new Cube();
  leftforearm.matrix = new Matrix4(g_animalMatrix);
  leftforearm.color = [1.0, .7, 0.0, 1.0];
  leftforearm.matrix.rotate(-5,1,0,0);
  leftforearm.matrix.rotate( 1.5*g_yellowAngle, 0, 0, 1);
  leftforearm.matrix.scale(0.2, .2, .3);
  leftforearm.matrix.translate(2.5,.5,-0.05);
  leftforearm.render();

  var leftwrist = new Cube();
  leftwrist.matrix = new Matrix4(g_animalMatrix);
  leftwrist.color = [1.0, .7, 0.0, 1.0];
  leftwrist.matrix.rotate(-5,1,0,0);
  leftwrist.matrix.rotate( 2*g_yellowAngle, 0, 0, 1);
  leftwrist.matrix.scale(0.2, .2, .3);
  leftwrist.matrix.translate(3.3,.6,-0.04);
  leftwrist.render();

  var rightArm = new Cube();
  rightArm.matrix = new Matrix4(g_animalMatrix);
  rightArm.color = [1.0, 0.7, 0.0, 1.0];
  rightArm.matrix.rotate(-5,1,0,0);
  rightArm.matrix.rotate( g_yellowAngle, 0, 0, 1);
  rightArm.matrix.scale(0.35, .2, .3);
  rightArm.matrix.translate(-1.4,.4,-.1);
  rightArm.render(); 

  var rightforearm = new Cube();
  rightforearm.matrix = new Matrix4(g_animalMatrix);
  rightforearm.color = [1.0, .7, 0.0, 1.0];
  rightforearm.matrix.rotate(-5,1,0,0);
  rightforearm.matrix.rotate( 1.5*g_yellowAngle, 0, 0, 1);
  rightforearm.matrix.scale(0.2, .2, .3);
  rightforearm.matrix.translate(-3,.3,-.1);
  rightforearm.matrix.rotate(-5,0,1,-10);
  rightforearm.render();
  
  var rightwrist = new Cube();
  rightwrist.matrix = new Matrix4(g_animalMatrix);
  rightwrist.color = [1.0, .7, 0.0, 1.0];
  rightwrist.matrix.rotate(-5,1,0,0);
  rightwrist.matrix.rotate( 2*g_yellowAngle, 0, 0, 1);
  rightwrist.matrix.rotate( g_sliderAngle, 1, 0, 1);
  rightwrist.matrix.scale(0.2, .2, .3);
  rightwrist.matrix.translate(-3.7,.2,-.1);
  rightwrist.matrix.rotate(-5,0,1,-10);
  rightwrist.render();

  var rightLeg = new Cube();
  rightLeg.matrix = new Matrix4(g_animalMatrix);
  rightLeg.color = [1.0, .7, 0, 1.0];
  rightLeg.matrix.translate(-.25, -.5, -.2);
  rightLeg.matrix.rotate(-5,1,0,0);
  rightLeg.matrix.scale(.25, .25, .7);
  rightLeg.render();

  var rightLegp = new Cube();
  rightLegp.matrix = new Matrix4(g_animalMatrix);
  rightLegp.color = [1.0, .8, 0, 1.0];
  rightLegp.matrix.translate(-.25, -.5, -.3);
  rightLegp.matrix.rotate(-5,1,0,0);
  rightLegp.matrix.rotate( g_pawAngle, 0, 0, 1);
  rightLegp.matrix.scale(.25, .25, .1);
  rightLegp.render();

  var leftLeg = new Cube();
  leftLeg.matrix = new Matrix4(g_animalMatrix);
  leftLeg.color = [1.0, .7, 0, 1.0];
  leftLeg.matrix.translate(.1, -.5, -.2);
  leftLeg.matrix.rotate(-5,1,0,0);
  leftLeg.matrix.scale(.25, .25, .7);
  leftLeg.render();

  var leftLegp = new Cube();
  leftLegp.matrix = new Matrix4(g_animalMatrix);
  leftLegp.color = [1.0, .8, 0, 1.0];
  leftLegp.matrix.translate(.10, -.5, -.3);
  leftLegp.matrix.rotate(-5,1,0,0);
  leftLegp.matrix.rotate(-g_pawAngle, 0, 0, 1);
  leftLegp.matrix.scale(.25, .25, .1);
  leftLegp.render();

  var tail1 = new Cube();
  tail1.color = [1.0, .7, 0, 1.0];
  tail1.matrix.rotate(-5,1,1);
  tail1.matrix = bodyMatrix;
  tail1.matrix.translate(-12, -.5, 1);
  tail1.matrix.scale(4,2,.3)
  tailMatrix = new Matrix4(bodyMatrix);
  tail1.render();

  var tail2 = new Cube();
  tail2.color = [0.0, 0, 0, 1.0];
  tail2.matrix.rotate(-5,1,1);
  tail2.matrix = tailMatrix;
  tail2.matrix.rotate(g_tailAngle, 0, 1, 0);
  tail2.matrix.translate(0, -.1, .7);
  tail2.render();

  var tail3 = new Cube();
  tail3.color = [1.0, .7, 0, 1.0];
  tail3.matrix.rotate(-5,1,1);
  tail3.matrix = tailMatrix;
  tail3.matrix.rotate(1.5*g_tailAngle, 0, 1, 0);
  tail3.matrix.translate(0, -.1, .7);
  tail3.render();

  var tail4 = new Cube();
  tail4.color = [0.0, 0, 0, 1.0];
  tail4.matrix.rotate(-5,1,1);
  tail4.matrix = tailMatrix;
  tail4.matrix.rotate(2*g_tailAngle, 0, 1, 0);
  tail4.matrix.translate(0, -.1, .7);
  tail4.render();

  var eyel = new Octagon();
  eyel.color = [0,0,0,1];
  eyel.matrix = bodyMatrix;
  eyel.matrix.translate(-.6,7,-4);
  eyel.matrix.scale(.5,.5,.5)
  eyel.matrix.rotate(90,1,0,0);
  eyel.render();

  var eyer = new Octagon();
  eyer.color = [0,0,0,1];
  eyer.matrix = bodyMatrix;
  eyer.matrix.translate(4,0,0);
  eyer.render();

  var nose = new Octagon();
  nose.color = [0,0,0,1];
  nose.matrix = bodyMatrix;
  nose.matrix.translate(-2,0,0);
  nose.matrix.rotate(-90,1,0,0);
  nose.matrix.translate(0,-1,.5);
  nose.render();
  
  var earl = new Octagon();
  earl.color = [1,.7,0,1];
  earl.matrix = bodyMatrix;
  earl.matrix.translate(-3,4.5,1);
  earl.matrix.scale(2,2,2);
  earl.matrix.rotate(90,1,0,0);
  earl.render();

  var earr = new Octagon();
  earr.color = [1,.7,0,1];
  earr.matrix = bodyMatrix;
  earr.matrix.translate(3,0,0);
  earr.render();

  var facestripe1 = new Cube();
  facestripe1.color = [0, 0, 0, 1.0];
  facestripe1.matrix.rotate(-5,1,0,0);

  facestripe1.matrix = bodyMatrix;
  facestripe1.matrix.translate(1,-.7,1);
  facestripe1.matrix.scale(.3, 4, .5);
  facestripe1.render();

  var facestripe2 = new Cube();
  facestripe2.color = [0, 0, 0, 1.0];
  facestripe2.matrix.rotate(-5,1,0,0);
  facestripe2.matrix = bodyMatrix;
  facestripe2.matrix.translate(0,0,3);
  facestripe2.render();

  var facestripe3 = new Cube();
  facestripe3.color = [0, 0, 0, 1.0];
  facestripe3.matrix.rotate(-5,1,0,0);
  facestripe3.matrix = bodyMatrix;
  facestripe3.matrix.translate(-17,0,0);
  facestripe3.render();

  var facestripe4 = new Cube();
  facestripe4.color = [0, 0, 0, 1.0];
  facestripe4.matrix.rotate(-5,1,0,0);
  facestripe4.matrix = bodyMatrix;
  facestripe4.matrix.translate(0,0,-3);
  facestripe4.render();

  var facestripe5 = new Cube();
  facestripe5.color = [0, 0, 0, 1.0];
  facestripe5.matrix.rotate(-5,1,0,0);
  facestripe5.matrix = bodyMatrix;
  facestripe5.matrix.translate(8,-.05,-1.5);
  facestripe5.matrix.scale(1.5,.6,2)
  facestripe5.render();

  var facestripe6 = new Cube();
  facestripe6.color = [0, 0, 0, 1.0];
  facestripe6.matrix.rotate(-5,1,0,0);
  facestripe6.matrix = bodyMatrix;
  facestripe6.matrix.translate(5.2,0,.7);
  facestripe6.matrix.scale(1.1,.1,.6)
  facestripe6.render();

  var facestripe7 = new Cube();
  facestripe7.color = [0, 0, 0, 1.0];
  facestripe7.matrix.rotate(-5,1,0,0);
  facestripe7.matrix = bodyMatrix;
  facestripe7.matrix.translate(0,0,2.5);
  facestripe7.render();

  var facestripe8 = new Cube();
  facestripe8.color = [0, 0, 0, 1.0];
  facestripe8.matrix.rotate(-5,1,0,0);
  facestripe8.matrix = bodyMatrix;
  facestripe8.matrix.translate(-9.5,0,0);
  facestripe8.render();

  var facestripe9 = new Cube();
  facestripe9.color = [0, 0, 0, 1.0];
  facestripe9.matrix.rotate(-5,1,0,0);
  facestripe9.matrix = bodyMatrix;
  facestripe9.matrix.translate(0,0,-2.5);
  facestripe9.render();


  var duration = performance.now() - startTime;
  sendTextToHTML(" fps: " + Math.floor(10000/duration)/10, "numdot");
}

//set the text of HTML element
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm){
    console.log('Failed to get ' + htmlID + ' from HTML');
    return;
  }
  htmlElm.innerHTML = text;
}
