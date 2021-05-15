const express = require("express");
const app = express();

const PORT = 8080; // default port 8080

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
}))

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

app.set("view engine", "ejs");


// urls global object
// key is shortURL
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userRandomID" }
};

// users global object
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "1@1.com",
    password: "1"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "2@2.com",
    password: "2"
  }
};

// generate 6 random letters for shortURL
function generateRandomString() {
  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < 6; i++) {
    result.push(characters.charAt(Math.floor(Math.random() *
      charactersLength)));
  }
  return result.join('');
};


// function to generate 9 characters for random user ID
function generateRandomUserID() {
  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < 9; i++) {
    result.push(characters.charAt(Math.floor(Math.random() *
    charactersLength)));
  }
  return result.join('');
};

const getIDByEmail = require("./helpers");


// // function used in registration
// const getUserByEmail = (email, users) => {
//   for (const user in users) {
//     if (users[user].email === email) {
//       return users[user];
//     }
//   }
//     return false;
// };

// function to return URLs where the userID is equal to the current logged-in user
const urlsForUser = (id) => {
  // use Object.keys for shortURL
  // for loop all keys
  // when they match, add into an empty object
  let result = {};
  let shortURLKey = Object.keys(urlDatabase);

  
  for (const key in shortURLKey) {
      let serialNumbers = shortURLKey[key];
    if (id === urlDatabase[serialNumbers]["userID"]) {
      // console.log(urlDatabase[serialNumbers]);
      result[serialNumbers] = urlDatabase[serialNumbers]["longURL"];
    }
  }
  return result;
}




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
  const user = users[req.session.user_id];  //////////////

  if (!user) {
    res.render("urls_login");
    return;
  };
  
  const usersURLs = urlsForUser(req.session.user_id);  ////////////
  console.log("user: ", user);
  console.log(usersURLs);
  
  const templateVars = {
    user: user,
    urls: "",
  };

  for (const key in usersURLs) {
    if (urlDatabase[key]["userID"] === user["id"]) {
      templateVars["urls"] = usersURLs;
    }
  };
  res.render("urls_index", templateVars);
});


// adds new URL to database from the "create a new URL" page
app.post("/urls", (req, res) => {
  
  const user = users[req.session.user_id];     //////////////

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
  const user = users[req.session.user_id];   /////////////////
  const templateVars = {user: user};
  // console.log("user: ", user);
  if (!user) {
    res.render("urls_login", templateVars);
  } else {
    res.render("urls_new", templateVars);
  };
});


// edit button route
// displaying the page about a single URL, both the long one on top & short one below it
app.get("/urls/:shortURL", (req, res) => {
  // use urlsForUser(id) to return the list of short URLs that belong to the user
  // check if shortURLvar is inside this object as a key
  // if false, sorry you don't have permission to access

  const user = users[req.session.user_id];       /////////////

  if (!user) {
    res.render("urls_login");
  };

  const shortURLvar = req.params.shortURL;
  
  const usersURLs = urlsForUser(users[req.session.user_id]["id"]); /////////
  
  const templateVars = {
    user: user,
    shortURL: shortURLvar,
    longURL: usersURLs[shortURLvar]
  };
  
  for (const key in usersURLs) {
      if (key === shortURLvar) {
        res.render("urls_show", templateVars); // display the file urls_show.ejs
        return;
      }
  };
});
// the :shortURL is stored inside req.params.
// This is called dynamic URL bcs the :shortURL will change according to what it is
// req.params is used when you're taking dynamic value for the URL
// req.body is used when you're taking data from an input form textbox


// update button route inside the edit button link ... broken, need to fix later
app.post("/urls/:shortURL", (req, res) => {
  const user = users[req.session.user_id];     ///////////////

  if (!user) {
    res.render("urls_login");
  };

  const idToEdit = req.body["updated URL"];   // "updated URL" from url_show.ejs
  // console.log("idToEdit before: ", idToEdit);
  
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
  const user = users[req.session.user_id];       /////////////
  
  if (!user) {
    res.render("urls_login");
  };
  
  const usersURLs = urlsForUser(req.session.user_id);   //////////////
  
  const templateVars = {
    user: user,
    urls: "",
  };

  // if the logged-in user ID is the same as the owner of the link from the urlDatabase, then urls in the template is replaced with user's URLs
  for (const key in usersURLs) {
    if (urlDatabase[key]["userID"] === user["id"]) {
      templateVars["urls"] = usersURLs;
    }
  };

  const idToDelete = req.params.shortURL;
  delete urlDatabase[idToDelete];
  
  res.redirect("/urls");
});


// login button route, on header
app.post("/login", (req, res) => {

  const email = req.body.email;

  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const user = getIDByEmail(email, users);
  
  if (user) {
    const comparePassword = bcrypt.compareSync(user.password, hashedPassword);
    if (comparePassword) {
      req.session.user_id = user.id;       //////////////
      res.redirect("/urls");
    } else if (!comparePassword) {
      res.status(403).send("Wrong password, go back to login page");
      return;
    }
  } else if (!user) {
    res.status(403).send("User doesn't exist, please register");
    return;
  }

    // res.cookie("id", user.id); // "id" is the name of the cookie, then variable
    // req.session.user_id = user.id;       //////////////
    // res.redirect("/urls");

});


// login button from login page
app.get("/login", (req, res) => {
  
  const templateVars = {
    user: users[req.session.user_id],
    urls: urlDatabase
  };

  res.render("urls_login", templateVars);
});


// logout button route
app.post("/logout", (req, res) => {
  res.clearCookie("id");
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
  if (!email) {
    res.status(400).send("Empty email");
    return;
  };
  
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const userData = getIDByEmail(email, users);
  if (userData !== false) {
    res.status(404).send("This user already exists");   // set error number
    return;
  } else {
    const id = generateRandomUserID();
    
    const newUser = {id, email, password: hashedPassword};
    // console.log(newUser);
    users[id] = newUser;
    
    req.session.user_id = newUser.id;
    res.redirect("/urls");    // post is with redirect, get is with render
  }
});



app.listen(PORT, () => {
  console.log(`Tinyapp server listening on port ${PORT}!`);
});


