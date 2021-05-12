const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const cookieParser = require("cookie-parser");
app.use(cookieParser());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

function generateRandomString() {
  var result           = [];
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < 6; i++ ) {
    result.push(characters.charAt(Math.floor(Math.random() * 
charactersLength)));
 }
 return result.join('');
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// displays hello
app.get("/", (req, res) => {
  res.send("Hello!");
});

// shows all URLs
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// adds new URL to database
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = `http://${longURL}`;
  console.log(req.body);  // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);         // redirect to line 56
});

// prints urlDatabase as an object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// displaying new URL form
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// displaying the page about a single URL
app.get("/urls/:shortURL", (req, res) => {
  const shortURLvar = req.params.shortURL;
  const templateVars = { shortURL: shortURLvar, longURL: urlDatabase[shortURLvar] };
  res.render("urls_show", templateVars); // display the file urls_show.ejs
});

// after putting in the shortURL in the address bar, gets redirected to the longURL
app.get("/u/:shortURL", (req, res) => {
  const shortURLvar = req.params.shortURL;
  const longURL = urlDatabase[shortURLvar];
  res.redirect(longURL);
});

// Hello World page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// delete button, delete a specified saved shortURL
app.post("/urls/:shortURL/delete",(req, res)=>{
  const idToDelete = req.params.shortURL;
  delete urlDatabase[idToDelete];
  res.redirect("/urls");
});

// edit button
app.post("/urls/:id",(req, res)=>{
  const idToEdit = req.body["updated URL"][0];
  const shortURLKey = req.params;
  urlDatabase[shortURLKey["id"]] = idToEdit;
  res.redirect("/urls");
});

// login button route
app.post("/login", (req, res) => {
  const cookieObject = cookieParser.JSONCookies(req.cookies);
  // console.log(cookieObject);
  const filledUsername = req.body.username;
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.cookie('username', filledUsername); // "username" is the name of the cookie, then variable
  res.render("urls_index", templateVars);
});

// logout button route
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});