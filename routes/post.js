const express = require("express");
const { Post } = require("../models");
const getPaging = require("../utils/getPaging.js");
const upload = require("../middleware/upload.js");
const s3 = require("../aws.js");

const router = express.Router();
const Bucket = process.env.BUCKET;

router.get("/", async (req, res) => {
  if (!req.sessionId) throw new Error("인증 실패");
  try {
    const { cursor, limit } = req.query;
    const posts = await Post.find(cursor ? { _id: { $lt: cursor } } : {})
      .populate("writer", "-password")
      .sort({ _id: -1 })
      .limit(limit);
    const paging = await getPaging(Post, cursor, limit);
    res.send({ message: "success", posts, paging });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  if (!req.sessionId) throw new Error("인증 실패");
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate("writer", "-password");
    res.send({ message: "success", post });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.post("/", upload.array("image"), async (req, res) => {
  if (!req.sessionId) throw new Error("인증 실패");
  try {
    const { title, contents = "" } = req.body;
    const images = req.files.map((file) => ({
      url: file.location,
      key: file.key,
    }));
    const post = await Post.create({
      title,
      contents,
      images,
      writer: req.user.id,
    });
    res.send({ message: "success", post });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  if (!req.sessionId) throw new Error("인증 실패");
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndRemove(id);
    await Promise.all(
      post.images.map((image) => {
        return s3.deleteObject({ Bucket, Key: image.key }).promise();
      })
    );
    res.send({ message: "success" });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.patch("/:id", async (req, res, next) => {
  if (!req.sessionId) throw new Error("인증 실패");
  try {
    const { id } = req.params;
    const { title, contents, deletedKeys } = req.body;

    const post = await Post.findByIdAndUpdate(
      id,
      { title, contents },
      { new: true }
    );

    if (deletedKeys.length < 1) {
      res.send({ message: "success" });
    } else {
      req.body = {
        id,
        deletedKeys,
        images: post.images,
      };
      next();
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    let { id, deletedKeys, images } = req.body;

    deletedKeys.forEach((deletedKey) => {
      images = images.filter((image) => image.key !== deletedKey);
    });

    await Post.findByIdAndUpdate(id, { images });

    await Promise.all(
      deletedKeys.map((deletedKey) =>
        s3.deleteObject({ Bucket, Key: deletedKey }).promise()
      )
    );

    res.send({ message: "success" });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
