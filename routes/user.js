const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models");

const router = express.Router();

router.get("/me", async (req, res) => {
  if (!req.sessionId) throw new Error("세션이 존재하지 않습니다.");
  try {
    res.send({ message: "success", user: req.user });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash });
    res.send({ message: "success" });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.patch("/edit", async (req, res) => {
  if (!req.sessionId) throw new Error("세션이 존재하지 않습니다.");
  try {
    const doc = {};
    Object.keys(req.body).forEach((key) => {
      doc[key] = req.body[key];
    });
    const user = await User.findByIdAndUpdate(req.user.id, doc, {
      new: true,
    });
    res.send({ message: "success", user });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
