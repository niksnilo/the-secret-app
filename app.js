//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//Connection
mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);
//User Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//Table Name
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    // callbackURL: "http://localhost:3000/auth/google/secrets",
    callbackURL: "https://the-secret-app.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      if(err){
        return cb(err);
      } 
        //If No user found, automatic create acc
        if(!user){
            User.register({username: req.body.username}, req.body.password, function(err, user){
                if(err){
                    console.log(err);
                    res.redirect("/register");
                } else {
                    passport.authenticate("local")(req, res, function(){
                        res.redirect("/secrets");
                    });
                }
            });
        }  else {
            //found user. Return
            return cb(err, user);
        }
    });
  }
));

app.route("/")
    .get(function(req, res){
        res.render("home");
    });

app.get("/auth/google",
    passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
});

app.route("/login")
    .get(function(req, res){
        res.render("login", {errorMessage: ""});
    })
    .post(function(req, res){
        const user = new User ({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function(err){
            if(err){
                res.redirect("/login");
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                });
            }
        });
    });

app.route("/register")
    .get(function(req, res){
        res.render("register", {errorMessage: ""});
    })
    .post(function(req, res){
        User.register({username: req.body.username}, req.body.password, function(err, user){
            if(err){
                console.log(err);
                res.redirect("/register", {errorMessage: err});
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                });
            }
        });
    });

app.route("/secrets")
    .get(function(req, res){
        if(req.isAuthenticated()){
            res.render("secrets");
        } else {
            res.redirect("/login");
        }
    });

app.route("/logout")
    .get(function(req, res){
        req.logout();
        res.redirect("/");
    });

//Heroku
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

//404 Page not found
app.use(function (req, res, next) {
  res.status(404).render("404");
});

app.listen(port, function() {
  console.log("Server started on port 3000");
});
