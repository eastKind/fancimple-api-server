const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models");
const upload = require("../middleware/upload.js");

const router = express.Router();

// get me
router.get("/", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const user = User.findById(req.userId)
      .populate({
        path: "followings",
        select: "_id name photoUrl",
        options: {
          limit: 10,
        },
      })
      .populate({
        path: "followers",
        select: "_id name photoUrl",
        options: {
          limit: 10,
        },
      })
      .populate({
        path: "posts",
        select: "_id thumbnail likeCount commentCount",
        opptions: {
          limit: 10,
        },
      });
    res.send({ message: "success", user });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
  }
});

// get other
router.get("/:id", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id } = req.params;
    const user = await User.findById(id)
      .populate({
        path: "followings",
        select: "_id name photoUrl",
        options: {
          limit: 10,
        },
      })
      .populate({
        path: "followers",
        select: "_id name photoUrl",
        options: {
          limit: 10,
        },
      })
      .populate({
        path: "posts",
        select: "_id thumbnail likeCount commentCount",
        opptions: {
          limit: 10,
        },
      });
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
    const user = await User.findByIdAndUpdate(req.userId, doc, {
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
      $push: { followers: req.userId },
    });
    await User.findByIdAndUpdate(req.userId, {
      $push: { followings: targetId },
    });
    res.send({ message: "success" });
  } catch (error) {
    res.status(400).send({ message: "failure", error });
  }
});

module.exports = router;
