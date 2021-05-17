const express = require("express");
const app = express();

const PORT = 8080;

const morgan = require('morgan');
app.use(morgan('dev'));

// const cookieParser = require("cookie-parser");
// app.use(cookieParser());

const cookieSession = require('cookie-session');
const Keygrip = require('keygrip');
app.use(cookieSession({
  name: 'session',
  keys: new Keygrip(['key1', 'key2'], 'SHA384', 'base64'),

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const bcrypt = require('bcryptjs');

app.set("view engine", "ejs");


// urls global object
// key is shortURL
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID" },
  "UoEkj7": { longURL: "http://www.facebook.com", userID: "user2RandomID" }
};


const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};


// generate 6 random letters for shortURL
function generateRandomString() {
  let result = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (var i = 0; i < 6; i++) {
    result.push(characters.charAt(Math.floor(Math.random() *
      charactersLength)));
  }
  return result.join('');
}


// function to generate 9 characters for random user ID
function generateRandomUserID() {
  let result = [];
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (var i = 0; i < 9; i++) {
    result.push(characters.charAt(Math.floor(Math.random() *
    charactersLength)));
  }
  return result.join('');
}


const getIDByEmail = require("./helpers");



// function to return URLs where the userID is equal to the current logged-in user
const urlsForUser = (id) => {
  // use Object.keys for shortURL
  
  let result = {};
  let shortURLKey = Object.keys(urlDatabase);
  
  // for loop all object keys
  // when they match, add into an empty object
  for (const key in shortURLKey) {
    let serialNumbers = shortURLKey[key];
    
    if (id === urlDatabase[serialNumbers]["userID"]) {
      result[serialNumbers] = urlDatabase[serialNumbers]["longURL"];
    }

  }
  return result;
};



// displays hello
app.get("/", (req, res) => {
  res.send("Hello!");
});



// Hello World page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});



// "HOMEPAGE"
// shows all URLs (both long and short), edit button, delete button
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  
  const templateVarsNull = {user: user};

  if (!user) {
    res.render("urls_login", templateVarsNull);
    // res.send("Please login first");
    return;
  }
  
  const usersURLs = urlsForUser(req.session.user_id);
  
  const templateVars = {
    user: user,
    urls: "",
  };

  // if the logged-in user is the same as the URL poster,
  // take all the URLs belonging to the user and put them in templateVars
  for (const key in usersURLs) {
    if (urlDatabase[key]["userID"] === user["id"]) {
      templateVars["urls"] = usersURLs;
    }
  }

  res.render("urls_index", templateVars);
});




// adds new URL to database from the "create a new URL" page
app.post("/urls", (req, res) => {
  
  const user = users[req.session.user_id];

  const shortURL = generateRandomString();
  
  const longURL = req.body.longURL;
  
  urlDatabase[shortURL] = {
    longURL: `http://${longURL}`,
    userID: user["id"]
  };

  res.redirect(`/urls/${shortURL}`);  // redirect to line app.get "/urls/:shortURL"
});



// prints urlDatabase as an object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



// displaying new URL form to input new longURL & add it to the list
app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  
  const templateVars = {user: user};

  if (!user) {
    res.render("urls_login", templateVars);
  } else {
    res.render("urls_new", templateVars);
  }
});



// edit button route
// displaying the page about a single URL, both the long one on top & short one below it
app.get("/urls/:shortURL", (req, res) => {
  // use urlsForUser(id) to return the list of short URLs that belong to the user
  
  const user = users[req.session.user_id];
  
  const templateVarsNull = {user: user};

  if (!user) {
    // res.render("urls_login", templateVarsNull);
    res.send("Please login first");
    return;
  }
  
  const shortURLvar = req.params.shortURL;
  
  const usersURLs = urlsForUser(users[req.session.user_id]["id"]);
  
  const templateVars = {
    user: user,
    shortURL: shortURLvar,
    longURL: usersURLs[shortURLvar]
  };
  
  // check if shortURLvar is inside the usersURLs object as a key
  // if false, sorry you don't have permission to access
  
  for (const key in usersURLs) {
    if (key === shortURLvar) {
      res.render("urls_show", templateVars); // display the file urls_show.ejs
      return;
    }
  }

  for (const key in usersURLs) {
    if (key !== shortURLvar || !key) {
      res.send("Sorry, you don't have permission to access");
    }
  }

});

