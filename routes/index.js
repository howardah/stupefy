const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/:type(welcome|play|waiting-room)/", function (req, res, next) {
  res.sendFile("/index.html", {
    root: path.join(__dirname, "../public"),
  });
});

module.exports = router;
