"use strict";
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const settings = require("/home/ec2-user/environment/app/config/settings.js");
const { MongoClient } = require('mongodb');
const client = new MongoClient(settings.mongoUrl);

router.get("/", (req, res) => {
    const userValues = {};
    const errorMsgs = {};
    res.render("./signup.ejs", { userValues: userValues, errorMsgs: errorMsgs }); // views ディレクトリから相対パス
});

router.post("/", (req, res, next) => {
    // value check
    const userValues = {
        name: req.body.name || "",
        email: req.body.email || "",
        password: req.body.password || "",
    };
    const errorMsgs = {
        name: (userValues.name) ? "" : "お名前を入力してください。",
        email: (userValues.email) ? "" : "メールアドレスを入力してください。",
        password: (userValues.password) ? "" : "パスワードを入力してください。",
    };
    const pattern = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]+.[A-Za-z0-9]+$/;
    if (errorMsgs.email === "" && !pattern.test(userValues.email)) {
        errorMsgs.email = "正しい形式で入力してください。";
    }
    if (errorMsgs.password === "" && userValues.password.length < 4) errorMsgs.password = "4文字以上で入力してください。";
    if (errorMsgs.name !== "" || errorMsgs.email !== "" || errorMsgs.password !== "") {
        res.render("./signup.ejs", { userValues: userValues, errorMsgs: errorMsgs });
        return;
    }
    (async () => {
        try {
            await client.connect();
            const db = client.db(settings.mongoDbName);
            const userCollection = db.collection(settings.usersCollectionName);

            // check email
            let query = { email: userValues.email };
            const userDocument = await userCollection.findOne(query);
            if (userDocument !== null) {
                errorMsgs.email = "このメールアドレスは登録は登録済みです。";
                res.render("./signup.ejs", { userValues: userValues, errorMsgs: errorMsgs });
                return;
            }

            // password hash
            const hash = await bcrypt.hash(userValues.password, settings.saltRounds);
            userValues.password = hash;

            // get user id sequence
            const sequenceCollectioin = db.collection(settings.sequenceCollectionName);
            query = [
                { id: "user_id" }, // filter
                { $inc: { "sequence": 1 } }, // action
                { upsert: false, returnDocument: "after" }, // options
            ];
            const modifiedData = await sequenceCollectioin.findOneAndUpdate(...query);
            const newUserId = modifiedData.value.sequence;
            console.log(`sequence updated. => ${newUserId}`);
            userValues.userId = newUserId;
            await userCollection.insertOne(userValues);
            console.log("user data inserted.");

            // submit success, session start
            await req.session.regenerate((e) => { if (e) throw new Error(e) });
            req.session.userId = newUserId;
            await req.session.save((e) => { if (e) throw new Error(e) });
            console.log(`session saved. => sessionId: ${req.session.id}`);
            res.redirect("/success");
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

module.exports = router;
