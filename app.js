//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Connection
mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});

//User Schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

//Table Name
const User = new mongoose.model("User", userSchema);

app.route("/")
    .get(function(req, res){
        res.render("home");
    });

app.route("/login")
    .get(function(req, res){
        res.render("login", {errorMessage: ""});
    })
    .post(function(req, res){
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({email: username}, function(err, foundUser){
            if(foundUser && !err){
                if(foundUser.password === password){
                    res.render("secrets");
                }
            } else {
                res.render("login", {errorMessage: "The email or password you’ve entered doesn’t match. Please try again."});
                // console.log("Your username and password doesn't match. Please try again.");
            }
        });
    });

app.route("/register")
    .get(function(req, res){
        res.render("register");
    })
    .post(function(req, res){
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });

        newUser.save(function(err){
            if(err){
                console.log(err);
            } else {
                res.render("secrets");
            }
        });
    });

//Heroku
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

//404 Page not found
app.use(function (req, res, next) {
  res.status(404).send("Nothing Found");
});

app.listen(port, function() {
  console.log("Server started on port 3000");
});
