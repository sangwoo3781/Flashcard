"use strict";
const express = require('express');
const router = express.Router();
const settings = require("/home/ec2-user/environment/app/config/settings.js");
const { MongoClient } = require('mongodb');
const client = new MongoClient(settings.mongoUrl);

router.get("/", (req, res, next) => {
    // check login
    if (!req.session.userId) return res.redirect("/login");

    (async () => {
        try {
            await client.connect();
            const db = client.db(settings.mongoDbName);
            const userCollection = db.collection(settings.usersCollectionName);

            // get user data
            const userId = req.session.userId;
            const query = { userId: userId };
            const userDocument = await userCollection.findOne(query);
            if (userDocument === null) throw new Error("user data not found.");
            const name = userDocument.name;
            const email = userDocument.email;

            res.render("./mypage.ejs", { userId: userId, name: name, email: email, newWord: {}, errorMsgs: {} });
            return;
        }
        catch (e) {
            next(e);
        }
        finally {
            await client.close();
            return;
        }
    })();
});

router.post("/", (req, res, next) => {
    // add new word
    (async () => {
        // get posted data
        // const newWord = {
        //     english: req.body.english || "",
        //     japanese: req.body.japanese || "",
        //     comment: req.body.comment || "",
        // };
        // console.log(newWord.comment);
        // const errorMsgs = {
        //     english: (newWord.english) ? "" : "英語を入力してください。",
        //     japanese: (newWord.japanese) ? "" : "日本語を入力してください。",
        // };
        // if (errorMsgs.english !== "" || errorMsgs.japanese !== "") {
        //     res.render("./mypage.ejs", { userId: userId, name: name, email: email, newWord: newWord, errorMsgs: errorMsgs });
        //     return;
        // }
        try {
            // connect db
            await client.connect();
            const db = client.db(settings.mongoDbName);
            const userCollection = db.collection(settings.usersCollectionName);

            // get user data
            const userId = req.session.userId;
            let query = { userId: userId };
            const userDocument = await userCollection.findOne(query);
            if (userDocument === null) throw new Error("user data not found.");
            const name = userDocument.name;
            const email = userDocument.email;
            
            // check input data
            const newWord = {
                english: req.body.english || "",
                japanese: req.body.japanese || "",
                comment: req.body.comment || "",
            };
            console.log(newWord.comment);
            const errorMsgs = {
                english: (newWord.english) ? "" : "英語を入力してください。",
                japanese: (newWord.japanese) ? "" : "日本語を入力してください。",
            };

            if (errorMsgs.english !== "" || errorMsgs.japanese !== "") {
                res.render("./mypage.ejs", { userId: userId, name: name, email: email, newWord: newWord, errorMsgs: errorMsgs });
                return;
            }

            // check exist word
            let existWord = null;
            if (userDocument.words) {
                const words = userDocument.words;
                words.forEach(elem => {
                    if (elem.english === newWord.english) {
                        existWord = elem;
                    }
                });
            }
            if (existWord !== null) {
                // const name = userDocument.name;
                // const email = userDocument.email;
                errorMsgs.english = "この単語はすでに登録されています。";
                console.log(newWord);
                return res.render("./mypage.ejs", { userId: userId, name: name, email: email, newWord: newWord, errorMsgs: errorMsgs });
            }

            query = [
                { userId: userId }, // filter
                { $push: { words: newWord } }, // action
                { upsert: true, returnDocument: "after" }, // options
            ];
            const modifiedData = await userCollection.findOneAndUpdate(...query);
            console.log(modifiedData.lastErrorObject.updatedExisting);
            if (!modifiedData.lastErrorObject.updatedExisting) return res.send("登録失敗");
            console.log(`new words inserted.`);
            return res.redirect("/wordadded");

        }
        catch (e) {
            next(e);
        }
        finally {
            client.close();
        }
    })();
});

router.get("/words", (req, res, next) => {
    (async () => {
        try {
            // ログインチェック
            if (!req.session.userId) return res.redirect("/login");

            // get user data
            await client.connect();
            const db = client.db(settings.mongoDbName);
            const userCollection = db.collection(settings.usersCollectionName);

            const userId = req.session.userId;
            const query = { userId: userId };
            const userDocument = await userCollection.findOne(query);
            if (userDocument === null) throw new Error("user data not found.");

            let words = userDocument.words;
            if (!words) {
                return res.sendFile("/home/ec2-user/environment/app/html/nowords.html");
            }
            else {
                // sort alphabetically
                words = userDocument.words.sort((a, b) => {
                    a = a.english.toString().toLowerCase();
                    b = b.english.toString().toLowerCase();
                    if (a < b) return -1;
                    else if (a > b) return 1;
                    return 0;
                });
                return res.render("./words.ejs", { words: words });
            }

        }
        catch (e) {
            next(e);
        }
        finally {
            client.close();
        }
    })();
});

router.get("/questions", (req, res, next) => {

    (async () => {
        try {
            // ログインチェック
            if (!req.session.userId) return res.redirect("/login");

            // get user data
            await client.connect();
            const db = client.db(settings.mongoDbName);
            const userCollection = db.collection(settings.usersCollectionName);

            const userId = req.session.userId;
            const query = { userId: userId };
            const userDocument = await userCollection.findOne(query);
            if (userDocument === null) throw new Error("user data not found.");

            let words = userDocument.words;
            if (!words) {
                return res.sendFile("/home/ec2-user/environment/app/html/nowords.html");
            }
            else {
                // random sort
                for (let i = words.length - 1; i >= 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [words[i], words[j]] = [words[j], words[i]];
                }
                return res.render("./questions.ejs", { words: words });
            }



        }
        catch (e) {
            next(e);
        }
        finally {

        }
    })();

});

module.exports = router;
