"use strict";
const express = require('express');
const router = express.Router();

router.all("/", (req, res, next) => {
    (async () => {
        try {
            await req.session.destroy(e => { if (e) { return e } });
            return res.redirect("/");
        }
        catch (e) {
            next(e);
        }
    })();
});

module.exports = router;
