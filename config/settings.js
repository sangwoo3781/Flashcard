"use strict";

exports.port = 8080;
exports.mongoUrl = "mongodb://localhost:27017";
exports.mongoDbName = "usersDb";
exports.usersCollectionName = "users";
exports.sequenceCollectionName = "sequence";
const sessionDbName = "sessionDb";
exports.sessionDbName = sessionDbName;
exports.saltRounds = 10;

const expiresMinuets = 5;

exports.mongoOptions = {
    mongoUrl: "mongodb://localhost:27017",
    dbName: sessionDbName,
    ttl: expiresMinuets, // ttl設定しないとautoRemoveが反映されないっぽいので必ず設定しよう
    autoRemove: "interval", // "interval" or "disabled"
    autoRemoveInterval: 0,// minuets
};

exports.sessionSettings = {
    secret: 'secret',
    name: "sessionId",
    resave: false,
    saveUninitialized: false, // curlテスト段階だと、trueにしないと毎回初期化される。
    store: "Set after require this module and mongo store", //MongoStore.create(mongoOptions),
    cookie: {
        httpOnly: false,
        secure: false,
        expires: new Date(Date.now() + (1000 * 60 * expiresMinuets)), // 1000が一秒。
        maxAge: (1000 * 60 * expiresMinuets),
    }
};