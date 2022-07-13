const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models");
const upload = require("../middleware/upload.js");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    res.send({ message: "success", user: req.user });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash });
    res.send({ message: "success" });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
  }
});

router.patch("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { name, password } = req.body;
    const doc = { name, password };
    if (req.file) doc.photoUrl = req.file.location;
    const user = await User.findByIdAndUpdate(req.user.id, doc, {
      new: true,
    });
    res.send({ message: "success", user });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
  }
});

module.exports = router;
