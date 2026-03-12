import type { NextFunction, Request, Response } from "express";

const express = require("express") as typeof import("express");
const router = express.Router();
const path = require("path") as typeof import("path");

router.get("/", function (_req: Request, res: Response, _next: NextFunction) {
  res.sendFile("/index.html", {
    root: path.join(__dirname, "../public"),
  });
});

router.get(
  "/play/",
  function (_req: Request, res: Response, _next: NextFunction) {
  res.sendFile("/index.html", {
    root: path.join(__dirname, "../public"),
  });
  }
);

router.get(
  "/welcome/",
  function (_req: Request, res: Response, _next: NextFunction) {
  res.sendFile("/index.html", {
    root: path.join(__dirname, "../public"),
  });
  }
);

router.get(
  "/waiting-room/",
  function (_req: Request, res: Response, _next: NextFunction) {
  res.sendFile("/index.html", {
    root: path.join(__dirname, "../public"),
  });
  }
);

module.exports = router;
