const express = require("express");
const { Post, User } = require("../models");
const getHasNext = require("../utils/getHasNext.js");
const upload = require("../middleware/upload.js");
const s3 = require("../aws.js");

const router = express.Router();
const Bucket = process.env.BUCKET;

router.get("/", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { cursor, limit } = req.query;
    const filter = cursor ? { _id: { $lt: cursor } } : {};
    const posts = await Post.find(filter)
      .populate({ path: "writer", select: "id name photoUrl" })
      .sort({ _id: -1 })
      .limit(limit);
    const hasNext = await getHasNext(Post, filter, limit);
    res.send({ posts, hasNext });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.get("/bookmark", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { cursor, limit } = req.query;
    const user = await User.findById(req.userId).populate({
      path: "bookmarks",
      populate: { path: "writer", select: "id name photoUrl" },
      match: cursor ? { _id: { $lt: cursor } } : {},
      options: {
        sort: { _id: -1 },
        limit,
      },
    });
    const hasNext = user.bookmarks.length === Number(limit);
    res.send({ posts: user.bookmarks, hasNext });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id } = req.params;
    const { cursor, limit } = req.query;
    const user = await User.findById(id).populate({
      path: "posts",
      populate: { path: "writer", select: "id name photoUrl" },
      match: cursor ? { _id: { $lt: cursor } } : {},
      options: {
        sort: { _id: -1 },
        limit,
      },
    });
    const hasNext = user.posts.length === Number(limit);
    res.send({ posts: user.posts, hasNext });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.post("/", upload.array("image"), async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { ratio, contents = "" } = req.body;
    const images = req.files.map((file) => ({
      url: file.location,
      key: file.key,
    }));
    const post = await Post.create({
      contents,
      images,
      ratio,
      writer: req.userId,
    });
    await Post.populate(post, { path: "writer", select: "id name photoUrl" });
    await User.findByIdAndUpdate(req.userId, {
      $inc: { postCount: 1 },
      $push: { posts: post._id },
    });
    res.send({ post });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id } = req.params;
    const post = await Post.findByIdAndRemove(id);
    await Promise.all(
      post.images.map((image) => {
        return s3.deleteObject({ Bucket, Key: image.key }).promise();
      })
    );
    await User.findByIdAndUpdate(req.userId, {
      $inc: { postCount: -1 },
      $pull: { posts: id },
    });
    res.send({ id });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id } = req.params;
    const { title, contents, deletedKeys } = req.body;

    let post = await Post.findById(id);
    post.title = title;
    post.contents = contents;

    if (deletedKeys.length > 1) {
      await Promise.all(
        deletedKeys.map((deletedKey) =>
          s3.deleteObject({ Bucket, Key: deletedKey }).promise()
        )
      );
      deletedKeys.forEach((deletedKey) => {
        post.images = post.images.filter((image) => image.key !== deletedKey);
      });
    }
    post = await post.save();
    res.send({ post });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.patch("/:id/like", async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    const { id } = req.params;
    const { isLiked } = req.body;
    const post = await Post.findByIdAndUpdate(
      id,
      {
        [isLiked ? "$pull" : "$push"]: { likeUsers: req.userId },
      },
      { new: true }
    ).populate({ path: "writer", select: "id name photoUrl" });
    res.send({ likeUsers: post.likeUsers });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.post("/test", upload.single("photo"), async (req, res) => {
  try {
    if (!req.sessionId) throw new Error("Invalid Session");
    res.send();
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
