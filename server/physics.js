
let charList = {}; // list of characters

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
