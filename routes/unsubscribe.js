"use strict";
const express = require('express');
const router = express.Router();
const settings = require("/home/ec2-user/environment/app/config/settings.js");
const { MongoClient } = require('mongodb');
const client = new MongoClient(settings.mongoUrl);

router.get("/", (req, res, next) => {
    return res.sendFile("/home/ec2-user/environment/app/html/unsubscribe.html");
});

router.post("/", (req, res, next) => {

    if (!req.session.userId) return next("not login user.");

    (async () => {
        try {
            await client.connect();
            const db = client.db(settings.mongoDbName);
            const userCollection = db.collection(settings.usersCollectionName);

            const userId = req.session.userId;
            const query = { userId: userId };
            const result = await userCollection.deleteOne(query);
            console.log("user data deleted. result ↓");
            console.log(result);

            await req.session.destroy(e => { if (e) { return e } });
            console.log("session destroyed.");

            return res.sendFile("/home/ec2-user/environment/app/html/unsubscribed.html");
        }
        catch (e) {
            next(e);
        }
        finally {
            client.close();
        }
    })();
});

module.exports = router;
