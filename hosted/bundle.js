"use strict";

//Possible directions a user can move
//their character. These are mapped
//to integers for fast/small storage
var directions = {
  DOWNLEFT: 0,
  DOWN: 1,
  DOWNRIGHT: 2,
  LEFT: 3,
  UPLEFT: 4,
  RIGHT: 5,
  UPRIGHT: 6,
  UP: 7
};

//size of our character sprites
var spriteSizes = {
  WIDTH: 61,
  HEIGHT: 121
};

//function to lerp (linear interpolation)
//Takes position one, position two and the 
//percentage of the movement between them (0-1)
var lerp = function lerp(v0, v1, alpha) {
  return (1 - alpha) * v0 + alpha * v1;
};

//redraw with requestAnimationFrame
var redraw = function redraw(time) {
  //update this user's positions
  updatePosition();

  ctx.clearRect(0, 0, 500, 500);

  //each user id
  var keys = Object.keys(squares);

  //for each user
  for (var i = 0; i < keys.length; i++) {
    var square = squares[keys[i]];

    //if alpha less than 1, increase it by 0.01
    if (square.alpha < 1) square.alpha += 0.05;

    //applying a filter effect to other characters
    //in order to see our character easily
    if (square.hash === hash) {
      ctx.filter = "none";
    } else {
      ctx.filter = "hue-rotate(40deg)";
    }

    //calculate lerp of the x/y from the destinations
    square.x = lerp(square.prevX, square.destX, square.alpha);
    square.y = lerp(square.prevY, square.destY, square.alpha);

    // if we are mid animation or moving in any direction
    if (square.frame > 0 || square.moveUp || square.moveDown || square.moveRight || square.moveLeft) {
      //increase our framecount
      square.frameCount++;

      //every 8 frames increase which sprite image we draw to animate
      //or reset to the beginning of the animation
      if (square.frameCount % 8 === 0) {
        if (square.frame < 7) {
          square.frame++;
        } else {
          square.frame = 0;
        }
      }
    }

    //draw our characters
    ctx.drawImage(walkImage, spriteSizes.WIDTH * square.frame, spriteSizes.HEIGHT * square.direction, spriteSizes.WIDTH, spriteSizes.HEIGHT, square.x, square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);

    //highlight collision box for each character
    ctx.strokeRect(square.x, square.y, spriteSizes.WIDTH, spriteSizes.HEIGHT);
  }

  //set our next animation frame
  animationFrame = requestAnimationFrame(redraw);
};
'use strict';

var canvas = void 0;
var ctx = void 0;
var walkImage = void 0; //spritesheet for character
//our websocket connection 
var socket = void 0;
var hash = void 0; //user's unique character id (from the server)
var animationFrame = void 0; //our next animation frame function

var squares = {}; //character list

//handle for key down events
var keyDownHandler = function keyDownHandler(e) {
  var keyPressed = e.which;
  var square = squares[hash];

  // A OR LEFT
  if (keyPressed === 65 || keyPressed === 37) {
    square.moveLeft = true;
  }
  // D OR RIGHT
  else if (keyPressed === 68 || keyPressed === 39) {
      square.moveRight = true;
    }
};

//handler for key up events
var keyUpHandler = function keyUpHandler(e) {
  var keyPressed = e.which;
  var square = squares[hash];

  // A OR LEFT
  if (keyPressed === 65 || keyPressed === 37) {
    square.moveLeft = false;
  }
  // D OR RIGHT
  else if (keyPressed === 68 || keyPressed === 39) {
      square.moveRight = false;
    }
    //Space key was lifted
    else if (keyPressed === 32) {}
};

var init = function init() {
  walkImage = document.querySelector('#walk');
  canvas = document.querySelector('#canvas');
  ctx = canvas.getContext('2d');

  socket = io.connect();

  socket.on('joined', setUser); //when user joins
  socket.on('updatedMovement', update); //when players move
  socket.on('left', removeUser); //when a user leaves
  socket.on('gravity', addGravity);

  document.body.addEventListener('keydown', keyDownHandler);
  document.body.addEventListener('keyup', keyUpHandler);
};

window.onload = init;
'use strict';

//when we receive a character update
var update = function update(data) {
  //if we do not have that character (based on their id)
  //then add them
  if (!squares[data.hash]) {
    squares[data.hash] = data;
    return;
  }

  //if the update is for our own character (we dont need it)
  //Although, it could be used for player validation
  if (data.hash === hash) {
    return;
  }

  //if we received an old message, just drop it
  if (squares[data.hash].lastUpdate >= data.lastUpdate) {
    return;
  }

  //grab the character based on the character id we received
  var square = squares[data.hash];
  //update their direction and movement information
  //but NOT their x/y since we are animating those
  square.prevX = data.prevX;
  square.prevY = data.prevY;
  square.destX = data.destX;
  square.destY = data.destY;
  square.direction = data.direction;
  square.moveLeft = data.moveLeft;
  square.moveRight = data.moveRight;
  square.moveDown = data.moveDown;
  square.moveUp = data.moveUp;
  square.alpha = 0.05;
};

//function to remove a character from our character list
var removeUser = function removeUser(data) {
  //if we have that character, remove them
  if (squares[data.hash]) {
    delete squares[data.hash];
  }
};

//function to set this user's character
var setUser = function setUser(data) {
  hash = data.hash; //set this user's hash to the unique one they received
  squares[hash] = data; //set the character by their hash
  requestAnimationFrame(redraw); //start animating
};

var addGravity = function addGravity(data) {
  console.log(data);
  var square = squares[hash];

  square.prevX = square.x;
  square.prevY = square.y;

  if (square.destY > 0) {
    square.destY -= data;
  }

  socket.emit('movementUpdate', square);
};

//update this user's positions based on keyboard input
var updatePosition = function updatePosition() {
  var square = squares[hash];

  //move the last x/y to our previous x/y variables
  square.prevX = square.x;
  square.prevY = square.y;

  //if user is moving up, decrease y
  if (square.moveUp && square.destY > 0) {
    square.destY -= 2;
  }
  //if user is moving down, increase y
  if (square.moveDown && square.destY < 400) {
    square.destY += 2;
  }
  //if user is moving left, decrease x
  if (square.moveLeft && square.destX > 0) {
    square.destX -= 2;
  }
  //if user is moving right, increase x
  if (square.moveRight && square.destX < 400) {
    square.destX += 2;
  }

  //determine direction based on the inputs of direction keys
  if (square.moveUp && square.moveLeft) square.direction = directions.UPLEFT;

  if (square.moveUp && square.moveRight) square.direction = directions.UPRIGHT;

  if (square.moveDown && square.moveLeft) square.direction = directions.DOWNLEFT;

  if (square.moveDown && square.moveRight) square.direction = directions.DOWNRIGHT;

  if (square.moveDown && !(square.moveRight || square.moveLeft)) square.direction = directions.DOWN;

  if (square.moveUp && !(square.moveRight || square.moveLeft)) square.direction = directions.UP;

  if (square.moveLeft && !(square.moveUp || square.moveDown)) square.direction = directions.LEFT;

  if (square.moveRight && !(square.moveUp || square.moveDown)) square.direction = directions.RIGHT;

  //reset this character's alpha so they are always smoothly animating
  square.alpha = 0.05;

  //send the updated movement request to the server to validate the movement.
  socket.emit('movementUpdate', square);
};
