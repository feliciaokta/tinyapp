// function used in registration
const getIDByEmail = (email, users) => {
  for (const user in users) {
    if (email === users[user]["email"]) {
      return users[user];
    }
  }
  return false;
};


// function to generate random string for shortURL and userID
function generateRandomString(stringLength) {
  let result = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (var i = 0; i < stringLength; i++) {
    result.push(characters.charAt(Math.floor(Math.random() *
      charactersLength)));
  }
  return result.join('');
}



module.exports = {getIDByEmail, generateRandomString};
