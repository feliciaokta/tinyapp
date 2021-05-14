const express = require("express");
const app = express();

const morgan = require('morgan');
app.use(morgan('dev'));

const PORT = 8080; // default port 8080

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

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

// function used in registration
const getUserByEmail = (email, users) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
    return false;
};

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
      console.log(urlDatabase[serialNumbers]);
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
  const user = users[req.cookies["id"]];
  // console.log("1.", user);
  const templateVars = {
    user: user,
    urls: urlDatabase
  };
  if (!user) {
    res.render("urls_login");
  } else {
    // if (urlDatabase[shortURL??]["userID"] === user["id"])
    res.render("urls_index", templateVars);
  };
});


// adds new URL to database
app.post("/urls", (req, res) => {
  
  const shortURL = generateRandomString();
  
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = `http://${longURL}`;
  // console.log(req.body);
  
  res.redirect(`/urls/${shortURL}`);         // redirect to line app.get "/urls/:shortURL"
});


// prints urlDatabase as an object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// displaying new URL form to input new longURL & add it to the list
app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["id"]];
  const templateVars = {user: user};
  // console.log("user: ", user);
  if (!user) {
    res.render("urls_login");
  } else {
    res.render("urls_new", templateVars);
  };
});


// displaying the page about a single URL, both the long one on top & short one below it
app.get("/urls/:shortURL", (req, res) => {
  // use urlsForUser(id) to return the list of short URLs that belong to the user
  // check if shortURLvar is inside this object as a key
  // if false, sorry you don't have permission to access

  const user = users[req.cookies["id"]];

  if (!user) {
    res.render("urls_login");
  };

  const shortURLvar = req.params.shortURL;
  console.log("1. ", shortURLvar);
  
  const templateVars = {
    user: user,
    shortURL: shortURLvar,
    longURL: urlDatabase[shortURLvar]["longURL"] };
  console.log("2. ", templateVars);
  
  const usersURLs = urlsForUser(users[req.cookies["id"]]["id"]);
  console.log("3. ", usersURLs);
  console.log("4. ", users[req.cookies["id"]]["id"]);
  
  for (const key in usersURLs) {
    console.log(key);
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


// after putting in the shortURL in the address bar & pressing enter, we get redirected to the longURL
app.get("/u/:shortURL", (req, res) => {
  
  const shortURLvar = req.params.shortURL;
  const longURL = urlDatabase[shortURLvar]["longURL"];
  
  res.redirect(longURL);
});


// delete button, delete a specified saved shortURL
app.post("/urls/:shortURL/delete", (req, res) => {
  
  const idToDelete = req.params.shortURL;
  delete urlDatabase[idToDelete];
  
  res.redirect("/urls");
});


// edit button route ... broken, need to fix later
app.post("/urls/:id", (req, res) => {
  const user = users[req.cookies["id"]];
  const idToEdit = req.body["updated URL"][0];
  // console.log("idToEdit before: ", idToEdit);
  
  const shortURLKey = req.params;
  // console.log("shortURLKey: ", shortURLKey);
  
  urlDatabase[shortURLKey["id"]] = idToEdit;
  // console.log("idToEdit after: ", idToEdit);
  
  res.redirect("/urls");
});


// login button route, on header
app.post("/login", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  if (!user) {
    res.status(403).send("User doesn't exist");
  } else if (password !== user.password) {
    res.status(403).send("Wrong password");
  } else {
    res.cookie("id", user.id); // "id" is the name of the cookie, then variable
    res.redirect("/urls");
    // res.send("Successfully Logged In");
  }
});


// login button from login page
app.get("/login", (req, res) => {
  
  const templateVars = {
    user: users[req.cookies["id"]],
    urls: urlDatabase
  };

  res.render("urls_login", templateVars);
});


// logout button route
app.post("/logout", (req, res) => {
  res.clearCookie("id");
  res.redirect("/urls");
});


// registration page
app.get("/register", (req, res) => {
  res.render("urls_register");
});


// registration button route
app.post("/register", (req, res) => {
  const email = req.body.email;
  if (!email) {
    res.status(400).send("Empty email");
    return;
  };
  
  const password = req.body.password;
  const userData = getUserByEmail(email, users);
  console.log(userData);
  // console.log("inside app.post: ", user);
  if (userData !== false) {
    res.status(404).send("This user already exists");   // set error number
    return;
  } else {
    const id = generateRandomUserID();
    
    const newUser = {id, email, password};
    users[id] = newUser;
    
    res.cookie("id", id);
    res.redirect("/urls");    // post is with redirect, get is with render
    console.log("check", users);
  }
});



app.listen(PORT, () => {
  console.log(`Tinyapp server listening on port ${PORT}!`);
});


