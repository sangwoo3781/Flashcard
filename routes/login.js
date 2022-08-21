"use strict";
const express = require('express');
const router = express.Router();
const settings = require("/home/ec2-user/environment/app/config/settings.js");
const { MongoClient } = require('mongodb');
const client = new MongoClient(settings.mongoUrl);
const bcrypt = require('bcrypt');

router.get("/", (req, res, next) => {
    // check login
    if (req.session.userId) return res.redirect("/mypage");
    const userValues = {};
    const errorMsgs = {};
    res.render("./login.ejs", { userValues: userValues, errorMsgs: errorMsgs });
    return;
});

router.post("/", (req, res, next) => {
    // value check
    const userValues = {
        email: req.body.email || "",
        password: req.body.password || "",
    };
    const errorMsgs = {
        email: (userValues.email) ? "" : "メールアドレスを入力してください。",
        password: (userValues.password) ? "" : "パスワードを入力してください。",
    };
    const pattern = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]+.[A-Za-z0-9]+$/;
    if (errorMsgs.email === "" && !pattern.test(userValues.email)) {
        errorMsgs.email = "正しい形式で入力してください。";
    }
    if (errorMsgs.password === "" && userValues.password.length < 8) errorMsgs.password = "8文字以上で入力してください。";
    if (errorMsgs.email !== "" || errorMsgs.password !== "") {
        res.render("./login.ejs", { userValues: userValues, errorMsgs: errorMsgs });
        return;
    }
    (async () => {
        try {
            await client.connect();
            const db = client.db(settings.mongoDbName);
            const userCollection = db.collection(settings.usersCollectionName);

            // check email
            const query = { email: userValues.email };
            const userDocument = await userCollection.findOne(query);
            if (userDocument === null) {
                errorMsgs.email = "このメールアドレスは登録は登録されていません。";
                res.render("./login.ejs", { userValues: userValues, errorMsgs: errorMsgs });
                return;
            }

            // check password
            const match = await bcrypt.compare(userValues.password, userDocument.password);
            if (!match) {
                errorMsgs.password = "パスワードが正しくありません。";
                res.render("./login.ejs", { userValues: userValues, errorMsgs: errorMsgs });
                return;
            }

            // login success, session start
            await req.session.regenerate((e) => { if (e) return e });
            req.session.userId = userDocument.userId;
            await req.session.save((e) => { if (e) console.log(e) });
            console.log(`session saved. => sessionId: ${req.session.id}`);
            res.redirect("/mypage");
            return;
        }
        catch (e) {
            return next(e);
        }
        finally {
            await client.close();
            return;
        }
    })();
});

module.exports = router;