// the :shortURL is stored inside req.params.
// This is called dynamic URL bcs the :shortURL will change according to what it is
// req.params is used when you're taking dynamic value for the URL
// req.body is used when you're taking data from an input form textbox

// multiple res.render in the same app.get will result in an error
// to break it, add a "return;"

// with the else statement in the for loop, logging in as 1st user trying to access its own link gives an error message
// without the else statement and without another for loop, logging in as 2nd user trying to access 1st user's link showed an error message that there are multiple res.render.



// update button route inside the edit button link ... broken, need to fix later
app.post("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];
  
  const templateVarsNull = {user: user};

  if (!user) {
    res.render("urls_login", templateVarsNull);
    return;
  }

  const idToEdit = req.body["updated URL"];   // "updated URL" from url_show.ejs
  
  const shortURLKey = req.params["shortURL"];
  
  urlDatabase[shortURLKey]["longURL"] = idToEdit;
  
  res.redirect("/urls");
});



// after putting in the shortURL in the address bar & pressing enter, we get redirected to the longURL
app.get("/u/:shortURL", (req, res) => {
  
  const shortURLvar = req.params.shortURL;
  
  const longURL = urlDatabase[shortURLvar]["longURL"];
  
  res.redirect(longURL);
});



// delete button, delete a specified saved shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.session.user_id];

  const templateVarsNull = {user: user};

  if (!user) {
    res.render("urls_login", templateVarsNull);
    return;
  }
  
  const usersURLs = urlsForUser(req.session.user_id);
  
  const templateVars = {
    user: user,
    urls: "",
  };

  // if the logged-in user ID is the same as the owner of the link from the urlDatabase, then urls in the template is replaced with user's URLs
  for (const key in usersURLs) {
    if (urlDatabase[key]["userID"] === user["id"]) {
      templateVars["urls"] = usersURLs;
    }
  }

  const idToDelete = req.params.shortURL;
  delete urlDatabase[idToDelete];
  
  res.redirect("/urls");
});


// login button from login page
app.get("/login", (req, res) => {
  
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase
  };

  res.render("urls_login", templateVars);
});



// login button route, on header
app.post("/login", (req, res) => {

  const email = req.body.email;

  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const user = getIDByEmail(email, users);
  
  // if user exists & if password is the same, redirect to urls
  // if user exists & if password is different, send wrong password
  // if no user exists, please register
  if (user) {
    const comparePassword = bcrypt.compareSync(user.password, hashedPassword);
    if (comparePassword) {
      req.session.user_id = user.id;
      res.redirect("/urls");
    } else if (!comparePassword) {
      res.status(403).send("Wrong password, go back to login page and try again");
      return;
    }
  } else if (!user) {
    res.status(403).send("User doesn't exist, please register");
    return;
  }

  // with cookie-parser:
  // res.cookie("id", user.id); // "id" is the name of the cookie, then variable

});
// problem: when a new user registers & logs in, then logs out, that user can't login again. Error message is "wrong password"



// logout button route
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});



// registration page
app.get("/register", (req, res) => {
  const templateVars = {user: null};
  res.render("urls_register", templateVars);
});



// registration button route
app.post("/register", (req, res) => {
  const email = req.body.email;
  
  const password = req.body.password;
  
  if (!email || !password) {
    res.status(400).send("Empty email and/or empty password");
    return;
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);

  const userData = getIDByEmail(email, users);
  if (userData !== false) {
    res.status(404).send("This user already exists");
    return;
  } else {
    const id = generateRandomUserID();
    
    const newUser = {id, email, password: hashedPassword};
    users[id] = newUser;
    
    req.session.user_id = newUser.id;
    res.redirect("/urls");    // post is with redirect, get is with render
  }
});



app.listen(PORT, () => {
  console.log(`Tinyapp server listening on port ${PORT}!`);
});


