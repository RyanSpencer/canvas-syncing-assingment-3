// our socket code for physics to send updates back
const sockets = require('./sockets.js');

let charList = {}; // list of characters
const attacks = []; // array of attack to handle

// box collision check between two rectangles
// of a set width/height
const checkCollisions = (rect1, rect2, width, height) => {
  if (rect1.x < rect2.x + width &&
     rect1.x + width > rect2.x &&
     rect1.y < rect2.y + height &&
     height + rect1.y > rect2.y) {
    return true; // is colliding
  }
  return false; // is not colliding
};

// update our entire character list
const setCharacterList = (characterList) => {
  charList = characterList;
};

// update an individual character
const setCharacter = (character) => {
  charList[character.hash] = character;
};

module.exports.setCharacterList = setCharacterList;
module.exports.setCharacter = setCharacter;
