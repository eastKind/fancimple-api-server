const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models");
const upload = require("../middleware/upload.js");

const router = express.Router();

// get me
router.get("/", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    res.send({ message: "success", user: req.user });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
  }
});

// get other
router.get("/:id", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id } = req.params;
    const user = await User.findById(id);
    res.send({ message: "success", user });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
  }
});

// sign up
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

// modify profile
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

// follow
router.patch("/follow", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { targetId } = req.body;
    await User.findByIdAndUpdate(targetId, {
      $push: { followers: req.user.id },
    });
    await User.findByIdAndUpdate(req.user.id, {
      $push: { followings: targetId },
    });
    res.send({ message: "success" });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
  }
});

module.exports = router;
