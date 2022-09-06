const express = require("express");
const { isValidObjectId } = require("mongoose");
const bcrypt = require("bcrypt");
const { User } = require("../models");
const upload = require("../middleware/upload");
const auth = require("../middleware/authenticate");
const s3 = require("../aws");
const getHasNext = require("../utils/getHasNext");

const router = express.Router();

// get me
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "-password -posts -email"
    );
    res.send({ user });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// get user
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (isValidObjectId(id)) {
      const user = await User.findById(id).select(
        "-password -posts -email -bookmarks -searchHistories"
      );
      return res.send({ user });
    }
    res.status(404).send("존재하지 않는 사용자입니다.");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// get users
router.get("/", async (req, res) => {
  try {
    const { keyword, cursor, limit } = req.query;
    const filter = { name: { $regex: keyword } };
    if (cursor) filter._id = { $lt: cursor };
    const users = await User.find(filter)
      .select("id name photoUrl desc")
      .sort({ _id: -1 })
      .limit(limit);
    const hasNext = await getHasNext(User, filter, limit);
    res.send({ users, hasNext });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// get followers
router.get("/followers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cursor, limit } = req.query;
    const user = await User.findById(id).populate({
      path: "followers",
      select: "id name photoUrl desc",
      match: cursor ? { _id: { $lt: cursor } } : {},
      options: {
        sort: { _id: -1 },
        limit,
      },
    });
    const hasNext = user.followers.length === Number(limit);
    res.send({ users: user.followers, hasNext });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// get followings
router.get("/followings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cursor, limit } = req.query;
    const user = await User.findById(id).populate({
      path: "followings",
      select: "id name photoUrl desc",
      match: cursor ? { _id: { $lt: cursor } } : {},
      options: {
        sort: { _id: -1 },
        limit,
      },
    });
    const hasNext = user.followings.length === Number(limit);
    res.send({ users: user.followings, hasNext });
  } catch (error) {
    res.status(500).send(error.message);
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
    res.status(500).send(error.message);
  }
});

// change photo
router.patch("/photo", auth, upload.single("photo"), async (req, res) => {
  try {
    if (req.body.key !== "default_photo.png") {
      await s3
        .deleteObject({ Bucket: process.env.BUCKET, Key: req.body.key })
        .promise();
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { photoUrl: req.file.location },
      {
        new: true,
      }
    );
    res.send({ photoUrl: user.photoUrl });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// change name
router.patch("/name", auth, async (req, res) => {
  try {
    const { name } = req.body;
    const isExist = await User.findOne({ name });
    if (!isExist) {
      const user = await User.findByIdAndUpdate(
        req.userId,
        { name },
        { new: true }
      );
      res.send({ name: user.name });
    } else {
      res.status(400).send("이미 존재하는 이름입니다.");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// change desc
router.patch("/desc", auth, async (req, res) => {
  try {
    const { desc } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { desc },
      { new: true }
    );
    res.send({ desc: user.desc });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// change password
router.patch("/password", auth, async (req, res) => {
  try {
    const { current, next } = req.body;
    let user = await User.findById(req.userId);
    const match = await bcrypt.compare(current, user.password);
    if (match) {
      user.password = await bcrypt.hash(next, 10);
      user = await user.save();
      res.send();
    } else {
      res.status(400).send("현재 비밀번호가 일치하지 않습니다.");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// follow
router.patch("/follow", auth, async (req, res) => {
  try {
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
    res.send({ followings: me.followings, followers: other.followers });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// bookmark
router.patch("/bookmark", auth, async (req, res) => {
  try {
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
    res.status(500).send(error.message);
  }
});

// validate
router.post("/validate", async (req, res) => {
  try {
    const { name, email } = req.body;
    const filter = {};
    if (name) filter.name = name;
    if (email) filter.email = email;
    const user = await User.findOne(filter);
    const caution = user ? `중복된 ${name ? "이름" : "이메일"}입니다.` : "";
    res.send({ caution });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// add search history
router.post("/history/search", auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $push: { searchHistories: userId },
      },
      { new: true }
    ).populate({
      path: "searchHistories",
      select: "id name photoUrl desc",
    });
    res.send({ histories: user.searchHistories });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// get search history
router.get("/history/search", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: "searchHistories",
      select: "id name photoUrl desc",
    });
    res.send({ histories: user.searchHistories });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// clear search history
router.delete("/history/search", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.searchHistories = [];
    await user.save();
    res.send();
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
