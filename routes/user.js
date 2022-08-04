const express = require("express");
const bcrypt = require("bcrypt");
const { User } = require("../models");
const upload = require("../middleware/upload");
const s3 = require("../aws");

const router = express.Router();

// get me
router.get("/me", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const user = await User.findById(req.userId).select("-password");
    res.send({ user });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// get user
router.get("/:id", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    res.send({ user });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// sign up
router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash });
    res.send();
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// modify photo
router.patch("/photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    await s3
      .deleteObject({ Bucket: "eastkind-sns", Key: req.body.key })
      .promise();
    const user = await User.findByIdAndUpdate(
      req.userId,
      { photoUrl: req.file.location },
      {
        new: true,
      }
    );
    res.send({ user });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// modify profile
router.patch("/", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { name, password } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, password },
      { new: true }
    );
    res.send({ user });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// follow
router.patch("/follow", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { userId: targetId, isFollowed } = req.body;
    const query = isFollowed ? "$pull" : "$push";
    const other = await User.findByIdAndUpdate(
      targetId,
      {
        [query]: { followers: req.userId },
      },
      { new: true }
    );
    const me = await User.findByIdAndUpdate(
      req.userId,
      {
        [query]: { followings: targetId },
      },
      { new: true }
    );
    res.send({ followers: other.followers, followings: me.followings });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// bookmark
router.patch("/bookmark", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { postId, isMarked } = req.body;
    const query = isMarked ? "$pull" : "$push";
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        [query]: { bookmarks: postId },
      },
      { new: true }
    );
    res.send({ bookmarks: user.bookmarks });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
