"use strict";
/***********
 * require
 ***********/
const express = require("express");
const session = require('express-session');
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const settings = require("/home/ec2-user/environment/app/config/settings.js");

/******************
 * session setting
 ******************/
const mongoOptions = settings.mongoOptions;
const sessionSettings = settings.sessionSettings;
sessionSettings.store = MongoStore.create(mongoOptions);

/*************
 * middleware
 *************/
const TOPPAGE = require("./toppage.js");
const LOGIN = require("./login.js");
const LOGOUT = require("./logout.js");
const SIGNUP = require("./signup.js");
const MYPAGE = require("./mypage.js");
const SUCCESS = require("./success.js");
const UNSUBSCRIBE = require("./unsubscribe.js");

/**************
 * app setting
 **************/
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("static", express.static('public'));
app.use(session(sessionSettings));

/***********
 * routing
 ***********/
app.use("/", TOPPAGE);
app.use("/login", LOGIN);
app.use("/logout", LOGOUT);
app.use("/signup", SIGNUP);
app.use("/mypage", MYPAGE);
app.use("/unsubscribe", UNSUBSCRIBE);
app.use("/success", SUCCESS);

app.get("/wordadded", (req, res) => {
    return res.sendFile("/home/ec2-user/environment/app/html/wordadded.html");
});

app.all('/*', (req, res) => {
    console.log('Accessing the secret section ...');
    return res.status(404).send("404 ページが見つかりません。");
});

app.use((err, req, res, next) => {
    console.log(err);
    return res.sendFile("/home/ec2-user/environment/app/html/error.html");
});

app.listen(settings.port, () => {
    console.log(`Example app listening on port ${settings.port}`);
});
