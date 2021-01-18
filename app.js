//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

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
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

userSchema.plugin(passportLocalMongoose);

//Table Name
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.route("/")
    .get(function(req, res){
        res.render("home");
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
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                });
            }
        });
    });

app.route("/register")
    .get(function(req, res){
        res.render("register");
    })
    .post(function(req, res){
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
