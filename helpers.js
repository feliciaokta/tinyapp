// function used in registration
const getUserByEmail = (email, users) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
    return false;
};

module.exports = getUserByEmail;