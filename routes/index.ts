const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/", function (req, res, next) {
  res.sendFile("/index.html", {
    root: path.join(__dirname, "../public"),
  });
});

router.get("/play/", function (req, res, next) {
  res.sendFile("/index.html", {
    root: path.join(__dirname, "../public"),
  });
});

router.get("/welcome/", function (req, res, next) {
  res.sendFile("/index.html", {
    root: path.join(__dirname, "../public"),
  });
});

router.get("/waiting-room/", function (req, res, next) {
  res.sendFile("/index.html", {
    root: path.join(__dirname, "../public"),
  });
});

module.exports = router;
